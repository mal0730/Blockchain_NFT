// (File: frontend/pages/MyCollection.js)

import React, { useState, useEffect, useCallback } from "react"; // 1. Thêm useCallback
import { useNavigate } from "react-router-dom";
import NFTCard from "../components/NFTCard";
import "./MyCollection.css";
// (Bạn có thể cần import useContract nếu muốn thêm nút 'List' ở đây)
// import { useContract } from "../utils/useContract";

const MyCollection = ({ walletAddress, signer }) => {
  // 2. Nhận signer (nếu cần List)
  const navigate = useNavigate();
  const [myNFTs, setMyNFTs] = useState([]);
  const [allMyNFTs, setAllMyNFTs] = useState([]); // Lưu toàn bộ NFTs
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // (Giả sử bạn lấy contract ở đây nếu cần cho các hành động)
  // const { contract } = useContract(signer);

  // =================== FETCH NFT TỪ BACKEND (DATABASE) ===================
  const fetchMyNFTs = useCallback(async () => {
    // 3. Di chuyển logic kiểm tra walletAddress VÀO TRONG
    if (!walletAddress) {
      setMyNFTs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 4. ✅ SỬA URL: Gọi API Backend (đọc từ MongoDB)
      const url = `http://localhost:5000/api/nft/collection/${walletAddress}`;
      console.log("Fetching NFTs từ Database:", url);

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Backend error ${res.status}: ${txt}`);
      }

      const data = await res.json(); // data = { success: true, items: [...] }
      if (!data.success) {
        throw new Error(data.error || "Backend returned unsuccessful response");
      }

      console.log("Fetched NFTs từ DB:", data.items);

      // 5. ✅ CHUẨN HÓA DỮ LIỆU (TỪ SCHEMA MONGODB)
      // Dữ liệu từ DB (theo Schema) đã có 'name', 'imageUrl', 'tokenId'
      const processedNFTs = (data.items || []).map((nft) => ({
        id: nft.tokenId, // Dùng tokenId làm key (hoặc nft._id từ Mongo)
        tokenId: nft.tokenId,
        contract: nft.contractAddress,
        name: nft.name,
        description: nft.description,
        image: nft.imageUrl, // Lấy imageUrl đã được Indexer xử lý
        isListed: nft.isListed, // Lấy trạng thái niêm yết
        listingPrice: nft.listingPrice, // Lấy giá niêm yết
        owner: nft.owner, // Thêm owner để tìm kiếm
        creator: nft.creator, // Thêm creator để tìm kiếm
      }));

      setAllMyNFTs(processedNFTs); // Lưu toàn bộ
      setMyNFTs(processedNFTs);
    } catch (err) {
      console.error("❌ Error loading NFTs từ DB:", err);
      setMyNFTs([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]); // 6. walletAddress là dependency của useCallback

  useEffect(() => {
    // 7. Gọi fetchMyNFTs (đã được bọc)
    fetchMyNFTs();
  }, [fetchMyNFTs]); // 8. fetchMyNFTs là dependency của useEffect

  // =================== HÀM TÌM KIẾM ===================
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setMyNFTs(allMyNFTs); // Hiển thị tất cả khi không có từ khóa
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = allMyNFTs.filter((nft) => {
      // Tìm theo tên NFT
      const matchName = nft.name?.toLowerCase().includes(searchLower);
      // Tìm theo tokenId
      const matchTokenId = nft.tokenId?.toString().includes(query);

      return matchName || matchTokenId;
    });

    setMyNFTs(filtered);
  };

  // =================== RENDER (Giữ nguyên) ===================
  if (!walletAddress) {
    return (
      <div className="my-collection">
        <div className="collection-container">
          <div className="collection-header">
            <button className="back-button" onClick={() => navigate("/")}>
              ← Back
            </button>
            <h1>My Collection</h1>
            <p>Your NFTs and creations</p>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>Wallet Not Connected</h3>
            <p>Please connect your wallet to view your collection</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-collection">
      <div className="collection-container">
        <div className="collection-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← Back
          </button>
          <div className="header-content">
            <div>
              <h1>My Collection</h1>
              <p>Your NFTs and creations</p>
            </div>
            <button className="btn-mint-new" onClick={() => navigate("/mint")}>
              Mint New NFT
            </button>
          </div>
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search NFT by name, address, or ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {loading ? (
          <div className="loading">Loading your collection...</div>
        ) : myNFTs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>You don't have any NFTs yet</h3>
            <p>Start creating your digital collection</p>
            <button className="btn-create" onClick={() => navigate("/mint")}>
              Create Your First NFT
            </button>
          </div>
        ) : (
          <div className="nft-grid">
            {myNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCollection;
