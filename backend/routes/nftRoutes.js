import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { handleMint } from "../controllers/nftController.js";

const router = express.Router();

// Mint NFT: upload image + metadata
router.post("/mint", upload.single("image"), handleMint);

router.post('/save', saveMintedNFT);

export default router;
