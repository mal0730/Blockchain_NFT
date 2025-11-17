import { ethers } from 'ethers';
import NFT from '../models/NFT.js'; // Import Model NFT
import Activity from '../models/Activities.js'; // Import Model Activity
import contractData from '../NFTMarketPlace.json' with { type: 'json' };
import fetch from 'node-fetch'; // 👈 Cần thiết để tải metadata

// --- Cấu hình ---
const CONTRACT_ADDRESS = "0x260cC80dC1e4D6075dD205CbA665Ad38F2aF961e"; // 👈 Địa chỉ Contract của bạn
const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL_SEPOLIA; 

// Sử dụng JsonRpcProvider để kết nối ổn định
const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL); 
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);

/**
 * Hàm trợ giúp: Tải metadata từ IPFS/Pinata
 * (Bạn cần thay thế gateway nếu muốn)
 */
const fetchMetadata = async (tokenURI) => {
    // Chuyển đổi 'ipfs://' thành URL http
    const httpUrl = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    
    try {
        const response = await fetch(httpUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        
        // Xử lý URL ảnh (nếu ảnh cũng là IPFS)
        const imageUrl = metadata.image 
            ? metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") 
            : "";

        return {
            name: metadata.name || "Không có tên",
            description: metadata.description || "",
            imageUrl: imageUrl,
            attributes: metadata.attributes || []
        };
    } catch (error) {
        console.error(`Lỗi tải metadata từ ${httpUrl}:`, error.message);
        // Trả về dữ liệu trống để tránh lỗi toàn bộ Indexer
        return { name: "Lỗi tải metadata", description: "", imageUrl: "" };
    }
};


// --- Hàm Khởi động ---
export const startEventListener = () => {
    console.log("🎧 Indexer đang lắng nghe sự kiện blockchain...");

    // ✅ SỬA LỖI 1: BỎ COMMENT VÀ TRIỂN KHAI NFTMINTED
    contract.on("NFTMinted", async (creator, tokenId, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được Mint bởi ${creator}`);

        try {
            // Lấy thông tin On-chain
            const tokenURI = await contract.tokenURI(tokenId);
            const royaltyPercent = await contract.royalties(tokenId);

            // Lấy thông tin Off-chain (từ Pinata)
            const metadata = await fetchMetadata(tokenURI);

            // Tạo NFT mới trong DB
            const newNFT = new NFT({
                tokenId: tokenId.toString(),
                contractAddress: CONTRACT_ADDRESS,
                owner: creator.toLowerCase(), // Ban đầu, người tạo là chủ sở hữu
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

            await newNFT.save(); // Lưu vào MongoDB
            console.log(`✅ Đã lưu Token ${tokenId} vào DB.`);

            // Ghi lại Lịch sử Mint
            await new Activity({
                eventType: 'Mint',
                tokenId: tokenId.toString(),
                from: "0x0000000000000000000000000000000000000000",
                to: creator.toLowerCase(),
                txHash: event.log.transactionHash
            }).save();

        } catch (error) {
            // Xử lý lỗi trùng lặp (nếu Indexer chạy lại)
            if (error.code === 11000) { 
                console.warn(`Token ${tokenId} đã tồn tại trong DB, bỏ qua.`);
            } else {
                console.error(`Lỗi xử lý Mint Token ${tokenId}:`, error.message);
            }
        }
    });
    
    // ✅ SỬA LỖI 2: SỬA LOGIC CẬP NHẬT KHI NIÊM YẾT
    contract.on("NFTListed", (seller, tokenId, price, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được niêm yết bởi ${seller} với giá ${price}`);
        
        NFT.findOneAndUpdate(
            { tokenId: tokenId.toString() },
            { 
                isListed: true, 
                listingPrice: price.toString(),
                listingSeller: seller.toLowerCase()
                // 🛑 BỎ DÒNG CẬP NHẬT OWNER (Vì owner vẫn là seller)
            },
            { new: true }
        ).exec();
        
        // Ghi lại Lịch sử
        new Activity({
            eventType: 'List',
            tokenId: tokenId.toString(),
            from: seller.toLowerCase(),
            price: price.toString(),
            txHash: event.log.transactionHash
        }).save();
    });

    // ✅ SỬA LỖI 3: SỬA LOGIC LẤY 'SELLER' KHI MUA
    contract.on("NFTBought", async (buyer, tokenId, price, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được mua bởi ${buyer}`);
        
        // 1. Lấy thông tin seller từ DB (vì event không có)
        const nft = await NFT.findOne({ tokenId: tokenId.toString() });
        const seller = nft ? nft.listingSeller : "Không rõ"; // Lấy người bán cũ

        // 2. Cập nhật DB
        await NFT.findOneAndUpdate(
            { tokenId: tokenId.toString() },
            { 
                owner: buyer.toLowerCase(), // Chủ sở hữu mới
                isListed: false,
                isAuctionActive: false,
                listingPrice: '0'
            }
        ).exec();
        
        // 3. Ghi lại Lịch sử
        new Activity({
            eventType: 'Buy',
            tokenId: tokenId.toString(),
            from: seller, // 👈 Đã lấy seller từ DB
            to: buyer.toLowerCase(),
            price: price.toString(),
            txHash: event.log.transactionHash
        }).save();
    });

    // ... (Thêm listener cho AuctionStarted, Finalized, Transfer...)
};