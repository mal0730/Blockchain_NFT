import { BrowserProvider } from "ethers";

// Hằng số cho Sepolia
const SEPOLIA_CHAIN_ID_DEC = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // Chain ID Sepolia trong định dạng Hex

const METAMASK_NOT_INSTALLED = {
  address: "",
  signer: null,
  provider: null,
  status: (
    <span>
      <p>
        {" "}
        🦊{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://metamask.io/download.html"
        >
          You must install MetaMask, a virtual Ethereum wallet, in your browser.
        </a>
      </p>
    </span>
  ),
};

/**
 * @desc Yêu cầu người dùng kết nối ví, đảm bảo đang ở Sepolia, và trả về provider/signer
 */
export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      // 1. Tạo Provider (Đọc dữ liệu từ blockchain)
      const provider = new BrowserProvider(window.ethereum);

      // 2. Yêu cầu tài khoản (MetaMask sẽ bật lên cửa sổ xác nhận)
      const addressArray = await provider.send("eth_requestAccounts", []);
      const address = addressArray[0];

      // 3. KIỂM TRA MẠNG LƯỚI
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
        // Nếu không phải Sepolia, YÊU CẦU CHUYỂN MẠNG
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
          });

          // Nếu chuyển thành công, làm mới Provider/Signer
          const updatedProvider = new BrowserProvider(window.ethereum);
          const signer = await updatedProvider.getSigner(address);
          
          return {
            address: address,
            signer: signer,
            provider: updatedProvider,
            status: "👆 Switched to Sepolia & Connected successfully",
          };
          
        } catch (switchError) {
          // Lỗi 4902 là khi mạng chưa được thêm vào MetaMask
          if (switchError.code === 4902) {
            alert("Mạng Sepolia chưa được thêm vào MetaMask. Vui lòng thêm thủ công.");
            // Bạn có thể thêm logic `wallet_addEthereumChain` ở đây nếu muốn tự động thêm.
          }
          if (switchError.code === 4001) {
             // Người dùng từ chối chuyển mạng
             return { address: "", signer: null, provider: null, status: "😥 Vui lòng chuyển sang mạng Sepolia để tiếp tục." };
          }
          throw switchError; // Ném lỗi để bắt ở catch bên ngoài
        }
      }

      // 4. Nếu đã ở Sepolia, lấy Signer
      const signer = await provider.getSigner(address);

      return {
        address: address,
        signer: signer,
        provider: provider,
        status: "👆 Connected successfully on Sepolia",
      };

    } catch (err) {
      console.error("Connection Error:", err);
      return {
        address: "",
        signer: null,
        provider: null,
        status: "😥 " + err.message,
      };
    }
  } else {
    return METAMASK_NOT_INSTALLED;
  }
};

// Hàm getCurrentWalletConnected giữ nguyên (nó không cần chuyển mạng, chỉ cần kiểm tra)
export const getCurrentWalletConnected = async () => {
    // ... logic giữ nguyên ...
};