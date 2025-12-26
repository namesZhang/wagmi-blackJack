'use client'
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  CONNECTED_WALLET: 'connected_wallet',
  LAST_CONNECTED: 'last_connected',
  CHAIN_ID: 'chain_id',
  WALLET_TYPE: 'wallet_type', // 'injected', 'walletconnect', 'coinbase'
} as const;

class WalletStorage {
  // 保存钱包地址
  static saveAddress(address: string): void {
    if (typeof window == 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS,address)
    localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED,Date.now().toString())
  }

  // 获取保存的钱包地址
  static getAddress(): string | null {
    if (typeof window == 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS)
  }

  // 保存连接的钱包类型
  static saveWalletType(walletType: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WALLET_TYPE, walletType);
  }

  // 获取保存的钱包类型
  static getWalletType(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.WALLET_TYPE);
  }

  // 保存链ID
  static saveChainId(chainId: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CHAIN_ID, chainId.toString());
  }

  // 获取保存的链 ID
  static getChainId(): number | null {
    if (typeof window === 'undefined') return null;
    const chainId = localStorage.getItem(STORAGE_KEYS.CHAIN_ID);
    return chainId ? parseInt(chainId, 10) : null;
  }

  // 清除所有钱包数据
  static clear(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // 检查是否在有效期内（比如7天内自动连接）
  static isValid(): boolean {
    if (typeof window === 'undefined') return false;
    const lastConnected = localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED);
    if (!lastConnected) return false;
    
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(lastConnected) < sevenDays;
  }
}

export default WalletStorage;