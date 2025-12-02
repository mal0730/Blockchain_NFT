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

  // ✅ THÊM: Flags để tránh double click
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTokenId, setProcessingTokenId] = useState(null);

  // ✅ THÊM: toggle global class để disable side panel khi đang mua
  useEffect(() => {
    if (isProcessing) {
      document.body.classList.add("app-processing");
    } else {
      document.body.classList.remove("app-processing");
    }
    return () => {
      document.body.classList.remove("app-processing");
    };
  }, [isProcessing]);

  // --- HÀM TẢI DỮ LIỆU CHỢ (ĐỌC TỪ MONGODB API) ---
  const loadNFTs = useCallback(async () => {
    setLoading(true);
    setStatusMessage("Loading Marketplace...");
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
      setStatusMessage(`Found ${processedNFTs.length} Listed NFTs.`);
    } catch (error) {
      console.error("❌ Error loading Marketplace NFTs:", error);
      setStatusMessage("Error loading marketplace. Please check console.");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [contract]); // Phụ thuộc vào contract để đảm bảo state ổn định

  // --- HÀM MUA NFT (WRITE TRANSACTION) ---
  const handleBuyNFT = async (nft) => {
    if (isProcessing) {
      alert("⏳ Processing transaction. Please wait...");
      return;
    }

    if (!walletAddress || !contract) {
      alert("Please connect wallet and wait for the contract to load.");
      return;
    }

    // Kiểm tra xem người mua có phải là người bán không (Sử dụng dữ liệu từ API)
    if (walletAddress.toLowerCase() === nft.seller.toLowerCase()) {
      alert("You cannot buy your own NFT!");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingTokenId(nft.tokenId);
      setStatusMessage("Checking NFT status...");
      
      // 👉 Đọc dữ liệu trực tiếp từ on-chain
      const nftOnchain = await contract.nfts(nft.tokenId);

      if (!nftOnchain.listed) {
        alert("NFT is no longer listed!");
        return;
      }
      if (nftOnchain.price <= 0n) {
        alert("Invalid NFT or price is zero.");
        return;
      }

      // 3. Kiểm tra số dư ví
      const priceInWei = nftOnchain.price;
      const balance = await signer.provider.getBalance(walletAddress);
      if (balance < priceInWei) {
        const balanceInEth = ethers.formatEther(balance);
        const priceInEth = ethers.formatEther(priceInWei);
        alert(
          `Insufficient wallet balance.\n` +
          `Required: ${priceInEth} ETH\n` +
          `Available: ${balanceInEth} ETH`
        );
        return;
      }

      setStatusMessage("Sending purchase transaction...");

      // 4. Gọi hàm buyNFT trên Smart Contract và gửi ETH bằng giá niêm yết
      const tx = await contract.buyNFT(nft.tokenId, {
        value: priceInWei,
        gasLimit: 300000, // ✅ Thêm gasLimit để tránh out of gas
      });

      console.log("⏳ Transaction sent:", tx.hash);
      setStatusMessage("Waiting for blockchain confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.transactionHash);

      alert(`🎉 NFT purchased successfully!\nHash: ${receipt.transactionHash}`);

      // Tải lại danh sách sau khi mua thành công
      setTimeout(() => {
        loadNFTs();
        setStatusMessage("✅ Transaction completed!");
        setTimeout(() => setStatusMessage(""), 3000);
      }, 1000);

    } catch (error) {
      console.error("❌ Error buying NFT:", error);

      if (error.code === "ACTION_REJECTED") {
        setStatusMessage("❌ You canceled the transaction in MetaMask.");
        return;
      }

      if (error.code === "NETWORK_ERROR") {
        setStatusMessage("❌ Network connection error. Check RPC URL.");
        return;
      }

      if (error.code === "CALL_EXCEPTION") {
        // Lỗi từ smart contract (revert)
        const reason = error.reason || error.message;
        if (reason.includes("Not listed")) {
          setStatusMessage("❌ NFT is no longer listed.");
          loadNFTs();
        } else if (reason.includes("Insufficient payment")) {
          setStatusMessage("❌ Insufficient payment sent.");
        } else if (reason.includes("not approved")) {
          setStatusMessage("❌ Marketplace is not approved to transfer this NFT.");
        } else {
          setStatusMessage(`❌ Smart Contract error: ${reason}`);
        }
        return;
      }

      if (error.message.includes("insufficient funds")) {
        setStatusMessage("❌ Insufficient wallet balance (including gas fee).");
        return;
      }

      if (error.message.includes("out of gas")) {
        setStatusMessage("❌ Insufficient gas limit. Increase gasLimit.");
        return;
      }

      if (error.message.includes("nonce")) {
        setStatusMessage("❌ Nonce error. Please try again later.");
        return;
      }

      // Fallback error
      setStatusMessage(
        `❌ Transaction failed.\nError: ${error.message || error.toString()}`
      );
    } finally {
      // ✅ SỬA 4: Luôn xóa flag xử lý (dù thành công hay lỗi)
      setIsProcessing(false);
      setProcessingTokenId(null);
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
            placeholder="Search NFT by name, address, or ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            // ✅ Vô hiệu hóa search khi đang xử lý
            disabled={isProcessing}
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
              <NFTCard 
                key={nft.id} 
                nft={nft} 
                onBuy={handleBuyNFT}
                // ✅ Truyền state cho component để disable button
                isProcessing={isProcessing}
                processingTokenId={processingTokenId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
