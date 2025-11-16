import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./NFTDetail.css";
import { useContract } from "../utils/useContract";

const NFTDetail = ({ walletAddress, signer }) => {
  const { tokenId: rawTokenId } = useParams();
  const navigate = useNavigate();
  const { contract } = useContract(signer);

  // Parse tokenId từ URL
  // Nếu tokenId có dạng "0xAddress-10" thì lấy phần sau dấu -
  // Nếu chỉ là "10" thì giữ nguyên
  const tokenId = rawTokenId.includes("-")
    ? rawTokenId.split("-")[1]
    : rawTokenId;

  console.log("📍 Raw Token ID from URL:", rawTokenId);
  console.log("📍 Parsed Token ID:", tokenId);

  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  useEffect(() => {
    console.log(
      "🔍 NFTDetail useEffect - Contract:",
      contract,
      "TokenId:",
      tokenId
    );

    if (contract && tokenId) {
      loadNFTDetails();
    } else {
      if (!contract) {
        console.log("⚠️ Đang chờ contract khởi tạo...");
      }
      if (!tokenId) {
        setError("Token ID không hợp lệ");
        setLoading(false);
      }
    }
  }, [contract, tokenId]);

  const loadNFTDetails = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📥 Bắt đầu tải NFT details cho Token ID:", tokenId);

      // Lấy thông tin owner
      console.log("1️⃣ Đang lấy owner...");
      const owner = await contract.ownerOf(tokenId);
      console.log("✅ Owner:", owner);

      // Lấy thông tin creator (tác giả)
      console.log("2️⃣ Đang lấy creator...");
      const creator = await contract.creatorOf(tokenId);
      console.log("✅ Creator:", creator);

      // Lấy thông tin NFT từ mapping nfts
      console.log("3️⃣ Đang lấy NFT info...");
      const nftInfo = await contract.nfts(tokenId);
      console.log("✅ NFT Info:", nftInfo);

      // Khởi tạo dữ liệu cơ bản
      let metadata = {
        name: `NFT #${tokenId}`,
        description: "Không có mô tả",
        image: "https://via.placeholder.com/500?text=NFT",
      };

      // Thử lấy metadata từ Pinata (nếu có)
      try {
        console.log("4️⃣ Đang lấy tokenURI...");
        const tokenURI = await contract.tokenURI(tokenId);
        console.log("✅ TokenURI:", tokenURI);

        if (tokenURI && tokenURI !== "") {
          console.log("5️⃣ Đang lấy metadata từ:", tokenURI);

          // Chuyển đổi IPFS URL nếu cần
          let fetchURL = tokenURI;
          if (tokenURI.startsWith("ipfs://")) {
            fetchURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
            console.log("🔄 Converted IPFS URL to:", fetchURL);
          }

          const response = await fetch(fetchURL);
          if (response.ok) {
            const fetchedMetadata = await response.json();
            console.log("✅ Metadata:", fetchedMetadata);

            // Cập nhật metadata nếu fetch thành công
            metadata = {
              name: fetchedMetadata.name || metadata.name,
              description: fetchedMetadata.description || metadata.description,
              image: fetchedMetadata.image || metadata.image,
            };

            // Chuyển đổi IPFS image URL nếu cần
            if (metadata.image.startsWith("ipfs://")) {
              metadata.image = metadata.image.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              );
            }
          } else {
            console.warn(
              `⚠️ HTTP ${response.status}: Không thể tải metadata, dùng giá trị mặc định`
            );
          }
        }
      } catch (metadataErr) {
        console.warn("⚠️ Không thể tải metadata:", metadataErr.message);
        console.log("ℹ️ Tiếp tục với thông tin cơ bản...");
      }

      const data = {
        tokenId: tokenId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        owner: owner,
        creator: creator,
        isListed: nftInfo.listed,
        price: nftInfo.price ? ethers.formatEther(nftInfo.price) : "0",
      };

      console.log("✅ Tải NFT thành công:", data);
      setNftData(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Lỗi khi tải NFT details:", err);
      console.error("Chi tiết lỗi:", {
        message: err.message,
        code: err.code,
        reason: err.reason,
      });

      let errorMessage = "Không thể tải thông tin NFT";
      if (err.message.includes("nonexistent token")) {
        errorMessage = `NFT với Token ID ${tokenId} không tồn tại`;
      } else if (err.code === "CALL_EXCEPTION") {
        errorMessage = "NFT không tồn tại hoặc contract chưa được deploy";
      }

      setError(`${errorMessage}: ${err.message}`);
      setLoading(false);
    }
  };

  const handleListNFT = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      alert("Vui lòng nhập giá hợp lệ!");
      return;
    }

    if (!walletAddress) {
      alert("Vui lòng kết nối ví!");
      return;
    }

    try {
      setIsListing(true);
      setError("");

      // Chuyển đổi giá từ ETH sang Wei
      const priceInWei = ethers.parseEther(listPrice);

      // Gọi hàm listNFT từ smart contract
      const tx = await contract.listNFT(tokenId, priceInWei);
      await tx.wait();

      alert("Niêm yết NFT thành công!");

      // Tải lại thông tin NFT
      await loadNFTDetails();
      setListPrice("");
    } catch (err) {
      console.error("Error listing NFT:", err);
      setError("Không thể niêm yết NFT. Vui lòng thử lại!");
    } finally {
      setIsListing(false);
    }
  };

  if (loading) {
    return (
      <div className="nft-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin NFT...</p>
        </div>
      </div>
    );
  }

  if (error && !nftData) {
    return (
      <div className="nft-detail-container">
        <div className="error-box">
          <h2>⚠️ Lỗi</h2>
          <div className="error-message">{error}</div>
          <details className="error-details">
            <summary>Chi tiết kỹ thuật</summary>
            <p>
              <strong>Token ID:</strong> {tokenId}
            </p>
            <p>
              <strong>Contract:</strong>{" "}
              {contract ? "✅ Đã kết nối" : "❌ Chưa kết nối"}
            </p>
            <p>
              <strong>Wallet:</strong> {walletAddress || "Chưa kết nối"}
            </p>
            <p>
              <strong>Signer:</strong> {signer ? "✅ Có" : "❌ Không có"}
            </p>
          </details>
          <div className="error-actions">
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Quay lại
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-retry"
            >
              🔄 Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!nftData) {
    return null;
  }

  const isOwner =
    walletAddress &&
    walletAddress.toLowerCase() === nftData.owner.toLowerCase();

  return (
    <div className="nft-detail-container">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Quay lại
      </button>

      <div className="nft-detail-content">
        <div className="nft-detail-image-section">
          <img
            src={nftData.image}
            alt={nftData.name}
            className="nft-detail-image"
          />
        </div>

        <div className="nft-detail-info-section">
          <h1 className="nft-detail-title">{nftData.name}</h1>

          <div className="nft-detail-info-group">
            <div className="nft-info-item">
              <span className="info-label">Token ID:</span>
              <span className="info-value">{nftData.tokenId}</span>
            </div>

            <div className="nft-info-item">
              <span className="info-label">Tác giả:</span>
              <span className="info-value address">
                {nftData.creator.substring(0, 6)}...
                {nftData.creator.substring(nftData.creator.length - 4)}
              </span>
            </div>

            <div className="nft-info-item">
              <span className="info-label">Người sở hữu:</span>
              <span className="info-value address">
                {nftData.owner.substring(0, 6)}...
                {nftData.owner.substring(nftData.owner.length - 4)}
              </span>
            </div>

            {nftData.isListed && (
              <div className="nft-info-item">
                <span className="info-label">Giá niêm yết:</span>
                <span className="info-value price">{nftData.price} ETH</span>
              </div>
            )}

            <div className="nft-info-item">
              <span className="info-label">Trạng thái:</span>
              <span
                className={`info-value status ${
                  nftData.isListed ? "listed" : "unlisted"
                }`}
              >
                {nftData.isListed ? "Đã niêm yết" : "Chưa niêm yết"}
              </span>
            </div>
          </div>

          <div className="nft-description-section">
            <h3>Chú thích</h3>
            <p className="nft-description">{nftData.description}</p>
          </div>

          {/* Hiển thị form niêm yết nếu là owner và NFT chưa được niêm yết */}
          {isOwner && !nftData.isListed && (
            <div className="list-nft-section">
              <h3>Niêm yết NFT</h3>
              <div className="list-form">
                <input
                  type="number"
                  placeholder="Nhập giá (ETH)"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="price-input"
                  step="0.001"
                  min="0"
                />
                <button
                  onClick={handleListNFT}
                  disabled={isListing}
                  className="btn-list"
                >
                  {isListing ? "Đang niêm yết..." : "Niêm yết"}
                </button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {isOwner && nftData.isListed && (
            <div className="listed-info">
              <p>✓ NFT của bạn đã được niêm yết trên marketplace</p>
            </div>
          )}

          {!isOwner && (
            <div className="not-owner-info">
              <p>Bạn không phải là chủ sở hữu của NFT này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;
