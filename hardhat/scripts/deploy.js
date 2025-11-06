const hre = require("hardhat");

async function main() {
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketPlace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.waitForDeployment();

  console.log("NFTMarketPlace deployed to:", marketplace.target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
