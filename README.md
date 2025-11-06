# Blockchain_NFT

## Giải thích các hàm trong Contract và code Backend

### Một số tham số:

-   **nft**: là NFT.
-   **royalty**: Phí bản quyền. Người tạo ra NFT sẽ được nhận phí bản
    quyền trong các giao dịch sau đó.\
    Ví dụ: A tạo ra nft1 và bán cho B, rồi B bán lại cho C thì A vẫn
    được nhận lại một phần phí bản quyền từ giao dịch của C cho B.

------------------------------------------------------------------------

### Các hàm trong Contract:

#### `mintNFT(uint256 royaltyPercent, string memory _tokenURI)`

Tạo NFT mới với đầu vào là `royaltyPercent` và `tokenURI`.

#### `listNFT(uint256 tokenId, uint256 price)`

Niêm yết NFT. Một NFT được niêm yết sẽ xuất hiện trên sàn giao dịch để
sẵn sàng được bán đi.

#### `startAuction(uint256 tokenId, uint256 duration)`

Tạm thời chưa làm vội.

#### `withdrawFunds()`

Khi kích hoạt hàm này thì "số dư chờ rút" (*pending Withdrawals*) sẽ
được cộng vào tài khoản ví (*Balance*) làm cho tài khoản ví tăng lên.\
"Số dư chờ rút" là kết quả của
`giá bán - phí sàn giao dịch (commission Fee) - royalty`.\
=\> Đây chính là số tiền thực nhận mà người bán được nhận.

#### `getWalletNFTs()`

Liệt kê các NFT trong ví của mình.

#### `getMarketplaceItems() public view returns (NFT[] memory, Auction[] memory)`

Liệt kê các NFT ở trên chợ --- tức là những NFT đang ở trạng thái niêm
yết.

------------------------------------------------------------------------

## Hiểu về cách hoạt động

-   Sau khi **mint** hoặc **mua NFT** về thì chúng sẽ ở trạng thái "chưa
    niêm yết".
-   Muốn bán NFT đi thì đổi nó sang trạng thái "niêm yết" và gán cho nó
    một **price**.
-   Phần **backend** sử dụng **API của [Pinata](https://pinata.cloud/)**
    để lưu trữ dữ liệu.

------------------------------------------------------------------------

## Cách chạy ứng dụng

1.  Chạy **Hardhat** (như trên lớp bình thường).\
    👉 Nếu `npx hardhat compile` báo lỗi thì hỏi ChatGPT để biết thiếu
    thư viện nào.

2.  Lấy **Sepolia ETH** ở đây: [Google
    Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).

3.  Chạy **frontend**:

    ``` bash
    npm start
    ```

4.  Chạy **backend**:

    ``` bash
    node server.js
    ```

------------------------------------------------------------------------

## Phân chia công việc
## Phân chia công việc

| Thành viên  | Nhiệm vụ |
|--------------|-----------|
| **Minh Anh** | Hiển thị NFT trong *My Collection* (xem cách lấy dữ liệu từ Pinata và Alchemy) |
| **Sasha** | Hiển thị trang chủ (hiển thị ra chợ) |
| **Mạnh Hà** | Tạo trang xem chi tiết từng NFT, tạo component NFT tương ứng với MyCollection và Trang chủ, Hiển thị số dư ví, Tạo 1 nút để rút "số dư chờ rút" và hiển thị số dư chờ rút lên giao diện (việc làm chi tiết hơn ở dưới) |

------------------------------------------------------------------------

### Trang chi tiết NFT gồm:

-   Ảnh
-   Tên
-   Tác giả
-   Token ID
-   Người sở hữu
-   Chú thích
-   Nút **Niêm yết**

### Trang chủ (Marketplace):

-   Hiển thị ngoài gồm: Ảnh, Tên, Giá, Nút "Xem chi tiết" (dẫn đến trang
    chi tiết).

### My Collection:

-   Hiển thị ngoài gồm: Ảnh, Tên, Nút "Xem chi tiết" (dẫn đến trang chi
    tiết).

------------------------------------------------------------------------

### Giao diện bổ sung:

-   Trên **Header**, hiển thị số dư ví:\
    Gọi `provider.getBalance()` với `provider` được truyền từ `App.js`
    xuống.
    Có một nút "Rút tiền", nút này dẫn đến trang hiển thị số dư chờ rút và xác nhận rút tiền.
