import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Connect to Polygon Amoy RPC
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Wallet for signing transactions
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Smart contract ABI
const abi = [
  "function storeScan(string memory _fileHash, string memory _fileURL)"
];

// Contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

// Store scan hash on blockchain
export async function storeOnBlockchain(s3Url, hash) {

  try {

    console.log("🟡 Sending transaction to blockchain...");

    const tx = await contract.storeScan(hash, s3Url);

    console.log("🟡 Transaction submitted");

    const receipt = await tx.wait();

    console.log("🟢 Transaction confirmed");

    return receipt.hash;

  } catch (error) {

    console.error("❌ Blockchain error");
    throw error;

  }
}