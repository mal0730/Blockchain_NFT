# NFT Marketplace Frontend

Ứng dụng NFT Marketplace được xây dựng bằng React, cho phép người dùng tạo, mua bán NFT.

## Tính năng

- 🔗 Kết nối ví MetaMask
- 🎨 Mint NFT mới
- 🖼️ Xem danh sách NFT có sẵn
- 💼 Quản lý bộ sưu tập cá nhân
- 💰 Mua bán NFT

## Công nghệ sử dụng

- React 18
- React Router v6
- Ethers.js (tương tác với blockchain)
- CSS3

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install
```

2. Chạy ứng dụng ở chế độ development:

```bash
npm start
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

3. Build cho production:

```bash
npm run build
```

## Cấu trúc thư mục

```
frontend/
├── public/              # File tĩnh
├── src/
│   ├── components/      # Các component tái sử dụng
│   │   ├── Header.js
│   │   └── NFTCard.js
│   ├── pages/          # Các trang chính
│   │   ├── Home.js
│   │   ├── MintNFT.js
│   │   └── MyCollection.js
│   ├── utils/          # Các hàm tiện ích
│   │   └── wallet.js
│   ├── App.js          # Component chính
│   └── index.js        # Entry point
└── package.json
```

## Yêu cầu

- Node.js >= 14
- MetaMask extension

## Lưu ý

- Đảm bảo đã cài đặt MetaMask extension trên trình duyệt
- Kết nối ví trước khi sử dụng các tính năng mint và mua NFT
- Các tính năng blockchain hiện đang sử dụng dữ liệu mẫu, cần tích hợp smart contract để hoàn thiện

## Các bước tiếp theo

1. Tích hợp smart contract NFT
2. Kết nối với IPFS để lưu trữ ảnh NFT
3. Thêm tính năng tìm kiếm và lọc NFT
4. Thêm trang chi tiết NFT
5. Thêm lịch sử giao dịch
