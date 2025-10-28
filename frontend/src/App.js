import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Home from "./pages/Home";
import MintNFT from "./pages/MintNFT";
import MyCollection from "./pages/MyCollection";
import { connectWallet, getCurrentWalletConnected } from "./utils/wallet";

function App() {
  const [walletAddress, setWalletAddress] = useState("");

  // useEffect(() => {
  //   const loadWallet = async () => {
  //     const { address } = await getCurrentWalletConnected();
  //     setWalletAddress(address);
  //     addWalletListener();
  //   };
  //   loadWallet();
  // }, []);

  const addWalletListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress("");
        }
      });
    }
  };

  const handleConnectWallet = async () => {
    const walletResponse = await connectWallet();
    setWalletAddress(walletResponse.address);
  };

  return (
    <Router>
      <div className="App">
        <Header
          walletAddress={walletAddress}
          connectWallet={handleConnectWallet}
        />
        <Routes>
          <Route path="/" element={<Home walletAddress={walletAddress} />} />
          <Route
            path="/mint"
            element={<MintNFT walletAddress={walletAddress} />}
          />
          <Route
            path="/collection"
            element={<MyCollection walletAddress={walletAddress} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
