import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./Activity.css";

const Activity = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, mint, list, buy, transfer
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("item"); // item, from, to, time

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
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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

  const handleItemClick = (tokenId) => {
    navigate(`/nft/${tokenId}`);
  };

  const filteredActivities = activities.filter((activity) => {
    // Lọc theo event type
    if (filter !== "all" && activity.event.toLowerCase() !== filter) {
      return false;
    }

    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      if (searchType === "item") {
        // Tìm theo tokenId
        return activity.tokenId.toString().includes(query);
      } else if (searchType === "from") {
        // Tìm theo địa chỉ From
        return activity.from.toLowerCase().includes(query);
      } else if (searchType === "to") {
        // Tìm theo địa chỉ To
        return activity.to.toLowerCase().includes(query);
      } else if (searchType === "time") {
        // Tìm theo ngày (input date sẽ cho format YYYY-MM-DD)
        if (searchQuery) {
          const [year, month, day] = searchQuery.split("-");
          const searchDate = `${day}/${month}/${year}`;
          const activityDate = formatTime(activity.time).split(" ")[0]; // Lấy phần ngày DD/MM/YYYY
          return activityDate === searchDate;
        }
      }
    }

    return true;
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

      <div className="search-container">
        <select
          className="search-type-select"
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value);
            setSearchQuery(""); // Reset search query khi đổi loại
          }}
        >
          <option value="item">Item</option>
          <option value="from">From</option>
          <option value="to">To</option>
          <option value="time">Time</option>
        </select>
        <input
          type={searchType === "time" ? "date" : "text"}
          className="search-input"
          placeholder={
            searchType === "item"
              ? "Tìm kiếm theo Item (Token ID)..."
              : searchType === "from"
              ? "Tìm kiếm theo địa chỉ From..."
              : searchType === "to"
              ? "Tìm kiếm theo địa chỉ To..."
              : "Chọn ngày..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
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
                  <td
                    onClick={() => handleItemClick(activity.tokenId)}
                    style={{ cursor: "pointer" }}
                  >
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
