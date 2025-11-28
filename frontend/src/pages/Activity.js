import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContract } from "../utils/useContract";
import "./Activity.css";

const Activity = ({ provider }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, mint, list, sale, transfer
  const contract = useContract();

  useEffect(() => {
    loadActivities();
  }, [contract, provider]);

  const loadActivities = async () => {
    if (!contract || !provider) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allActivities = [];

      // Lấy events từ contract
      // NFTMinted event
      const mintFilter = contract.filters.NFTMinted();
      const mintEvents = await contract.queryFilter(mintFilter);

      for (const event of mintEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allActivities.push({
          event: "Mint",
          tokenId: event.args.tokenId.toString(),
          price: "0",
          from: "0x0000000000000000000000000000000000000000",
          to: event.args.owner,
          time: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }

      // NFTListed event
      const listFilter = contract.filters.NFTListed();
      const listEvents = await contract.queryFilter(listFilter);

      for (const event of listEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allActivities.push({
          event: "List",
          tokenId: event.args.tokenId.toString(),
          price: ethers.formatEther(event.args.price),
          from: event.args.seller,
          to: "Market",
          time: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }

      // NFTSold event
      const saleFilter = contract.filters.NFTSold();
      const saleEvents = await contract.queryFilter(saleFilter);

      for (const event of saleEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allActivities.push({
          event: "Sale",
          tokenId: event.args.tokenId.toString(),
          price: ethers.formatEther(event.args.price),
          from: event.args.seller,
          to: event.args.buyer,
          time: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }

      // Transfer event (ERC721)
      const transferFilter = contract.filters.Transfer();
      const transferEvents = await contract.queryFilter(transferFilter);

      for (const event of transferEvents) {
        // Bỏ qua transfer từ mint (from = 0x0)
        if (event.args.from === "0x0000000000000000000000000000000000000000") {
          continue;
        }

        const block = await provider.getBlock(event.blockNumber);
        allActivities.push({
          event: "Transfer",
          tokenId: event.args.tokenId.toString(),
          price: "0",
          from: event.args.from,
          to: event.args.to,
          time: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }

      // Sắp xếp theo thời gian (mới nhất trước)
      allActivities.sort((a, b) => b.time - a.time);
      setActivities(allActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (address === "Market") return "Market";
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return `${seconds} giây trước`;
  };

  const getEventIcon = (event) => {
    switch (event) {
      case "Mint":
        return "✨";
      case "List":
        return "📋";
      case "Sale":
        return "💰";
      case "Transfer":
        return "🔄";
      default:
        return "📌";
    }
  };

  const getEventColor = (event) => {
    switch (event) {
      case "Mint":
        return "mint";
      case "List":
        return "list";
      case "Sale":
        return "sale";
      case "Transfer":
        return "transfer";
      default:
        return "default";
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.event.toLowerCase() === filter;
  });

  if (!provider) {
    return (
      <div className="activity-page">
        <div className="connect-message">
          <h2>⚠️ Chưa kết nối ví</h2>
          <p>Vui lòng kết nối MetaMask để xem hoạt động</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-header">
        <h1>📊 Activity</h1>
        <p className="subtitle">
          Theo dõi tất cả hoạt động trên NFT Marketplace
        </p>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === "all" ? "tab active" : "tab"}
          onClick={() => setFilter("all")}
        >
          Tất cả
        </button>
        <button
          className={filter === "mint" ? "tab active" : "tab"}
          onClick={() => setFilter("mint")}
        >
          Mint
        </button>
        <button
          className={filter === "list" ? "tab active" : "tab"}
          onClick={() => setFilter("list")}
        >
          List
        </button>
        <button
          className={filter === "sale" ? "tab active" : "tab"}
          onClick={() => setFilter("sale")}
        >
          Sale
        </button>
        <button
          className={filter === "transfer" ? "tab active" : "tab"}
          onClick={() => setFilter("transfer")}
        >
          Transfer
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải hoạt động...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="activity-table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Item</th>
                <th>Price</th>
                <th>From</th>
                <th>To</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity, index) => (
                <tr key={`${activity.txHash}-${index}`}>
                  <td>
                    <div
                      className={`event-badge ${getEventColor(activity.event)}`}
                    >
                      <span className="event-icon">
                        {getEventIcon(activity.event)}
                      </span>
                      <span className="event-text">{activity.event}</span>
                    </div>
                  </td>
                  <td>
                    <div className="item-info">
                      <span className="item-name">NFT #{activity.tokenId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      {activity.price !== "0" ? (
                        <span className="price-value">
                          {parseFloat(activity.price).toFixed(4)} ETH
                        </span>
                      ) : (
                        <span className="price-empty">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="address-info">
                      <span className="address">
                        {formatAddress(activity.from)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="address-info">
                      <span className="address">
                        {formatAddress(activity.to)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="time-info">
                      <span className="time-text">
                        {formatTime(activity.time)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Activity;
