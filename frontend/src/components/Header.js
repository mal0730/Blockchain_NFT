import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = ({ walletAddress, connectWallet }) => {
  const navigate = useNavigate();

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>NFT Marketplace</h1>
          <p>Discover and collect digital art</p>
        </Link>

        <nav className="nav-buttons">
          {walletAddress ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/mint")}
              >
                Mint NFT
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/collection")}
              >
                My Collection
              </button>
              <div className="wallet-address">
                {formatAddress(walletAddress)}
              </div>
            </>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
