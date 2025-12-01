import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./NFTDetail.css";
import { useContract } from "../utils/useContract";

const NFTDetail = ({ walletAddress, signer }) => {
  const { tokenId: rawTokenId } = useParams();
  const navigate = useNavigate();
  const { contract } = useContract(signer);

  const tokenId = rawTokenId.includes("-")
    ? rawTokenId.split("-")[1]
    : rawTokenId;

  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  // ✅ NEW: buy processing flag to prevent double clicks
  const [isBuying, setIsBuying] = useState(false);

  // ✅ NEW: toggle global class to disable sidebar / change cursor while buying
  useEffect(() => {
    if (isBuying) {
      document.body.classList.add("app-processing");
    } else {
      document.body.classList.remove("app-processing");
    }
    return () => {
      document.body.classList.remove("app-processing");
    };
  }, [isBuying]);
  
  // ✅ HÀM loadNFTDetails CỦA BẠN ĐÃ ĐÚNG (Theo Lựa chọn A)
  const loadNFTDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      console.log(
        "📥 Bắt đầu tải NFT details TỪ BACKEND cho Token ID:",
        tokenId
      );

      // 1. GỌI API BACKEND (CHỈ 1 REQUEST)
      const response = await fetch(
        `http://localhost:5000/api/nft/detail/${tokenId}`
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Lỗi ${response.status}`);
      }
      const data = await response.json();
      // 2. CHUẨN HÓA DỮ LIỆU TỪ DB
      const nft = data.item;
      const formattedData = {
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        image: nft.imageUrl,
        owner: nft.owner,
        creator: nft.creator,
        isListed: nft.isListed,
        // Chuyển đổi Wei (String) sang ETH
        price: ethers.formatEther(nft.listingPrice || "0"),
      };

      console.log("✅ Tải NFT thành công:", formattedData);
      setNftData(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi tải NFT details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tokenId]); // 👈 TỐI ƯU: Chỉ phụ thuộc vào tokenId

  // ✅ SỬA LỖI: useEffect cần gọi loadNFTDetails
  useEffect(() => {
    // Chỉ tải khi có Token ID
    if (tokenId) {
      loadNFTDetails();
    } else {
      setError("Token ID không hợp lệ");
      setLoading(false);
    }
  }, [loadNFTDetails, tokenId]); // Gọi lại khi tokenId hoặc hàm load thay đổi

  // ✅ HÀM NIÊM YẾT (ĐÃ SỬA LỖI LOGIC - THÊM BƯỚC APPROVE)
  const handleListNFT = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      alert("Vui lòng nhập giá hợp lệ!");
      return;
    }
    if (!contract || !signer) {
      // Phải kiểm tra cả signer
      alert("Vui lòng kết nối ví (Signer) để niêm yết!");
      return;
    }

    try {
      setIsListing(true);
      setError("");
      const priceInWei = ethers.parseEther(listPrice);
      const contractAddress = await contract.getAddress(); // Lấy địa chỉ Contract Marketplace

      // --- BƯỚC 1: CẤP QUYỀN (APPROVE) ---
      console.log("Bước 1/2: Đang yêu cầu cấp quyền (Approve)...");

      // Kiểm tra xem đã approve cho toàn bộ (Approve All) chưa

      const currentApproval = await contract.getApproved(tokenId);
      if (currentApproval.toLowerCase() !== contractAddress.toLowerCase()) {
        // Nếu chưa approve, gửi giao dịch approve
        const approvalTx = await contract.approve(contractAddress, tokenId);
        await approvalTx.wait(); // Đợi giao dịch approve hoàn tất
        console.log("✅ Cấp quyền thành công!");
      } else {
        console.log("ℹ️ Đã cấp quyền (1-1) từ trước, bỏ qua bước 1.");
      }

      // --- BƯỚC 2: NIÊM YẾT (LIST NFT) ---
      console.log("Bước 2/2: Đang gửi giao dịch Niêm yết (ListNFT)...");
      const tx = await contract.listNFT(tokenId, priceInWei);
      await tx.wait(); // Đợi giao dịch niêm yết hoàn tất

      alert("🎉 Niêm yết NFT thành công!");

      await loadNFTDetails(); // Tải lại thông tin để cập nhật (isListed: true)
      setListPrice("");
    } catch (err) {
      console.error("❌ Lỗi khi niêm yết NFT:", err);
      setError("Không thể niêm yết NFT. Vui lòng thử lại!");
    } finally {
      setIsListing(false);
    }
  };

  // --- NEW: Buy logic similar to Home.handleBuyNFT (prevents double click, checks on-chain) ---
  const handleBuyNFT = async () => {
    if (isBuying) return;
    if (!walletAddress || !contract || !signer) {
      alert("Vui lòng kết nối ví và đợi hợp đồng tải.");
      return;
    }

    try {
      setIsBuying(true);
      setError("");
      // re-read on-chain listing to ensure up-to-date
      const onchain = await contract.nfts(tokenId);
      if (!onchain.listed) {
        alert("NFT này không còn được niêm yết!");
        await loadNFTDetails();
        return;
      }
      if (onchain.price <= 0n) {
        alert("NFT không hợp lệ hoặc giá bằng 0.");
        return;
      }

      const priceInWei = onchain.price;
      const balance = await signer.provider.getBalance(walletAddress);
      if (balance < priceInWei) {
        const balanceInEth = ethers.formatEther(balance);
        const priceInEth = ethers.formatEther(priceInWei);
        alert(`Số dư ví không đủ.\nCần: ${priceInEth} ETH\nCó: ${balanceInEth} ETH`);
        return;
      }

      // send transaction
      const tx = await contract.buyNFT(tokenId, {
        value: priceInWei,
        gasLimit: 300000,
      });

      setError("Đang chờ blockchain xác nhận...");
      const receipt = await tx.wait();
      alert(`🎉 Mua ${nftData?.name || tokenId} thành công!\nHash: ${receipt.transactionHash}`);

      // reload details and marketplace state
      await loadNFTDetails();
    } catch (err) {
      console.error("❌ Error buying NFT:", err);

      if (err.code === "ACTION_REJECTED") {
        setError("Bạn đã hủy giao dịch trong MetaMask.");
        return;
      }
      if (err.code === "CALL_EXCEPTION") {
        const reason = err.reason || err.message;
        if (reason.includes("Not listed")) {
          setError("NFT đã không còn được niêm yết.");
          await loadNFTDetails();
          return;
        }
      }
      if (err.message && err.message.includes("insufficient funds")) {
        setError("Số dư ví không đủ (kể cả gas).");
        return;
      }
      setError(err.message || "Giao dịch thất bại. Vui lòng thử lại.");
    } finally {
      setIsBuying(false);
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
    nftData && // Thêm kiểm tra nftData
    walletAddress.toLowerCase() === nftData.owner.toLowerCase();

  return (
    <div className="nft-detail-container">
      <button
        onClick={() => !isBuying && navigate(-1)}
        className="btn-back"
        disabled={isBuying}
        title={isBuying ? "Không thể quay lại khi giao dịch đang xử lý" : "Quay lại"}
      >
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
        {/* Nếu không phải owner: show Buy button when listed, with same logic as Home */}
          {!isOwner && nftData.isListed && (
            <div className="buy-section">
              <button
                onClick={handleBuyNFT}
                disabled={isBuying}
                className="btn-buy"
                title={isBuying ? "Đang xử lý giao dịch..." : "Buy NFT"}
              >
                {isBuying ? "⏳ Đang mua..." : `Buy for ${nftData.price} ETH`}
              </button>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {/* Nếu không phải owner và chưa niêm yết */}
          {!isOwner && !nftData.isListed && (
            <div className="not-owner-info">
              <p>NFT hiện không có để mua</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;
