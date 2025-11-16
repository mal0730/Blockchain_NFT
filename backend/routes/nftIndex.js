import express from "express";
import fetch from "node-fetch"; // npm i node-fetch@2 (v2 for common usage) or native fetch in newer Node
const router = express.Router();

// GET /api/nft/all?owner=<address>&pageKey=<pageKey optional>
router.get("/all", async (req, res) => {
  try {
    const owner = req.query.owner;
    if (!owner) return res.status(400).json({ error: "Missing owner query param" });

    const pageKey = req.query.pageKey || "";
    const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
    const BASE = process.env.ALCHEMY_BASE || "https://eth-sepolia.g.alchemy.com/nft/v2";

    // Alchemy GET endpoint: getNFTs
    // Docs: https://docs.alchemy.com/reference/nft-api-quickstart
    let url = `${BASE}/${ALCHEMY_KEY}/getNFTs/?owner=${owner}&withMetadata=true`;
    if (pageKey) url += `&pageKey=${pageKey}`;

    const r = await fetch(url);
    if (!r.ok) {
      const txt = await r.text();
      console.error("Alchemy error:", r.status, txt);
      return res.status(500).json({ error: "Failed to fetch from Alchemy" });
    }

    const data = await r.json();
    // data: { ownedNfts: [...], pageKey, totalCount? ... }

    // Normalize items to what frontend expects
    const items = (data.ownedNfts || []).map((n) => {
      // alchemy returns .metadata (if withMetadata=true) and .tokenUri?.gateway
      const tokenId = n.id.tokenId ? BigInt(n.id.tokenId).toString(10) : (n.id.tokenId || "");
      const tokenAddress = n.contract?.address;
      const metadata = n.metadata || {};
      // image may be in metadata.image or tokenUri.gateway
      let image = metadata.image || (n.tokenUri && n.tokenUri.gateway) || null;
      if (image && image.startsWith("ipfs://")) image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

      return {
        tokenId,
        tokenAddress,
        title: metadata.name || `${n.contract?.name || "NFT"} #${tokenId}`,
        description: metadata.description || "",
        image,
        rawMetadata: metadata,
      };
    });

    res.json({
      items,
      pageKey: data.pageKey || null,
      totalCount: data.totalCount || null
    });
  } catch (err) {
    console.error("Error /api/nft/all:", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;
