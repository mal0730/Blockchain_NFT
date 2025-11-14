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
      setMyNFTs([]);
      setLoading(false);
      return;
    }
    fetchMyNFTs();
  }, [walletAddress]);

  // =================== FETCH NFT TỪ BACKEND ===================
  const fetchMyNFTs = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:5000/api/nft/all?owner=${walletAddress}`;
      console.log("Fetching NFTs from:", url);

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Backend error ${res.status}: ${txt}`);
      }

      const data = await res.json();
      console.log("Fetched NFTs:", data);

      // Chuẩn hóa dữ liệu cho frontend
      const processedNFTs = (data.items || []).map((nft) => ({
        id: `${nft.tokenAddress}-${nft.tokenId}`,
        tokenId: nft.tokenId,
        contract: nft.tokenAddress,
        name: nft.title || nft.rawMetadata?.name || `NFT #${nft.tokenId}`,
        description: nft.description || nft.rawMetadata?.description || "",
        image: nft.image || nft.rawMetadata?.image?.replace("ipfs://", "https://ipfs.io/ipfs/") || "/placeholder.png",
      }));

      setMyNFTs(processedNFTs);
    } catch (err) {
      console.error("❌ Error loading NFTs:", err);
      setMyNFTs([]);
    } finally {
      setLoading(false);
    }
  };

  // =================== RENDER ===================
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
