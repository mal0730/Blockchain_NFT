### 1. Tạo file môi trường .env

Tại folder backend/, tạo file .env với các biến sau (thay bằng giá trị thật của bạn):
``` bash
PINATA_JWT=<Your Pinata JWT>
PORT=5000
ALCHEMY_API_KEY=<Your Alchemy API Key>
ALCHEMY_BASE=https://eth-sepolia.g.alchemy.com/v2/<Your Alchemy API Key>
```

___ 
### 2. Cài dependencies
Backend
``` bash
cd backend
npm install
```
Frontend
``` bash
cd ../frontend
npm install
```
Hardhat (smart contracts)
``` bash
cd ../hardhat
npm install
```
___
### 3. Chạy project
##Backend server
Mặc định chạy trên http://localhost:5000.

##Frontend
Mặc định chạy trên http://localhost:3000.

##Hardhat (nếu muốn deploy/test contract)
``` bash
cd hardhat
npx hardhat run scripts/deploy.js --network sepolia
```
___
### 4. Chạy thử NFT Marketplace

Mở frontend http://localhost:3000.

Kết nối ví Sepolia (MetaMask).

Mint NFT, xem collection.

Backend sẽ lấy tất cả NFT của wallet từ Alchemy NFT API, bất kể contract.
___
### 5. Lưu ý chung

Node modules và file .env không có trong git, cần cài riêng.

Nếu lỗi fetch NFTs, kiểm tra .env và Alchemy API Key.

Frontend config có thể chứa placeholder cho hình ảnh nếu metadata chưa có.
