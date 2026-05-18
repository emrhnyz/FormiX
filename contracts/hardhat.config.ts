import { HardhatUserConfig, subtask } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@cofhe/hardhat-plugin";
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";
import * as dotenv from "dotenv";

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(async (_, __, runSuper) => {
  const paths: string[] = await runSuper();
  return paths.filter((p) => !p.includes("node_modules"));
});

dotenv.config({ path: "../.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  cofhe: {
    logMocks: true,
    gasWarning: true,
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: ".",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  defaultNetwork: "hardhat",
  // eth-sepolia & arb-sepolia are auto-injected by @cofhe/hardhat-plugin
  networks: {
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
      chainId: 84532,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasMultiplier: 1.2,
      timeout: 60000,
    },
  },
};

export default config;
