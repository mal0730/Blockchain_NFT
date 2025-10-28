import React, { useState, useEffect } from "react";
import NFTCard from "../components/NFTCard";
import "./Home.css";

const Home = ({ walletAddress }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    // TODO: Load NFTs từ smart contract
    try {
      // Khi tích hợp blockchain, gọi smart contract ở đây
      // const nfts = await contract.getAllNFTsForSale();
      // setNfts(nfts);

      setNfts([]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setLoading(false);
    }
  };

  const handleBuyNFT = async (nft) => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    // TODO: Xử lý mua NFT với smart contract
    console.log("Buying NFT:", nft);
    alert(`Buying ${nft.name} for ${nft.price} ETH`);
  };

  return (
    <div className="home">
      <div className="container">
        {!walletAddress && (
          <div className="info-banner">
            <p>Please connect your wallet to mint and trade NFTs.</p>
          </div>
        )}

        <div className="section-header">
          <h2>Available NFTs</h2>
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
              <NFTCard key={nft.id} nft={nft} onBuy={handleBuyNFT} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
