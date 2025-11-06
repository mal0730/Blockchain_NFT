// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // 👈 THAY ĐỔI: Thêm URI Storage
import "@openzeppelin/contracts/access/Ownable.sol";

// 👈 THAY ĐỔI: Kế thừa từ ERC721URIStorage
contract NFTMarketPlace is ERC721URIStorage, Ownable { 
    uint256 public nextTokenId;
    uint256 public commissionFee = 25; // 2.5% marketplace fee (tính theo 1000)

    // Cấu trúc dữ liệu cho NFT đã niêm yết
    struct NFT {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool listed;
    }

    // Cấu trúc dữ liệu cho Đấu giá
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    // Các Mapping
    mapping(uint256 => NFT) public nfts;  // NFT listing info
    mapping(uint256 => uint256) public royalties;  // tokenId => royalty percent (x10, 50 = 5%)
    mapping(uint256 => Auction) public auctions; // tokenId => auction
    mapping(address => uint256) public pendingWithdrawals; // ETH pending for withdrawal
    mapping(uint256 => bool) public mintedTokens;  // tokenId => minted?
    mapping(uint256 => address) public creatorOf; // token Id địa chỉ người mint ban đầu 
    
    // Khai báo Events giữ nguyên...
    event NFTMinted(address indexed creator, uint256 indexed tokenId);
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTBought(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event AuctionStarted(uint256 indexed tokenId, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionFinalized(uint256 indexed tokenId, address winner, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 amount);

    // 👈 THAY ĐỔI: Constructor gọi ERC721URIStorage
    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender){}

    // =================== NFT MINT (ĐÃ SỬA: Thêm tokenURI) ===================
    function mintNFT(uint256 royaltyPercent, string memory _tokenURI) external {
        require(royaltyPercent <= 1000, "Max 100%");
        uint256 tokenId = nextTokenId + 1;
        nextTokenId = tokenId;

        _mint(msg.sender, tokenId);
        // 👈 LƯU TRỮ TOKEN URI
        _setTokenURI(tokenId, _tokenURI); 
        creatorOf[tokenId] = msg.sender;

        mintedTokens[tokenId] = true;
        royalties[tokenId] = royaltyPercent;

        emit NFTMinted(msg.sender, tokenId);
    }

    // =================== LIST NFT ===================
    function listNFT(uint256 tokenId, uint256 price) external {
        require(mintedTokens[tokenId], "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");

        // Ghi chú: Frontend PHẢI gọi approve(address(this), tokenId) trước!
        
        nfts[tokenId] = NFT(tokenId, msg.sender, price, true);
        emit NFTListed(msg.sender, tokenId, price);
    }
    
    // =================== BUY NFT ===================
    function buyNFT(uint256 tokenId) external payable {
        NFT storage nft = nfts[tokenId];
        require(nft.listed, "NFT not listed");
        require(msg.value >= nft.price, "Insufficient payment");
        
        // 👈 KIỂM TRA APPROVAL TRƯỚC KHI CHUYỂN
        require(getApproved(tokenId) == address(this) || isApprovedForAll(nft.seller, address(this)), "Marketplace not approved to sell");

        uint256 fee = (msg.value * commissionFee) / 1000;
        uint256 royalty = (msg.value * royalties[tokenId]) / 1000;
        uint256 sellerAmount = msg.value - fee - royalty;

        pendingWithdrawals[owner()] += fee;
        pendingWithdrawals[nft.seller] += sellerAmount;
        pendingWithdrawals[creatorOf[tokenId]] += royalty; // Royalty cho người tạo ban đầu

        // 👈 CHUYỂN NFT BẰNG _safeTransferFrom HOẶC _transfer (sử dụng _transfer vì hợp đồng không tự sở hữu)
        _transfer(nft.seller, msg.sender, tokenId); // Chuyển từ người bán hiện tại sang người mua
        nft.listed = false;
        
        // Sau khi bán, Marketplace nên hủy bỏ sự ủy quyền để tránh chuyển nhầm
        // _approve(address(0), tokenId); // Tùy chọn: Hủy approval sau khi bán

        emit NFTBought(msg.sender, tokenId, msg.value);
    }

    // =================== AUCTION ===================
    // Các hàm startAuction, placeBid, finalizeAuction giữ nguyên
    function startAuction(uint256 tokenId, uint256 duration) external {
        require(mintedTokens[tokenId], "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(duration > 0, "Duration > 0");

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionStarted(tokenId, block.timestamp + duration);
    }

    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            pendingWithdrawals[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Already finalized");
        require(block.timestamp >= auction.endTime, "Auction not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            uint256 fee = (auction.highestBid * commissionFee) / 1000;
            uint256 royalty = (auction.highestBid * royalties[tokenId]) / 1000;
            uint256 sellerAmount = auction.highestBid - fee - royalty;
            
            // 👈 KIỂM TRA APPROVAL TRƯỚC KHI CHUYỂN
            require(getApproved(tokenId) == address(this) || isApprovedForAll(auction.seller, address(this)), "Marketplace not approved to transfer");

            pendingWithdrawals[owner()] += fee;
            pendingWithdrawals[auction.seller] += sellerAmount;
            pendingWithdrawals[creatorOf[tokenId]] += royalty;

            // Chuyển NFT từ người bán sang người thắng cuộc
            _transfer(auction.seller, auction.highestBidder, tokenId); 

            emit AuctionFinalized(tokenId, auction.highestBidder, auction.highestBid);
        }
    }
    
    // =================== WITHDRAW ===================
    // Hàm withdrawFunds giữ nguyên

    function withdrawFunds() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // =================== HELPERS (ĐÃ THÊM LOGIC HIỂN THỊ) ===================
    
    /**
     * @dev Lấy tất cả Token ID mà người gọi hiện đang sở hữu (My Collection).
     * YÊU CẦU: NFT vừa mint VÀ NFT đã mua.
     */
    function getWalletNFTs() public view returns (uint256[] memory) {
        uint totalTokenCount = nextTokenId; 
        uint itemCount = 0;
        
        // 1. Đếm số lượng NFT thuộc sở hữu của msg.sender
        for(uint i = 1; i <= totalTokenCount; i++) {
            // Kiểm tra: Token có tồn tại VÀ người gọi có phải là chủ sở hữu hiện tại không?
            if (mintedTokens[i] && ownerOf(i) == msg.sender) {
                itemCount++;
            }
        }
        
        // 2. Tạo mảng và điền Token ID
        uint256[] memory tokenIds = new uint256[](itemCount);
        uint currentIndex = 0;

        for(uint i = 1; i <= totalTokenCount; i++) {
            if (mintedTokens[i] && ownerOf(i) == msg.sender) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return tokenIds;
    }

    /**
     * @dev Lấy tất cả các NFT đang được niêm yết (bán cố định HOẶC đấu giá đang hoạt động) (Chợ).
     */
    function getMarketplaceItems() public view returns (NFT[] memory, Auction[] memory) {
        uint totalTokenCount = nextTokenId; 
        uint listedCount = 0;
        uint auctionCount = 0;
        
        // 1. Đếm số lượng đang niêm yết/đấu giá
        for(uint i = 1; i <= totalTokenCount; i++) {
            if (nfts[i].listed) {
                listedCount++;
            }
            if (auctions[i].active) {
                auctionCount++;
            }
        }
        
        // 2. Tạo mảng và điền dữ liệu
        NFT[] memory listedItems = new NFT[](listedCount);
        Auction[] memory activeAuctions = new Auction[](auctionCount);
        uint listedIndex = 0;
        uint auctionIndex = 0;

        for(uint i = 1; i <= totalTokenCount; i++) {
            if (nfts[i].listed) {
                listedItems[listedIndex] = nfts[i];
                listedIndex++;
            }
            if (auctions[i].active) {
                activeAuctions[auctionIndex] = auctions[i];
                auctionIndex++;
            }
        }
        
        return (listedItems, activeAuctions);
    }

    /**
     * @dev Hàm tokenURI chuẩn ERC721 (đã được sửa)
     */
    // 👈 THAY ĐỔI: Sử dụng hàm tokenURI của ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Hàm này tự động trả về URI đã được gán bằng _setTokenURI
        require(mintedTokens[tokenId], "Token does not exist");
        return super.tokenURI(tokenId); 
    }

    // Hàm uint2str giữ nguyên...
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) { length++; j /= 10; }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
}