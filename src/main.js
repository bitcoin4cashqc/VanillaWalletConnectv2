window.process = { env: { NODE_ENV: "development" } };

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
} from 'https://unpkg.com/@web3modal/ethereum@2.7.1';
import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.7.1';
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.js";

const {readContract, writeContract, waitForTransaction, configureChains, createConfig } = WagmiCore;

const chains = [
  {
    id: 80084,
    name: 'Berachain bArtio',
    nativeCurrency: {
      decimals: 18,
      name: 'BERA Token',
      symbol: 'BERA',
    },
    rpcUrls: { default: { http: ['https://bera-testnet.nodeinfra.com'] } },
    blockExplorers: { default: { url: 'https://bartio.beratrail.io' } },
    testnet: true,
  },
];

const projectId = '4a2aad5472b76afb2a498c7c9bb03197';


// Wagmi Configuration
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3modal = new Web3Modal({ projectId }, ethereumClient);

// ERC-20 ABI for balanceOf and transfer
const erc20Abi = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const begabeartoken = "0x73e88cfC79be97f8FB706Aa8476066C87eEa4Fc0"; // Replace with your ERC-20 token address
let account;

// Open Wallet Modal
document.getElementById("open-connect-modal").addEventListener("click", async () => {
  web3modal.openModal();
});

// Monitor Wallet Connection
ethereumClient.watchAccount(async (wagmiAccount) => {
  if (wagmiAccount.address && wagmiAccount.isConnected) {
    account = wagmiAccount.address;

    document.getElementById("wallet-address").innerText = `Wallet: ${account}`;
    document.getElementById("get-balance").disabled = false;
    document.getElementById("transfer-token").disabled = false;
  }
});

// Get Token Balance
document.getElementById("get-balance").addEventListener("click", async () => {
  if (account) {
    try {
      const balance = await readContract({
        address: begabeartoken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      });

      document.getElementById("user-balance").innerText = `Token Balance: ${ethers.utils.formatUnits(balance, 18)} Tokens`;
    } catch (err) {
      console.error("Error fetching balance:", err);
      alert("Failed to fetch balance. Check console for details.");
    }
  } else {
    alert("Connect your wallet first.");
  }
});

// Transfer Token
document.getElementById("transfer-token").addEventListener("click", async () => {
  if (account) {
    try {
      const randomAddress = "0x0000000000000000000000000000000000000001"; // Replace with desired recipient address
      const amount = ethers.utils.parseUnits("1", 18); // Sending 1 token

      const { hash } = await writeContract({
        address: begabeartoken,
        abi: erc20Abi,
        functionName: "transfer",
        args: [randomAddress, amount],
        account,
      });

      await waitForTransaction({ hash });
      alert(`Transferred 1 token to ${randomAddress}`);
    } catch (err) {
      console.error("Transfer failed:", err);
      alert("Transfer failed. Check console for details.");
    }
  } else {
    alert("Connect your wallet first.");
  }
});