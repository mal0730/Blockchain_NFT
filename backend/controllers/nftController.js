import fs from "fs";
import { pinataUploadFile, pinataUploadJSON } from "../services/pinataService.js";

export const handleMint = async (req, res) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // 1️⃣ Upload ảnh lên Pinata
    const imageResult = await pinataUploadFile(req.file.path);

    // Xóa file tạm
    fs.unlinkSync(req.file.path);

    console.log("✅ Image uploaded to Pinata:", imageResult.IpfsHash);

    // 2️⃣ Upload metadata lên Pinata
    const metadata = {
      name: req.body.name,
      description: req.body.description || "",
      image: `ipfs://${imageResult.IpfsHash}`,
    };

    const metadataResult = await pinataUploadJSON(metadata);
    console.log("✅ Metadata uploaded to Pinata:", metadataResult.IpfsHash);

    // 3️⃣ Trả về tokenURI cho frontend
    res.json({ tokenURI: `ipfs://${metadataResult.IpfsHash}` });

  } catch (err) {
    console.error("❌ Error in handleMint:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to upload NFT metadata" });
  }
};