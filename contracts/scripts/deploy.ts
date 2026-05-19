import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FileStorage contract...");

  const FileStorage = await ethers.getContractFactory("FileStorage");
  const fileStorage = await FileStorage.deploy();
  await fileStorage.waitForDeployment();

  const address = await fileStorage.getAddress();

  console.log("");
  console.log(" FileStorage deployed to:", address);
  console.log("");
  console.log("Save this address — you'll need it in the frontend .env");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Deployment failed:");
    console.error(error);
    process.exit(1);
  });