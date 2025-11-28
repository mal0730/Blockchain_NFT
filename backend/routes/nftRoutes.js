// (File: backend/routes/nftRoutes.js)
import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { handleMint } from "../controllers/nftController.js"; // (Đổi tên/tách file)
import { saveMintedNFT } from "../controllers/nftDatabaseController.js";
import NFT from "../models/NFT.js";
import Activity from "../models/Activities.js";

const router = express.Router();

// --- ROUTE GHI (WRITE) ---
// Frontend gọi để lấy tokenURI
router.post("/mint", upload.single("image"), handleMint);

router.post("/save", saveMintedNFT);

// --- ROUTE ĐỌC (READ) TỪ MONGODB ---

// Endpoint cho "My Collection"
router.get("/collection/:address", async (req, res) => {
  const nfts = await NFT.find({ owner: req.params.address.toLowerCase() });
  res.json({ success: true, items: nfts });
});

// Endpoint cho "Chợ" (Marketplace)
router.get("/marketplace", async (req, res) => {
  const nfts = await NFT.find({
    $or: [{ isListed: true }, { isAuctionActive: true }],
  });
  res.json({ success: true, items: nfts });
});

// Endpoint cho "NFT Detail" (Sửa lỗi 404/HTML)
router.get("/detail/:tokenId", async (req, res) => {
  const nft = await NFT.findOne({ tokenId: req.params.tokenId });
  if (!nft) return res.status(404).json({ error: "Không tìm thấy NFT" });
  res.json({ success: true, item: nft });
});

// Endpoint cho "Activities" - Lấy tất cả hoạt động
router.get("/activities", async (req, res) => {
  try {
    const activities = await Activity.find({})
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
      .limit(1000); // Giới hạn 1000 activities gần nhất
    res.json({ success: true, activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
