import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractData from "../NFTMarketPlace.json";

// Đảm bảo địa chỉ này đã được cập nhật chính xác
const CONTRACT_ADDRESS = "0x05C34E666dB428EB5a6782279AABeF60273c9c2f";

/**
 * @desc Hook để khởi tạo Smart Contract.
 * @param {ethers.Signer | null} signer - Đối tượng signer từ Ethers.js (được truyền từ App.js).
 */
export const useContract = (signer) => {
    const [contract, setContract] = useState(null);

    // Contract sẽ được khởi tạo lại mỗi khi đối tượng signer thay đổi (kết nối/ngắt kết nối)
    useEffect(() => {
        const loadContract = () => {
            // 1. NGĂN CHẶN LỖI LẶP VÀ TỰ ĐỘNG KẾT NỐI: 
            // KHÔNG gọi window.ethereum.request(...) ở đây nữa.
            
            if (signer) {
                try {
                    // 2. SỬ DỤNG SIGNER ĐÃ CÓ: 
                    // Contract instance được tạo bằng signer đã được truyền vào, 
                    // đảm bảo nó có quyền gửi giao dịch.
                    const instance = new ethers.Contract(
                        CONTRACT_ADDRESS, 
                        contractData.abi, 
                        signer
                    );
                    setContract(instance);
                    
                } catch (error) {
                    console.error("Error loading contract:", error);
                    setContract(null);
                }
            } else {
                // Nếu không có signer (ví chưa kết nối), 
                // bạn có thể tạo một provider chỉ đọc nếu cần, 
                // nhưng ở đây chúng ta chỉ cần set null để ngăn chặn Mint.
                setContract(null); 
            }
        };

        loadContract();
        
    }, [signer]); // Rerun effect khi 'signer' thay đổi

    return { contract };
};