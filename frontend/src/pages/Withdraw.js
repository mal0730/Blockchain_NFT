import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Withdraw.css";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "../config";

const Withdraw = ({ walletAddress, signer, provider }) => {
  const [pendingAmount, setPendingAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadPending = async () => {
    if (!provider || !walletAddress) return;

    try {
      const contract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      const amountWei = await contract.pendingWithdrawals(walletAddress);
      const amountEth = ethers.formatEther(amountWei);

      setPendingAmount(amountEth);
    } catch (error) {
      console.error("Error loading pending withdrawal:", error);
    }
  };

  useEffect(() => {
    loadPending();
  }, [walletAddress, provider]);

  const handleWithdraw = async () => {
    if (!signer) {
      setMessage({
        type: "error",
        text: "Vui lòng kết nối ví trước!",
      });
      return;
    }

    if (parseFloat(pendingAmount) === 0) {
      setMessage({ type: "error", text: "Bạn không có tiền để rút!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const contract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        signer
      );

      const tx = await contract.withdrawFunds();
      setMessage({ type: "info", text: "Đang xử lý giao dịch..." });

      await tx.wait();

      setMessage({
        type: "success",
        text: `Rút thành công! TX: ${tx.hash}`,
      });

      loadPending();
    } catch (error) {
      console.error("Withdraw error:", error);
      setMessage({
        type: "error",
        text:
          error.reason ||
          error.message ||
          "Rút tiền thất bại. Kiểm tra console!",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="withdraw-page">
        <div className="connect-message">
          <h2>⚠️ Chưa kết nối ví</h2>
          <p>Vui lòng kết nối MetaMask để sử dụng tính năng rút tiền</p>
        </div>
      </div>
    );
  }

  return (
    <div className="withdraw-page">
      <div className="withdraw-container">
        <h1>💰 Rút tiền</h1>
        <p className="subtitle">Nhận số tiền bạn đã bán NFT từ marketplace</p>

        <div className="balance-card">
          <div className="balance-label">Số tiền chờ rút</div>
          <div className="balance-amount">
            {parseFloat(pendingAmount).toFixed(6)} ETH
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <button
          className="withdraw-btn"
          disabled={loading || parseFloat(pendingAmount) === 0}
          onClick={handleWithdraw}
        >
          {loading ? "Đang xử lý..." : "Rút tiền về ví"}
        </button>
      </div>
    </div>
  );
};

export default Withdraw;
