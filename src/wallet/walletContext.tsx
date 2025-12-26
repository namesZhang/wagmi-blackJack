'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, ethers, formatEther } from 'ethers';

// 支持的连接器类型
export type ConnectorType = 'injected' | 'walletConnect' | 'coinbase' | 'okx';

// 钱包信息接口
export interface WalletInfo {
  name: string;
  icon: string;
  description: string;
}

// 网络配置接口
export interface NetworkConfig {
  chainId: number;
  name: string;
  currency: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// 余额信息接口
export interface BalanceInfo {
  formatted: string;  // 格式化后的余额字符串
  value: bigint;      // 原始余额值
  symbol: string;     // 代币符号
}

interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: bigint | null;
  balance: BalanceInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  connectedWallet: ConnectorType | null;
}

interface WalletContextType extends WalletState {
  connectWallet: (connectorType: ConnectorType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  getSupportedNetworks: () => NetworkConfig[];
  getAvailableWallets: () => WalletInfo[];
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 支持的网络配置（更新部分 RPC URL）
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    currency: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  {
    chainId: 5,
    name: 'Goerli Testnet',
    currency: 'Goerli Ether',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth-goerli.public.blastapi.io',
    explorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
  },
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    currency: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  {
    chainId: 137,
    name: 'Polygon Mainnet',
    currency: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    currency: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  {
    chainId: 10,
    name: 'Optimism',
    currency: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
];

// 支持的钱包信息
export const SUPPORTED_WALLETS: Record<ConnectorType, WalletInfo> = {
  injected: {
    name: 'MetaMask',
    icon: '🦊',
    description: '浏览器扩展钱包',
  },
  okx: {
    name: 'OKX Wallet',
    icon: '🔶',
    description: 'OKX 浏览器扩展钱包',
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '⬣',
    description: 'Coinbase 浏览器扩展钱包',
  },
  walletConnect: {
    name: 'WalletConnect',
    icon: '🔗',
    description: '移动端钱包扫码连接',
  },
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isLoading: false,
    connectedWallet: null,
  });

  // 获取当前网络的配置
  const getCurrentNetworkConfig = (chainId: bigint | null): NetworkConfig | undefined => {
    if (!chainId) return undefined;
    return SUPPORTED_NETWORKS.find(net => net.chainId === Number(chainId));
  };

  // 获取余额
  const fetchBalance = async (address: string, provider: BrowserProvider, chainId: bigint): Promise<BalanceInfo> => {
    try {
      const balance = await provider.getBalance(address);
      const networkConfig = getCurrentNetworkConfig(chainId);
      const symbol = networkConfig?.symbol || 'ETH';
      
      return {
        formatted: formatEther(balance),
        value: balance,
        symbol,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return {
        formatted: '0',
        value: BigInt(0),
        symbol: 'ETH',
      };
    }
  };

  // 更新余额
  const updateBalance = async () => {
    const { address, provider, chainId } = state;
    if (address && provider && chainId) {
      try {
        const balanceInfo = await fetchBalance(address, provider, chainId);
        setState(prev => ({ ...prev, balance: balanceInfo }));
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }
  };

  // 余额轮询
  useEffect(() => {
    if (!state.isConnected || !state.address) return;

    // 初始获取余额
    updateBalance();

    // 设置轮询间隔（每30秒更新一次）
    const intervalId = setInterval(updateBalance, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isConnected, state.address, state.chainId]);

  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const savedWallet = localStorage.getItem('connectedWallet') as ConnectorType;
    
    if (savedAddress) {
      checkConnection(savedWallet);
    }
  }, []);

  const detectWalletProvider = (connectorType: ConnectorType) => {
    if (!window.ethereum) return null;

    // 如果是 MetaMask
    if (connectorType === 'injected' && window.ethereum.isMetaMask) {
      return window.ethereum;
    }

    // 如果是 OKX 钱包
    if (connectorType === 'okx' && window.ethereum.isOKExWallet) {
      return window.ethereum;
    }

    // 如果是 Coinbase 钱包
    if (connectorType === 'coinbase' && window.ethereum.isCoinbaseWallet) {
      return window.ethereum;
    }

    // 处理多个提供商的情况
    if (window.ethereum.providers) {
      for (const provider of window.ethereum.providers) {
        if (connectorType === 'injected' && provider.isMetaMask) {
          return provider;
        }
        if (connectorType === 'okx' && provider.isOKExWallet) {
          return provider;
        }
        if (connectorType === 'coinbase' && provider.isCoinbaseWallet) {
          return provider;
        }
      }
    }

    // 默认返回第一个注入的钱包
    return window.ethereum;
  };

  const checkConnection = async (walletType?: ConnectorType) => {
    try {
      const walletTypes: ConnectorType[] = ['injected', 'okx', 'coinbase'];
      
      for (const type of walletTypes) {
        const provider = detectWalletProvider(type);
        if (provider) {
          const browserProvider = new BrowserProvider(provider);
          const accounts = await browserProvider.listAccounts();
          
          if (accounts.length > 0) {
            const signer = await browserProvider.getSigner();
            const network = await browserProvider.getNetwork();
            const address = await signer.getAddress();
            const balanceInfo = await fetchBalance(address, browserProvider, network.chainId);
            
            setState({
              address,
              provider: browserProvider,
              signer,
              chainId: network.chainId,
              balance: balanceInfo,
              isConnected: true,
              isLoading: false,
              connectedWallet: type,
            });
            
            localStorage.setItem('walletAddress', address);
            localStorage.setItem('connectedWallet', type);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('connectedWallet');
    }
  };

  const connectWallet = async (connectorType: ConnectorType) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      let providerInstance = detectWalletProvider(connectorType);

      if (!providerInstance) {
        switch (connectorType) {
          case 'injected':
            throw new Error('请安装 MetaMask 钱包！');
          case 'okx':
            throw new Error('请安装 OKX 钱包！');
          case 'coinbase':
            throw new Error('请安装 Coinbase 钱包！');
          default:
            throw new Error('请安装 Web3 钱包！');
        }
      }

      // 如果是多个提供商，设置当前提供商
      if (window.ethereum?.providers && window.ethereum.providers.length > 1) {
        window.ethereum = providerInstance;
      }

      // 请求账户连接
      await providerInstance.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(providerInstance);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balanceInfo = await fetchBalance(address, provider, network.chainId);

      setState({
        address,
        provider,
        signer,
        chainId: network.chainId,
        balance: balanceInfo,
        isConnected: true,
        isLoading: false,
        connectedWallet: connectorType,
      });

      localStorage.setItem('walletAddress', address);
      localStorage.setItem('connectedWallet', connectorType);
      
      // 设置事件监听器
      providerInstance.on('accountsChanged', handleAccountsChanged);
      providerInstance.on('chainChanged', handleChainChanged);
      providerInstance.on('disconnect', handleDisconnectEvent);
      
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      if (error.code === 4001) {
        alert('连接请求被用户拒绝');
      } else if (error.code === -32002) {
        alert('请解锁钱包并重试');
      } else {
        alert(`连接失败: ${error.message || '未知错误'}`);
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      const newAddress = accounts[0];
      
      if (state.provider && state.chainId) {
        try {
          const balanceInfo = await fetchBalance(newAddress, state.provider, state.chainId);
          setState(prev => ({
            ...prev,
            address: newAddress,
            balance: balanceInfo,
          }));
          localStorage.setItem('walletAddress', newAddress);
        } catch (error) {
          console.error('Failed to update balance on account change:', error);
        }
      }
    }
  };

  const handleChainChanged = async (chainIdHex: string) => {
    const chainId = BigInt(chainIdHex);
    
    if (state.provider && state.address) {
      try {
        // 获取新网络的余额
        const balanceInfo = await fetchBalance(state.address, state.provider, chainId);
        
        setState(prev => ({
          ...prev,
          chainId,
          balance: balanceInfo,
        }));
        
        // 不刷新页面，只更新状态
        console.log('Network changed to:', chainId);
      } catch (error) {
        console.error('Failed to update balance on chain change:', error);
        // 如果失败，仍然更新链ID
        setState(prev => ({ ...prev, chainId }));
      }
    } else {
      setState(prev => ({ ...prev, chainId }));
    }
  };

  const handleDisconnectEvent = () => {
    disconnectWallet();
  };

  const disconnectWallet = () => {
    setState({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isLoading: false,
      connectedWallet: null,
    });
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    
    // 移除事件监听器
    if (window.ethereum) {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      window.ethereum.removeListener?.('disconnect', handleDisconnectEvent);
    }
  };

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await addNetwork(chainId);
      } else {
        console.error('Failed to switch network:', error);
        throw error;
      }
    }
  };

  const addNetwork = async (chainId: number) => {
    const networkConfig = SUPPORTED_NETWORKS.find(net => net.chainId === chainId);
    if (!networkConfig) {
      throw new Error(`不支持的链 ID: ${chainId}`);
    }

    try {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: networkConfig.name,
          nativeCurrency: {
            name: networkConfig.currency,
            symbol: networkConfig.symbol,
            decimals: networkConfig.decimals,
          },
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: [networkConfig.explorerUrl],
        }],
      });
    } catch (error) {
      console.error('Failed to add network:', error);
      throw error;
    }
  };

  const getSupportedNetworks = () => {
    return SUPPORTED_NETWORKS;
  };

  const getAvailableWallets = () => {
    const availableWallets: WalletInfo[] = [];
    
    if (window.ethereum?.isMetaMask || 
        window.ethereum?.providers?.some((p: any) => p.isMetaMask)) {
      availableWallets.push(SUPPORTED_WALLETS.injected);
    }
    
    if (window.ethereum?.isOKExWallet || 
        window.ethereum?.providers?.some((p: any) => p.isOKExWallet)) {
      availableWallets.push(SUPPORTED_WALLETS.okx);
    }
    
    if (window.ethereum?.isCoinbaseWallet || 
        window.ethereum?.providers?.some((p: any) => p.isCoinbaseWallet)) {
      availableWallets.push(SUPPORTED_WALLETS.coinbase);
    }
    
    availableWallets.push(SUPPORTED_WALLETS.walletConnect);
    
    return availableWallets;
  };

  const refreshBalance = async () => {
    if (state.address && state.provider && state.chainId) {
      try {
        const balanceInfo = await fetchBalance(state.address, state.provider, state.chainId);
        setState(prev => ({ ...prev, balance: balanceInfo }));
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        getSupportedNetworks,
        getAvailableWallets,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};