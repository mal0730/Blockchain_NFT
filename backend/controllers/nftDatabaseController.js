// controllers/nftDatabaseController.js
import NFT from '../models/NFT.js'; // Import Model

export const saveMintedNFT = async (req, res) => {
    try {
        const {
            tokenId,
            tokenURI,
            creator, // (walletAddress từ Frontend)
            royaltyPercent,
            name,
            description,
            imageUrl // (Frontend nên gửi cái này)
        } = req.body;

        // Kiểm tra dữ liệu cơ bản
        if (!tokenId || !tokenURI || !creator || !name) {
            return res.status(400).json({ error: 'Thiếu thông tin NFT.' });
        }

        const newNFT = new NFT({
            tokenId: tokenId,
            contractAddress: process.env.CONTRACT_ADDRESS, // Lấy từ .env
            owner: creator, // Ban đầu, người tạo là chủ sở hữu
            creator: creator,
            royaltyPercent: royaltyPercent,
            name: name,
            description: description,
            imageUrl: imageUrl, // URL ảnh từ Pinata
            tokenURI: tokenURI,
            isListed: false
        });

        await newNFT.save(); // Lưu vào MongoDB Atlas

        res.status(201).json({ success: true, message: 'Lưu NFT vào DB thành công!' });

    } catch (error) {
        if (error.code === 11000) { // Lỗi trùng lặp (ví dụ: tokenId đã tồn tại)
            return res.status(409).json({ error: 'Token ID này đã tồn tại trong DB.' });
        }
        console.error('Lỗi khi lưu NFT:', error);
        res.status(500).json({ error: 'Lỗi máy chủ khi lưu dữ liệu.' });
    }
};