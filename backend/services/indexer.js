import { ethers } from 'ethers';
import NFT from '../models/NFT.js'; // Import Model NFT
import Activity from '../models/Activities.js'; // Import Model Activity
import contractData from '../NFTMarketPlace.json' with { type: 'json' };
import fetch from 'node-fetch'; // 👈 Cần thiết để tải metadata

// --- Cấu hình ---
const CONTRACT_ADDRESS = "0x260cC80dC1e4D6075dD205CbA665Ad38F2aF961e"; // 👈 Địa chỉ Contract của bạn
// Lấy url từ env và loại bỏ dấu ngoặc kép nếu có (do một số .env lưu kèm ")
const rawRpc = process.env.ALCHEMY_RPC_URL_SEPOLIA || "";
const rawWss = process.env.ALCHEMY_WSS_URL_SEPOLIA || "";
const ALCHEMY_RPC_URL = rawRpc.replace(/^\"|\"$/g, "");
const ALCHEMY_WSS_URL = rawWss.replace(/^\"|\"$/g, "");

// Sử dụng HTTP JsonRpcProvider (không dùng WSS theo yêu cầu)
const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
console.log('ℹ️ Indexer: sử dụng JsonRpcProvider (HTTP) ->', ALCHEMY_RPC_URL);

const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);

/**
 * Hàm trợ giúp: Tải metadata từ IPFS/Pinata
 * (Bạn cần thay thế gateway nếu muốn)
 */

const getTransactionHash = async (event) => {
    // 1. Dùng getTransactionReceipt() để lấy dữ liệu nặng
    const receipt = await event.getTransactionReceipt();
    // 2. Hash nằm trong receipt.hash
    return receipt.hash;
};

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

    
    contract.on("NFTMinted", async (creator, tokenId, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được Mint bởi ${creator}`);

        try {
            // Lấy thông tin On-chain
            const tokenURI = await contract.tokenURI(tokenId);
            const royaltyPercent = await contract.royalties(tokenId);

            // Lấy thông tin Off-chain (từ Pinata)
            const metadata = await fetchMetadata(tokenURI);
            const txHash = await getTransactionHash(event);

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

            await newNFT.save();
            console.log(`✅ Đã lưu Token ${tokenId} vào DB.`);

            // Ghi lại Lịch sử Mint
            await new Activity({
                eventType: 'Mint',
                tokenId: tokenId.toString(),
                from: "0x0000000000000000000000000000000000000000",
                to: creator.toLowerCase(),
                txHash: txHash
            }).save();

            console.log(`✅ INDEXER ĐÃ BẮT VÀ LƯU TX HASH: ${event.transactionHash}`);

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
    contract.on("NFTListed", async (seller, tokenId, price, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được niêm yết bởi ${seller} với giá ${price}`);

        try {
            const txHash = await getTransactionHash(event);
            const updated = await NFT.findOneAndUpdate(
                { tokenId: tokenId.toString() },
                {
                    isListed: true,
                    listingPrice: price.toString(),
                    listingSeller: seller.toLowerCase()
                },
                { new: true, 
                  upsert: true
                }
            ).exec();

            if (!updated) {
                console.warn(`⚠️ NFT ${tokenId} chưa tồn tại trong DB khi cố cập nhật listing.`);
            } else {
                console.log(`✅ Đã cập nhật listing cho Token ${tokenId} trong DB.`);
            }

            // Ghi lại Lịch sử (tránh crash nếu duplicate txHash)
            try {
                await new Activity({
                    eventType: 'List',
                    tokenId: tokenId.toString(),
                    from: seller.toLowerCase(),
                    price: price.toString(),
                    txHash: txHash
                }).save();
                console.log(`✅ Đã lưu Activity List cho ${tokenId} - tx ${event.transactionHash}`);
            } catch (actErr) {
                if (actErr.code === 11000) {
                    console.warn(`⚠️ Activity với txHash ${event.transactionHash} đã tồn tại, bỏ qua.`);
                } else {
                    console.error('❌ Lỗi lưu Activity (List):', actErr.message);
                }
            }

        } catch (error) {
            console.error(`❌ Lỗi xử lý NFTListed cho token ${tokenId}:`, error.message);
        }
    });

    // ✅ SỬA LỖI 3: SỬA LOGIC LẤY 'SELLER' KHI MUA
    contract.on("NFTBought", async (buyer, tokenId, price, event) => {
        console.log(`SỰ KIỆN: Token ${tokenId} được mua bởi ${buyer}`);
        
        // 1. Lấy thông tin seller từ DB (vì event không có)
        const nft = await NFT.findOne({ tokenId: tokenId.toString() });
        const seller = nft ? nft.listingSeller : "Không rõ"; // Lấy người bán cũ
        const txHash = await getTransactionHash(event);

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
            txHash: txHash
        }).save();
    });

    // ... (Thêm listener cho AuctionStarted, Finalized, Transfer...)
};