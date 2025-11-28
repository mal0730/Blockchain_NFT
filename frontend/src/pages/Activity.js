import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Activity.css";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, mint, list, buy, transfer

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      console.log("Fetching activities from backend...");
      const response = await fetch("http://localhost:5000/api/nft/activities");
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        console.log("Number of activities:", data.activities.length);
        // Chuyển đổi dữ liệu từ MongoDB sang format hiển thị
        const formattedActivities = data.activities.map((activity) => {
          // Chuyển đổi price từ Wei sang ETH nếu có
          let priceInEth = "0";
          if (activity.price && activity.price !== "0") {
            try {
              priceInEth = ethers.formatEther(activity.price);
            } catch (e) {
              priceInEth = "0";
            }
          }

          return {
            event: activity.eventType, // Mint, List, Buy, Transfer...
            tokenId: activity.tokenId,
            price: priceInEth,
            from: activity.from || "0x0000000000000000000000000000000000000000",
            to: activity.to || "Market",
            time: new Date(activity.createdAt),
            txHash: activity.txHash,
          };
        });

        console.log("Formatted activities:", formattedActivities);
        setActivities(formattedActivities);
      }
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
      case "Buy":
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
      case "Buy":
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
          className={filter === "buy" ? "tab active" : "tab"}
          onClick={() => setFilter("buy")}
        >
          Buy
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
