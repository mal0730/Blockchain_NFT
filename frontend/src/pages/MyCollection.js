import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NFTCard from "../components/NFTCard";
import "./MyCollection.css";

const MyCollection = ({ walletAddress }) => {
  const navigate = useNavigate();
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    loadMyNFTs();
  }, [walletAddress]);

  const loadMyNFTs = async () => {
    // Dữ liệu mẫu - sau này sẽ thay thế bằng dữ liệu từ blockchain
    const mockMyNFTs = [
      // Nếu user đã mint NFT thì sẽ hiển thị ở đây
    ];

    setTimeout(() => {
      setMyNFTs(mockMyNFTs);
      setLoading(false);
    }, 1000);
  };

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
