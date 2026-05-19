import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet as connectWalletFn,
  onAccountChanged,
} from '../lib/blockchain';

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = (await window.ethereum.request({
          method: 'eth_accounts',
        })) as string[];
        if (accounts.length > 0) {
          setState((s) => ({ ...s, address: accounts[0] }));
        }
      } catch (err) {
        console.error('Failed to check connection:', err);
      }
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    onAccountChanged((address) => {
      setState((s) => ({ ...s, address }));
    });
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const address = await connectWalletFn();
      setState({ address, isConnecting: false, error: null });
    } catch (err: any) {
      setState({
        address: null,
        isConnecting: false,
        error: err.message || 'Failed to connect wallet',
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, isConnecting: false, error: null });
  }, []);

  return {
    address: state.address,
    isConnected: !!state.address,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
  };
}