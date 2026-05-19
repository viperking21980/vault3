/**
 * Blockchain interaction module.
 * Wraps the FileStorage smart contract calls via ethers.js v6.
 */

import { ethers } from 'ethers';
import type { FileMetadata } from '../types';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  'function addFile(string cid, string name, uint256 size, string fileType) external',
  'function deleteFile(string cid) external',
  'function getFiles(address user) external view returns (tuple(string cid, string name, uint256 size, string fileType, uint256 uploadedAt)[])',
  'function getFileCount(address user) external view returns (uint256)',
  'function hasFile(address user, string cid) external view returns (bool)',
  'event FileAdded(address indexed owner, string cid, string name, uint256 size, uint256 timestamp)',
  'event FileDeleted(address indexed owner, string cid, uint256 timestamp)',
];

const AMOY_CHAIN_ID = 80002n;
const AMOY_CHAIN_ID_HEX = '0x13882';

// Polygon Amoy requires minimum 25 gwei priority fee.
// We use 30 gwei to be safe.
const PRIORITY_FEE = ethers.parseUnits('30', 'gwei');
const MAX_FEE = ethers.parseUnits('40', 'gwei');

declare global {
  interface Window {
    ethereum?: any;
  }
}

function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) {
    throw new Error(
      'MetaMask не установлен. Установите MetaMask для использования Vault3.'
    );
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function getContract(): Promise<ethers.Contract> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error(
      'MetaMask не обнаружен. Установите его с https://metamask.io'
    );
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (accounts.length === 0) {
    throw new Error('Аккаунты не найдены');
  }

  const provider = getProvider();
  const network = await provider.getNetwork();

  if (network.chainId !== AMOY_CHAIN_ID) {
    await switchToAmoy();
  }

  return accounts[0];
}

async function switchToAmoy(): Promise<void> {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: AMOY_CHAIN_ID_HEX,
            chainName: 'Polygon Amoy',
            nativeCurrency: {
              name: 'POL',
              symbol: 'POL',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function addFileToBlockchain(
  cid: string,
  name: string,
  size: number,
  fileType: string
): Promise<string> {
  const contract = await getContract();
  const tx = await contract.addFile(cid, name, size, fileType, {
    maxPriorityFeePerGas: PRIORITY_FEE,
    maxFeePerGas: MAX_FEE,
  });
  await tx.wait();
  return tx.hash;
}

export async function deleteFileFromBlockchain(cid: string): Promise<string> {
  const contract = await getContract();
  const tx = await contract.deleteFile(cid, {
    maxPriorityFeePerGas: PRIORITY_FEE,
    maxFeePerGas: MAX_FEE,
  });
  await tx.wait();
  return tx.hash;
}

export async function getUserFiles(
  userAddress: string
): Promise<FileMetadata[]> {
  const contract = await getContract();
  const raw = await contract.getFiles(userAddress);

  return raw.map((item: any) => ({
    cid: item.cid,
    name: item.name,
    size: item.size,
    fileType: item.fileType,
    uploadedAt: item.uploadedAt,
  }));
}

export function onAccountChanged(callback: (address: string | null) => void) {
  if (!window.ethereum) return;
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    callback(accounts.length > 0 ? accounts[0] : null);
  });
}

export function getTxUrl(hash: string): string {
  return `https://amoy.polygonscan.com/tx/${hash}`;
}

export function getAddressUrl(address: string): string {
  return `https://amoy.polygonscan.com/address/${address}`;
}
