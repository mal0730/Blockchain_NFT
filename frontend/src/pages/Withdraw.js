import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Withdraw.css";

const Withdraw = ({ walletAddress, signer, provider }) => {
  const [balance, setBalance] = useState("0");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress && provider) {
        try {
          const balanceWei = await provider.getBalance(walletAddress);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(balanceEth);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, [walletAddress, provider]);

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!signer) {
      setMessage({ type: "error", text: "Vui lòng kết nối ví trước!" });
      return;
    }

    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      setMessage({ type: "error", text: "Địa chỉ người nhận không hợp lệ!" });
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setMessage({ type: "error", text: "Số tiền phải lớn hơn 0!" });
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(balance)) {
      setMessage({ type: "error", text: "Số dư không đủ!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(withdrawAmount),
      });

      setMessage({ type: "info", text: "Đang xử lý giao dịch..." });
      await tx.wait();

      setMessage({
        type: "success",
        text: `Rút tiền thành công! TX: ${tx.hash}`,
      });

      // Cập nhật lại số dư
      const newBalanceWei = await provider.getBalance(walletAddress);
      const newBalanceEth = ethers.formatEther(newBalanceWei);
      setBalance(newBalanceEth);

      // Reset form
      setWithdrawAmount("");
      setRecipientAddress("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Rút tiền thất bại!",
      });
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    // Trừ đi một ít gas fee (ước tính 0.001 ETH)
    const maxWithdraw = Math.max(0, parseFloat(balance) - 0.001);
    setWithdrawAmount(maxWithdraw.toFixed(6));
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
        <p className="subtitle">Chuyển ETH từ ví của bạn sang địa chỉ khác</p>

        <div className="balance-card">
          <div className="balance-label">Số dư khả dụng</div>
          <div className="balance-amount">
            {parseFloat(balance).toFixed(6)} ETH
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="withdraw-form">
          <div className="form-group">
            <label htmlFor="recipient">Địa chỉ người nhận</label>
            <input
              type="text"
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              Số tiền (ETH)
              <button
                type="button"
                className="max-btn"
                onClick={setMaxAmount}
                disabled={loading}
              >
                MAX
              </button>
            </label>
            <input
              type="number"
              id="amount"
              placeholder="0.0"
              step="0.000001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          <button type="submit" className="withdraw-btn" disabled={loading}>
            {loading ? "Đang xử lý..." : "Rút tiền"}
          </button>
        </form>

        <div className="warning-box">
          <strong>⚠️ Lưu ý:</strong>
          <ul>
            <li>Kiểm tra kỹ địa chỉ người nhận trước khi gửi</li>
            <li>Giao dịch không thể hoàn tác sau khi xác nhận</li>
            <li>Phí gas sẽ được trừ thêm từ số dư của bạn</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
