import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { storeOnBlockchain } from "./blockchain.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// Use cloud port if deployed
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// ========================
// MongoDB Connection
// ========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

// ========================
// Auth Routes
// ========================
app.use("/auth", authRoutes);

// ========================
// AWS S3 Setup
// ========================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ========================
// Health Check
// ========================
app.get("/", (req, res) => {
  res.send("✅ Scanner Backend Running");
});

// ========================
// Generate S3 Presigned URL
// ========================
app.post("/presign", async (req, res) => {
  try {

    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "fileName required" });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      ContentType: "application/octet-stream",
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    res.json({ url: signedUrl });

  } catch (error) {

    console.error("Presign Error:", error);
    res.status(500).json({ error: "Presign failed" });

  }
});

// ========================
// Upload Complete → Blockchain
// ========================
app.post("/upload-complete", async (req, res) => {
  try {

    const { s3Url, fileBufferBase64 } = req.body;

    if (!s3Url || !fileBufferBase64) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const fileBuffer = Buffer.from(fileBufferBase64, "base64");

    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    const txHash = await storeOnBlockchain(s3Url, hash);

    res.json({
      success: true,
      txHash,
    });

  } catch (error) {

    console.error("Blockchain Error:", error);

    res.status(500).json({
      success: false,
      error: "Blockchain failed",
    });

  }
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});