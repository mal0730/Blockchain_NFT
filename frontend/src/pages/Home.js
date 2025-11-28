import React, { useState, useEffect, useCallback } from "react";
import NFTCard from "../components/NFTCard";
import { ethers } from "ethers"; // ✅ Import ethers
import "./Home.css";
import { useContract } from "../utils/useContract"; // ✅ Import useContract

// ✅ NHẬN SIGNER TỪ APP.JS
const Home = ({ walletAddress, signer }) => {
  // Contract instance cần thiết để gửi giao dịch mua và đọc data (read-only nếu signer null)
  const { contract } = useContract(signer);

  const [nfts, setNfts] = useState([]);
  const [allNfts, setAllNfts] = useState([]); // Lưu toàn bộ NFTs
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // --- HÀM TẢI DỮ LIỆU CHỢ (ĐỌC TỪ MONGODB API) ---
  const loadNFTs = useCallback(async () => {
    setLoading(true);
    setStatusMessage("Đang tải Marketplace...");
    try {
      // 1. GỌI API BACKEND: Đọc từ route /api/nft/marketplace
      const url = `http://localhost:5000/api/nft/marketplace`;
      const res = await fetch(url);

      if (!res.ok) {
        // Xử lý lỗi HTTP và Server
        throw new Error(`HTTP Error! Status: ${res.status}.`);
      }

      const data = await res.json();

      // 2. CHUẨN HÓA DỮ LIỆU ĐỌC TỪ DB
      const processedNFTs = (data.items || []).map((nft) => ({
        id: nft.tokenId,
        tokenId: nft.tokenId,
        name: nft.name,
        image: nft.imageUrl, // ✅ Lấy imageUrl từ DB
        price: ethers.formatEther(nft.listingPrice || "0"), // Chuyển đổi Wei (string) sang ETH
        seller: nft.listingSeller,
        isListed: nft.isListed,
        owner: nft.owner, // Thêm owner để tìm kiếm
        creator: nft.creator, // Thêm creator để tìm kiếm
      }));

      setAllNfts(processedNFTs); // Lưu toàn bộ
      setNfts(processedNFTs); // Hiển thị ban đầu
      setStatusMessage(`Tìm thấy ${processedNFTs.length} NFT đang niêm yết.`);
    } catch (error) {
      console.error("❌ Error loading Marketplace NFTs:", error);
      setStatusMessage("Lỗi tải chợ. Vui lòng kiểm tra console.");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [contract]); // Phụ thuộc vào contract để đảm bảo state ổn định

  // --- HÀM MUA NFT (WRITE TRANSACTION) ---
  const handleBuyNFT = async (nft) => {
    if (!walletAddress || !contract) {
      alert("Vui lòng kết nối ví và đợi hợp đồng tải.");
      return;
    }

    // Kiểm tra xem người mua có phải là người bán không (Sử dụng dữ liệu từ API)
    if (walletAddress.toLowerCase() === nft.seller.toLowerCase()) {
      alert("Bạn không thể mua NFT của chính mình!");
      return;
    }

    try {
      setStatusMessage("Đang chuẩn bị giao dịch mua...");

      // 1. Chuyển đổi giá ETH (dạng string) sang Wei (BigInt)
      const priceInWei = ethers.parseEther(String(nft.price));

      // 2. Gọi hàm buyNFT trên Smart Contract và gửi ETH bằng giá niêm yết
      const tx = await contract.buyNFT(nft.tokenId, {
        value: priceInWei,
      });

      console.log("⏳ Transaction sent:", tx.hash);
      await tx.wait();

      alert(`🎉 Mua ${nft.name} thành công!`);

      loadNFTs(); // Tải lại danh sách sau khi mua thành công
    } catch (error) {
      console.error("❌ Error buying NFT:", error);
      setStatusMessage("Mua thất bại. Vui lòng kiểm tra console và số dư ví.");
    }
  };

  // --- HOOK GỌI HÀM LOAD ---
  useEffect(() => {
    // Load data khi contract (read-only hoặc writable) sẵn sàng
    if (contract) {
      loadNFTs();
    }
  }, [contract, loadNFTs]); // Phụ thuộc vào contract và loadNFTs

  // --- HÀM TÌM KIẾM ---
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setNfts(allNfts); // Hiển thị tất cả khi không có từ khóa
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = allNfts.filter((nft) => {
      // Tìm theo tên NFT
      const matchName = nft.name?.toLowerCase().includes(searchLower);
      // Tìm theo tokenId
      const matchTokenId = nft.tokenId?.toString().includes(query);

      return matchName || matchTokenId;
    });

    setNfts(filtered);
  };

  // --- RENDER (GIỮ NGUYÊN CẤU TRÚC CŨ) ---
  return (
    <div className="home">
      <div className="container">
        {/* HIỂN THỊ BANNER KHI CHƯA KẾT NỐI VÍ (Giữ nguyên) */}
        {!walletAddress && (
          <div className="info-banner">
            <p>Please connect your wallet to mint and trade NFTs.</p>
          </div>
        )}

        <div className="section-header">
          <h2>Available NFTs</h2>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm NFT theo tên, địa chỉ, hoặc ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {loading ? (
          <div className="loading">Loading NFTs...</div>
        ) : nfts.length === 0 ? (
          <div className="empty-state">
            <p>No NFTs available at the moment</p>
          </div>
        ) : (
          <div className="nft-grid">
            {nfts.map((nft) => (
              // Truyền hàm mua và dữ liệu xuống NFTCard
              <NFTCard key={nft.id} nft={nft} onBuy={handleBuyNFT} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
