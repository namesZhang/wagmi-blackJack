
// 创建钱包接口
export interface WalletStatus {
  address: string | null;
  chainId: number;
  isConnecting: boolean;
  isConnected: boolean;
  ensName: string;
  error: Error | null;
  chains: Chain[];
  provider: any;
}

export type Chain = {
   id: number;
   name: string;
   rpcUrl: string;
   currency: {
    name: string;
    symbol: string;
    decimals: number
   };
   blockExplorer: {
    name: string;
    url: string;
   }
}

// 创建钱包上下文接口
export interface WalletContextValue extends WalletStatus {
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  openChainModal: () => void;
  closeChainModal: (chainId: number) => void;
}

// 创建钱包provider
export type WalletProviderProps = {
  children: React.ReactNode;
  chains: Chain[];
  wallets: Wallet[];
  autoConnetc?:boolean;
  provider?: any
}

export interface Wallet {
  id: string,
  name: string,
  icon: string,
  connetc: () => Promise<any>;
  description?: string;
  installed?: boolean;
  downloadLink: string;
}