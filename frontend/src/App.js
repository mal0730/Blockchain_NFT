import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import MintNFT from "./pages/MintNFT";
import MyCollection from "./pages/MyCollection";
import NFTDetail from "./pages/NFTDetail";
import Activity from "./pages/Activity";
import Withdraw from "./pages/Withdraw";
// Sử dụng các hàm từ wallet.js
import { connectWallet } from "./utils/wallet";

function App() {
  // THÊM STATE ĐỂ LƯU TRỮ PROVIDER VÀ SIGNER
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  // 1. TẠO REF HOẶC STATE ĐỂ XỬ LÝ LISTENER KHI MỚI TẢI TRANG
  // Để giữ cho logic lắng nghe sự kiện của bạn vẫn hoạt động sau khi người dùng kết nối.
  // Lắng nghe sự kiện sẽ được khởi tạo trong handleConnectWallet.

  // 2. LOẠI BỎ LOGIC TỰ ĐỘNG TẢI VÍ (Silent Connect)
  useEffect(() => {
    // Chỉ cần thiết lập các listener cơ bản cho mạng lưới/tài khoản
    // để xử lý các thay đổi đột ngột nếu người dùng đã kết nối trước đó.
    if (window.ethereum) {
      // Lắng nghe sự kiện đổi mạng (nên luôn có)
      window.ethereum.on("chainChanged", (chainId) => {
        window.location.reload();
      });
    }

    // Không gọi getCurrentWalletConnected() ở đây để ngăn tự động kết nối.
    // Tuy nhiên, chúng ta cần đảm bảo addWalletListener được gọi sau khi provider/signer được thiết lập.
  }, []);

  // HÀM LẮNG NGHE SỰ KIỆN VÍ (accountsChanged, chainChanged)
  const addWalletListener = (currentProvider) => {
    if (window.ethereum) {
      // Lắng nghe sự kiện đổi tài khoản
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          setWalletAddress(newAddress);

          // Cập nhật Signer cho địa chỉ mới
          if (currentProvider) {
            const newSigner = await currentProvider.getSigner(newAddress);
            setSigner(newSigner);
          }
        } else {
          // Xử lý ngắt kết nối
          setWalletAddress("");
          setSigner(null);
          setProvider(null);
        }
      });
    }
  };

  // HÀM XỬ LÝ KẾT NỐI VÍ (Được gọi khi nhấn nút)
  const handleConnectWallet = async () => {
    // HÀNH VI MONG MUỐN: Gọi connectWallet (sử dụng eth_requestAccounts) -> Mở MetaMask
    const {
      address,
      signer: newSigner,
      provider: newProvider,
    } = await connectWallet();

    if (address) {
      setWalletAddress(address);
      setSigner(newSigner);
      setProvider(newProvider);

      // Bắt đầu lắng nghe sự kiện chỉ sau khi người dùng kết nối thành công
      addWalletListener(newProvider);
    } else {
      // Xử lý khi kết nối thất bại/từ chối
      console.log("Wallet connection failed or was rejected.");
    }
  };

  return (
    <Router>
      <div className="App">
        <Header
          walletAddress={walletAddress}
          connectWallet={handleConnectWallet} // Gọi hàm mở hộp thoại MetaMask
          provider={provider}
        />
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Home walletAddress={walletAddress} signer={signer} />}
            />
            <Route
              path="/mint"
              // TRUYỀN SIGNER XUỐNG COMPONENT MINTNFT
              element={
                <MintNFT walletAddress={walletAddress} signer={signer} />
              }
            />
            <Route
              path="/collection"
              element={
                <MyCollection walletAddress={walletAddress} signer={signer} />
              }
            />
            <Route
              path="/nft/:tokenId"
              element={
                <NFTDetail
                  walletAddress={walletAddress}
                  signer={signer}
                  provider={provider}
                />
              }
            />
            <Route path="/activity" element={<Activity />} />
            <Route
              path="/withdraw"
              element={
                <Withdraw
                  walletAddress={walletAddress}
                  signer={signer}
                  provider={provider}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
