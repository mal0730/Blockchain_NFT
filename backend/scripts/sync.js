// (File: backend/scripts/sync.js)

import 'dotenv/config'; 
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import connectDB from '../db/connect.js'; 
import NFT from '../models/NFT.js';       
import Activity from '../models/Activities.js'; 
import contractData from '../NFTMarketPlace.json' with { type: 'json' }; 

// --- Cấu hình ---
const CONTRACT_ADDRESS = "0x260cC80dC1e4D6075dD205CbA665Ad38F2aF961e";
const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL_SEPOLIA; 
const MONGODB_URI = process.env.MONGODB_URI;
const START_BLOCK = 9573561; // Khối bắt đầu (Token ID #1)

// --- Kiểm tra Biến Môi trường ---
if (!ALCHEMY_RPC_URL || !MONGODB_URI) {
    console.error("❌ LỖI: Thiếu ALCHEMY_RPC_URL hoặc MONGODB_URI. Vui lòng kiểm tra file .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);

// (Hàm fetchMetadata giữ nguyên...)
const fetchMetadata = async (tokenURI) => {
    const httpUrl = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    try {
        const response = await fetch(httpUrl);
        if (!response.ok) {
            const publicHttpUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
            const publicResponse = await fetch(publicHttpUrl);
            if (!publicResponse.ok) throw new Error(`HTTP error! status: ${publicResponse.status}`);
            const metadata = await publicResponse.json();
            const imageUrl = metadata.image ? metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/") : "";
             return {
                name: metadata.name || "Không có tên",
                description: metadata.description || "",
                imageUrl: imageUrl,
                attributes: metadata.attributes || []
            };
        }
        const metadata = await response.json();
        const imageUrl = metadata.image ? metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : "";
        return {
            name: metadata.name || "Không có tên",
            description: metadata.description || "",
            imageUrl: imageUrl,
            attributes: metadata.attributes || []
        };
    } catch (error) {
        console.error(`Lỗi tải metadata từ ${httpUrl}:`, error.message);
        return { name: "Lỗi tải metadata", description: "", imageUrl: "" };
    }
};

// --- Hàm Đồng bộ hóa Chính ---
const syncDatabase = async () => {
    console.log("Bắt đầu đồng bộ hóa lịch sử NFT...");

    try {
        await connectDB(MONGODB_URI);

        const latestBlock = await provider.getBlockNumber();
        console.log(`Đang quét từ khối ${START_BLOCK} đến khối mới nhất: ${latestBlock}`);

        // ✅ BƯỚC 1: SỬA KÍCH THƯỚC LÔ QUÉT (CHUNK_SIZE)
        // Alchemy Free Tier chỉ cho phép 10 khối (0-9). Đặt là 9 để an toàn.
        const CHUNK_SIZE = 9; 

        for (let fromBlock = START_BLOCK; fromBlock <= latestBlock; fromBlock += (CHUNK_SIZE + 1)) {
            const toBlock = Math.min(fromBlock + CHUNK_SIZE, latestBlock);

            console.log(`Đang quét các khối từ ${fromBlock} đến ${toBlock}...`);

            const mintEvents = await contract.queryFilter("NFTMinted", fromBlock, toBlock);
            
            if (mintEvents.length > 0) {
                console.log(`Tìm thấy ${mintEvents.length} sự kiện Mint trong lô này.`);
            }

            // (Logic xử lý sự kiện 'for (const event of mintEvents)' giữ nguyên...)
            for (const event of mintEvents) {
                const { creator, tokenId } = event.args;
                const tokenIdStr = tokenId.toString();
                
                const existingNFT = await NFT.findOne({ tokenId: tokenIdStr });

                if (existingNFT) {
                    console.log(`Token ${tokenIdStr} đã tồn tại trong DB, bỏ qua.`);
                    continue; 
                }

                console.log(`Đang xử lý Token ${tokenIdStr} (chưa có trong DB)...`);
                
                const tokenURI = await contract.tokenURI(tokenId);
                const royaltyPercent = await contract.royalties(tokenId);
                const metadata = await fetchMetadata(tokenURI);

                const newNFT = new NFT({
                    tokenId: tokenIdStr,
                    contractAddress: CONTRACT_ADDRESS,
                    owner: creator.toLowerCase(),
                    creator: creator.toLowerCase(),
                    royaltyPercent: Number(royaltyPercent),
                    tokenURI: tokenURI,
                    name: metadata.name,
                    description: metadata.description,
                    imageUrl: metadata.imageUrl,
                    attributes: metadata.attributes,
                    isListed: false,
                    isAuctionActive: false
                });
                
                await newNFT.save(); 
                console.log(`✅ Đã lưu Token ${tokenIdStr} vào DB.`);

                const block = await event.getBlock();
                await Activity.findOneAndUpdate(
                    { txHash: event.transactionHash },
                    {
                        eventType: 'Mint',
                        tokenId: tokenIdStr,
                        from: "0x0000000000000000000000000000000000000000",
                        to: creator.toLowerCase(),
                        txHash: event.transactionHash,
                        timestamp: new Date(block.timestamp * 1000)
                    },
                    { upsert: true } 
                );
            }
            
            // ✅ BƯỚC 2: GIỮ NGUYÊN THỜI GIAN CHỜ (ĐỂ TRÁNH LỖI 429)
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }

        console.log("🎉 Đồng bộ hóa hoàn tất!");

    } catch (error) {
        console.error("❌ Lỗi trong quá trình đồng bộ hóa:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Đã đóng kết nối MongoDB.");
    }
};

// Chạy script
syncDatabase();