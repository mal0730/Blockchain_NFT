// db/connect.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Đảm bảo biến môi trường được tải

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
        console.error('❌ LỖI: Thiếu MONGODB_URI. Vui lòng kiểm tra file .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURI, {
            // Các tùy chọn mới của Mongoose v6+ không cần nhiều cấu hình
        });
        console.log('✅ Kết nối MongoDB Atlas thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectDB;