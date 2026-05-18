import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Network:", network.name, "chainId:", network.chainId.toString());
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error(
      "Cüzdanda testnet ETH yok. Base Sepolia faucet ile 0x" +
        deployer.address.slice(2) +
        " adresine ETH gönderin, sonra tekrar deploy edin.",
    );
  }

  const Factory = await ethers.getContractFactory("FormFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("FormFactory deployed to:", address);
  console.log("Set NEXT_PUBLIC_FORM_FACTORY_ADDRESS in frontend/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
