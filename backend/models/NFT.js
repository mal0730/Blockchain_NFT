import mongoose from 'mongoose';

// Schema phụ cho Thuộc tính (Attributes)
const AttributeSchema = new mongoose.Schema({
    trait_type: String,
    value: String
}, { _id: false }); // _id: false để không tạo ID riêng cho mỗi thuộc tính

// Schema phụ cho Chi tiết Đấu giá
const AuctionDetailsSchema = new mongoose.Schema({
    highestBid: { type: String, default: '0' }, // Lưu dưới dạng Wei
    highestBidder: { type: String, lowercase: true },
    endTime: Date
}, { _id: false });

// Schema chính cho NFT
const NFTSchema = new mongoose.Schema({
    // --- Dữ liệu On-Chain (Từ Smart Contract) ---
    tokenId: { 
        type: String, 
        required: true, 
        unique: true, // Đảm bảo không trùng lặp
        index: true   // Đánh chỉ mục để tìm kiếm theo ID nhanh hơn
    },
    contractAddress: { 
        type: String, 
        required: true, 
        lowercase: true, 
        index: true 
    },
    owner: { 
        type: String, 
        required: true, 
        lowercase: true, 
        index: true // Rất quan trọng cho việc truy vấn "My Collection"
    },
    creator: { 
        type: String, 
        required: true, 
        lowercase: true, 
        index: true // Quan trọng để hiển thị Tác giả
    },
    royaltyPercent: { 
        type: Number, 
        default: 0 
    },

    // --- Dữ liệu Off-Chain (Từ Metadata/Pinata) ---
    name: { 
        type: String, 
        required: true, 
        index: true // Đánh chỉ mục để tìm kiếm theo Tên
    },
    description: String,
    imageUrl: String,
    attributes: [AttributeSchema], // Mảng các thuộc tính

    // --- Trạng thái Marketplace (Từ Smart Contract) ---
    isListed: { 
        type: Boolean, 
        default: false, 
        index: true // Quan trọng để lọc "Chợ"
    },
    listingPrice: { 
        type: String, // Lưu giá dưới dạng Wei (String) để đảm bảo độ chính xác
        default: '0' 
    },
    listingSeller: { 
        type: String, 
        lowercase: true 
    },
    
    isAuctionActive: { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    auctionDetails: AuctionDetailsSchema,

    // --- Dữ liệu Quản lý (Do Indexer tự tạo) ---
    lastUpdatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Tạo chỉ mục văn bản (Text Index) để tìm kiếm theo Tên và Mô tả
NFTSchema.index({ name: 'text', description: 'text' });

// Tạo Model từ Schema
const NFT = mongoose.model('NFT', NFTSchema);

export default NFT;