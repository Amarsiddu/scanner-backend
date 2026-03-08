import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const abi = [
  "function storeScan(string memory _fileHash, string memory _fileURL)"
];

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

export async function storeOnBlockchain(s3Url, hash) {
  const tx = await contract.storeScan(hash, s3Url);
  await tx.wait();
  return tx.hash;
}