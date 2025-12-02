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
        text: "Please connect your wallet first!",
      });
      return;
    }

    if (parseFloat(pendingAmount) === 0) {
      setMessage({ type: "error", text: "You have no funds to withdraw!" });
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
      setMessage({ type: "info", text: "Processing transaction..." });

      await tx.wait();

      setMessage({
        type: "success",
        text: `Withdrawal successful! TX: ${tx.hash}`,
      });

      loadPending();
    } catch (error) {
      console.error("Withdraw error:", error);
      setMessage({
        type: "error",
        text:
          error.reason ||
          error.message ||
          "Withdrawal failed. Check console!",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="withdraw-page">
        <div className="connect-message">
          <h2>⚠️ Wallet Not Connected</h2>
          <p>Please connect MetaMask to use the withdrawal feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="withdraw-page">
      <div className="withdraw-container">
        <h1>💰 Withdraw money</h1>
        <p className="subtitle">Receive funds earned from the marketplace</p>

        <div className="balance-card">
          <div className="balance-label">Pending Withdrawal Amount</div>
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
          {loading ? "Processing..." : "Withdraw to Wallet"}
        </button>
      </div>
    </div>
  );
};

export default Withdraw;
