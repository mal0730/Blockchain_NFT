import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { handleMint } from "../controllers/nftController.js";
import fetch from "node-fetch";

const router = express.Router();

// Mint NFT: upload image + metadata
router.post("/mint", upload.single("image"), handleMint);

// Lấy NFT của user bằng Alchemy NFT REST API
router.get("/my-nfts", async (req, res) => {
  try {
    const owner = req.query.owner;
    if (!owner) return res.status(400).json({ error: "Missing owner address" });

    // REST endpoint chính xác
    const url = `https://eth-sepolia.g.alchemy.com/nft/v2/${process.env.ALCHEMY_API_KEY}/getNFTs?owner=${owner}&withMetadata=true`;

    console.log("🔍 Calling Alchemy:", url);

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Alchemy returned error:", text);
      return res.status(500).json({ error: "Failed to fetch NFTs from Alchemy" });
    }

    const data = await response.json();

    // map dữ liệu về dạng dễ dùng cho frontend
    const nfts = (data.ownedNfts || []).map((nft) => ({
      contractAddress: nft.contract.address,
      tokenId: parseInt(nft.id.tokenId, 16), // hex → decimal
      title: nft.title || "",
      description: nft.description || "",
      image: nft.media?.[0]?.gateway || "", // fallback nếu media trống
    }));

    res.json(nfts);
  } catch (err) {
    console.error("❌ Error fetching NFTs:", err);
    res.status(500).json({ error: "Failed to fetch NFTs" });
  }
});

export default router;
