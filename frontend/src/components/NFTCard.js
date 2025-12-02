import React from "react";
import { useNavigate } from "react-router-dom";
import "./NFTCard.css";

const NFTCard = ({ nft, onBuy }) => {
  const navigate = useNavigate();

  //fallback khi không có image
  const imageSrc =
    nft.image && nft.image !== ""
      ? nft.image
      : "https://via.placeholder.com/300x300?text=No+Image";

  //fallback giá trị price (nếu không có thì ẩn phần giá)
  const hasPrice = nft.price !== undefined && nft.price !== null;

  const handleViewDetails = () => {
    // Nếu nft có tokenId riêng thì dùng nó, không thì dùng id
    const detailId = nft.tokenId || nft.id;
    console.log("Navigating to NFT detail:", detailId);
    navigate(`/nft/${detailId}`);
  };

  return (
    <div className="nft-card">
      <div className="nft-image-container">
        <img src={nft.image} alt={nft.name} className="nft-image" />
      </div>
      <div className="nft-info">
        <h3 className="nft-name">{nft.name}</h3>
        <p className="nft-id">ID: {nft.id}</p>
        {nft.description && (
          <p className="nft-description">{nft.description}</p>
        )}
        <div className="nft-footer">
          {nft.price && (
            <div className="nft-price-section">
              <span className="price-label">Price</span>
              <span className="price-value">{nft.price} ETH</span>
            </div>
          )}
          <div className="nft-actions">
            <button className="btn-view-details" onClick={handleViewDetails}>
              View Details
            </button>
            {onBuy && nft.price && (
              <button className="btn-buy" onClick={() => onBuy(nft)}>
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
