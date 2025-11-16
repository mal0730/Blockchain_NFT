import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./NFTDetail.css";
import { useContract } from "../utils/useContract";

const NFTDetail = ({ walletAddress, signer }) => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { contract } = useContract(signer);

  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  useEffect(() => {
    if (contract && tokenId) {
      loadNFTDetails();
    }
  }, [contract, tokenId]);

  const loadNFTDetails = async () => {
    try {
      setLoading(true);
      setError("");

      // Lấy thông tin owner
      const owner = await contract.ownerOf(tokenId);

      // Lấy tokenURI
      const tokenURI = await contract.tokenURI(tokenId);

      // Lấy thông tin creator (tác giả)
      const creator = await contract.creatorOf(tokenId);

      // Lấy metadata từ Pinata
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      // Lấy thông tin NFT từ mapping nfts
      const nftInfo = await contract.nfts(tokenId);

      setNftData({
        tokenId: tokenId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        owner: owner,
        creator: creator,
        isListed: nftInfo.listed,
        price: nftInfo.price ? ethers.formatEther(nftInfo.price) : "0",
      });

      setLoading(false);
    } catch (err) {
      console.error("Error loading NFT details:", err);
      setError("Không thể tải thông tin NFT");
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
    return <div className="nft-detail-container">Đang tải...</div>;
  }

  if (error && !nftData) {
    return (
      <div className="nft-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn-back">
          Quay lại
        </button>
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
