import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import "./Header.css";

const Header = ({ walletAddress, connectWallet, provider }) => {
  const [balance, setBalance] = useState("0");

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress && provider) {
        try {
          const balanceWei = await provider.getBalance(walletAddress);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(balanceEth);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance("0");
        }
      } else {
        setBalance("0");
      }
    };

    fetchBalance();
  }, [walletAddress, provider]);

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
              <div className="wallet-info">
                <div className="wallet-balance">
                  {formatBalance(balance)} ETH
                </div>
                <div className="wallet-address">
                  {formatAddress(walletAddress)}
                </div>
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
