// backend/services/pinataService.js
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const PINATA_JWT = process.env.PINATA_JWT;

console.log("--- JWT DEBUG START ---");
if (PINATA_JWT) {
    console.log("JWT Loaded (Yes/No): Yes");
    console.log("JWT Length:", PINATA_JWT.length);
    console.log("JWT Segments (must be 3):", PINATA_JWT.split('.').length);
    console.log("JWT First 10 chars:", PINATA_JWT.substring(0, 10));
} else {
    console.log("JWT Loaded (Yes/No): NO. Check your .env file!");
}
console.log("--- JWT DEBUG END ---");

/**
 * Upload file (image) lên Pinata
 */
export const pinataUploadFile = async (filePath) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const formData = new FormData();

  // Gửi file + API keys trong body (FormData)
  formData.append("file", fs.createReadStream(filePath));
  //formData.append("pinata_api_key", PINATA_API_KEY);
  //formData.append("pinata_secret_api_key", PINATA_SECRET_KEY);

  try {
    const res = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
            ...formData.getHeaders(), // chỉ dùng headers của FormData
              'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });
    return res.data; // { IpfsHash, PinSize, Timestamp }
  } catch (err) {
    console.error("❌ Pinata file upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload file to Pinata");
  }
};

/**
 * Upload JSON (metadata) lên Pinata
 */
export const pinataUploadJSON = async (json) => {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  try {
    const res = await axios.post(url, json, {
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });
    return res.data; // { IpfsHash, PinSize, Timestamp }
  } catch (err) {
    console.error("❌ Pinata JSON upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload JSON to Pinata");
  }
};
