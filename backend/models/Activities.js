import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
    eventType: { 
        type: String, 
        // Định nghĩa các loại hoạt động có thể xảy ra
        enum: [
            'Mint', 
            'List', 
            'Buy', 
            'Bid', 
            'AuctionStart', 
            'AuctionFinalize', 
            'Transfer',
            'Withdraw'
        ], 
        required: true,
        index: true
    },
    tokenId: { 
        type: String, 
        required: true, 
        index: true // Quan trọng để lọc lịch sử theo NFT
    },
    from: { 
        type: String, 
        lowercase: true, 
        index: true // Ai gửi (ví dụ: người bán)
    },
    to: { 
        type: String, 
        lowercase: true, 
        index: true // Ai nhận (ví dụ: người mua)
    },
    price: { 
        type: String // Lưu giá (Wei) của giao dịch (mua, đấu giá)
    },
    txHash: { 
        type: String, 
        unique: true // Đảm bảo không ghi trùng lặp sự kiện
    }
}, {
    timestamps: { createdAt: true, updatedAt: false } // Chỉ cần biết sự kiện xảy ra lúc nào
});

const Activity = mongoose.model('Activity', ActivitySchema);

export default Activity;