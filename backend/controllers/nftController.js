import fs from "fs";
import { pinataUploadFile, pinataUploadJSON } from "../services/pinataService.js";

export const handleMint = async (req, res) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // 1️⃣ Upload ảnh lên Pinata
    const imageResult = await pinataUploadFile(req.file.path);
    const imageUrl = `ipfs://${imageResult.IpfsHash}`;

    fs.unlinkSync(req.file.path);

    console.log("✅ Image uploaded to Pinata:", imageUrl);

    // 2️⃣ Upload metadata lên Pinata
    const metadata = {
      name: req.body.name,
      description: req.body.description || "",
      image:  imageUrl,
    };

    const metadataResult = await pinataUploadJSON(metadata);
    const tokenURI = `ipfs://${metadataResult.IpfsHash}`;
    console.log("✅ Metadata uploaded to Pinata:", tokenURI);

    // 3️⃣ Trả về tokenURI cho frontend
    res.json({ tokenURI: tokenURI, imageUrl: imageUrl });

  } catch (err) {
    console.error("❌ Error in handleMint:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to upload NFT metadata" });
  }
};