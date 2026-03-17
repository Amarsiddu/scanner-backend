import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { storeOnBlockchain } from "./blockchain.js";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
dotenv.config();

const app = express();
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
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ========================
// Auth Routes
// ========================
app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
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

    // Validate extension
    const ext = fileName.split(".").pop().toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "ply"];

    if (!allowed.includes(ext)) {
      return res.status(400).json({
        error: "Unsupported file type"
      });
    }

    // Organize S3 uploads
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      ContentType:
        ext === "ply"
          ? "model/ply"
          : ext === "png"
          ? "image/png"
          : "image/jpeg"
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600
    });

    res.json({
      url: signedUrl,
      key: key
    });

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

    // Prevent tiny files
    if (fileBuffer.length < 10000) {
      return res.status(400).json({
        error: "File too small"
      });
    }

    // Hash file
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Store on blockchain
    const txHash = await storeOnBlockchain(s3Url, hash);

    res.json({
      success: true,
      txHash
    });

  } catch (error) {

    console.error("Blockchain Error:", error);

    res.status(500).json({
      success: false,
      error: "Blockchain failed"
    });

  }
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});