const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketPlace Full Test - Ethers v6", function () {
  let marketplace, owner, seller, buyer, bidder1, bidder2;

  beforeEach(async () => {
    [owner, seller, buyer, bidder1, bidder2] = await ethers.getSigners();
    const NFTMarketPlace = await ethers.getContractFactory("NFTMarketPlace");
    marketplace = await NFTMarketPlace.deploy();
    await marketplace.waitForDeployment();
  });

  // ================= Deployment =================
  describe("Deployment", function () {
    it("Owner is set correctly", async () => {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Commission fee initialized correctly", async () => {
      expect(await marketplace.commissionFee()).to.equal(25);
    });
  });

  // ================= Minting =================
  describe("Minting NFT", function () {
    it("Mint NFT with correct royalty", async () => {
      await marketplace.connect(seller).mintNFT(50n);
      expect(await marketplace.ownerOf(1n)).to.equal(seller.address);
      expect(await marketplace.royalties(1n)).to.equal(50n);
    });

    it("Mint multiple NFTs and check nextTokenId", async () => {
      await marketplace.connect(seller).mintNFT(10n);
      await marketplace.connect(seller).mintNFT(20n);
      expect(await marketplace.ownerOf(1n)).to.equal(seller.address);
      expect(await marketplace.ownerOf(2n)).to.equal(seller.address);
      expect(await marketplace.nextTokenId()).to.equal(2n);
    });

    it("Should revert if royalty > 1000", async () => {
      await expect(marketplace.connect(seller).mintNFT(2000n))
        .to.be.revertedWith("Max 100%");
    });

    it("Mint with 0% royalty", async () => {
      await marketplace.connect(seller).mintNFT(0n);
      expect(await marketplace.royalties(1n)).to.equal(0n);
    });

    it("TokenURI returns correct URL", async () => {
      await marketplace.connect(seller).mintNFT(50n);
      expect(await marketplace.tokenURI(1n)).to.equal("https://my-nft-metadata.com/1.json");
      await expect(marketplace.tokenURI(2n)).to.be.revertedWith("Token does not exist");
    });
  });

  // ================= Listing & Buying =================
  describe("Listing & Buying NFT", function () {
    beforeEach(async () => {
      await marketplace.connect(seller).mintNFT(100n);
      await marketplace.connect(seller).listNFT(1n, ethers.parseEther("1"));
    });

    it("Should list NFT correctly", async () => {
      const nft = await marketplace.nfts(1n);
      expect(nft.listed).to.be.true;
      expect(nft.price).to.equal(ethers.parseEther("1"));
      expect(await marketplace.isListed(1n)).to.be.true;
    });

    it("Only owner can list", async () => {
      await expect(
        marketplace.connect(buyer).listNFT(1n, ethers.parseEther("1"))
      ).to.be.revertedWith("Not owner");
    });

    it("Buying NFT transfers ownership and updates balances", async () => {
      const sellerBalanceBefore = BigInt(await marketplace.pendingWithdrawals(seller.address));

      await marketplace.connect(buyer).buyNFT(1n, { value: ethers.parseEther("1") });

      const nft = await marketplace.nfts(1n);
      expect(nft.listed).to.be.false;
      expect(await marketplace.ownerOf(1n)).to.equal(buyer.address);

      const sellerBalanceAfter = BigInt(await marketplace.pendingWithdrawals(seller.address));
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
    });

    it("Should revert if buyer pays less than price", async () => {
      await expect(
        marketplace.connect(buyer).buyNFT(1n, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Cannot buy unlisted NFT", async () => {
      await marketplace.connect(buyer).buyNFT(1n, { value: ethers.parseEther("1") });
      await expect(
        marketplace.connect(buyer).buyNFT(1n, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("NFT not listed");
    });
  });

  // ================= Auction =================
  describe("Auction system", function () {
    beforeEach(async () => {
      await marketplace.connect(seller).mintNFT(50n);
      await marketplace.connect(seller).startAuction(1n, 60); // 60s auction
    });

    it("Start auction correctly", async () => {
      const auction = await marketplace.auctions(1n);
      expect(auction.active).to.be.true;
      expect(auction.seller).to.equal(seller.address);
    });

    it("Accepts valid bids", async () => {
      await marketplace.connect(bidder1).placeBid(1n, { value: ethers.parseEther("1") });
      const auction = await marketplace.auctions(1n);
      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(ethers.parseEther("1"));
    });

    it("Refund previous bidder when outbid", async () => {
      await marketplace.connect(bidder1).placeBid(1n, { value: ethers.parseEther("1") });
      await marketplace.connect(bidder2).placeBid(1n, { value: ethers.parseEther("2") });
      const refund = BigInt(await marketplace.pendingWithdrawals(bidder1.address));
      expect(refund).to.equal(ethers.parseEther("1"));
    });

    it("Bid too low should revert", async () => {
      await marketplace.connect(bidder1).placeBid(1n, { value: ethers.parseEther("1") });
      await expect(
        marketplace.connect(bidder2).placeBid(1n, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Bid too low");
    });

    it("Finalize auction correctly", async () => {
      await marketplace.connect(bidder1).placeBid(1n, { value: ethers.parseEther("1") });
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");
      await marketplace.finalizeAuction(1n);
      const auction = await marketplace.auctions(1n);
      expect(auction.active).to.be.false;
      expect(await marketplace.ownerOf(1n)).to.equal(bidder1.address);
    });

    it("Finalize auction with no bids keeps NFT with seller", async () => {
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");
      await marketplace.finalizeAuction(1n);
      expect(await marketplace.ownerOf(1n)).to.equal(seller.address);
    });

    it("Finalize too early should revert", async () => {
      await marketplace.connect(bidder1).placeBid(1n, { value: ethers.parseEther("1") });
      await expect(marketplace.finalizeAuction(1n)).to.be.revertedWith("Auction not ended");
    });
  });

  // ================= Withdraw =================
  describe("Withdraw funds", function () {
    it("Users can withdraw pending funds", async () => {
      await marketplace.connect(seller).mintNFT(100n);
      await marketplace.connect(seller).listNFT(1n, ethers.parseEther("1"));
      await marketplace.connect(buyer).buyNFT(1n, { value: ethers.parseEther("1") });

      const pending = await marketplace.pendingWithdrawals(seller.address); // BigNumber
      const before = await ethers.provider.getBalance(seller.address);      // BigNumber

      const tx = await marketplace.connect(seller).withdrawFunds();
      const receipt = await tx.wait();

// Chuyển BigNumber -> BigInt
      const gasUsed = BigInt(receipt.cumulativeGasUsed.toString()) * BigInt(tx.gasPrice.toString());
      const after = await ethers.provider.getBalance(seller.address);

      expect(BigInt(after.toString()) + gasUsed).to.equal(BigInt(before.toString()) + BigInt(pending.toString()));
    });

    it("Revert if no funds", async () => {
      await expect(
        marketplace.connect(seller).withdrawFunds()
      ).to.be.revertedWith("No funds to withdraw");
    });
  });
});
