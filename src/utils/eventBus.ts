// utils/eventBus.ts
import mitt, { Emitter } from 'mitt'

// 定义所有事件类型
type WalletEvents = {
  // 连接相关
  'wallet:connect': { 
    address: string; 
    chainId: number; 
    walletType: string 
  }
  'wallet:disconnect': void
  'wallet:accountsChanged': string[]
  'wallet:chainChanged': number
  
  // 交易相关
  'transaction:send': { 
    hash: string; 
    from: string; 
    to: string; 
    value: string 
  }
  'transaction:pending': { hash: string; confirmations: number }
  'transaction:confirmed': { 
    hash: string; 
    receipt: any; 
    blockNumber: number 
  }
  'transaction:failed': { 
    hash?: string; 
    error: string 
  }
  
  // 余额相关
  'balance:update': { 
    address: string; 
    balance: string; 
    chainId: number 
  }
  'balance:refresh': void
  
  // UI 相关
  'modal:open': { modalType: 'connect' | 'network' | 'transaction' }
  'modal:close': { modalType: 'connect' | 'network' | 'transaction' }
  
  // 错误相关
  'error:wallet': { 
    type: 'connection' | 'transaction' | 'network'; 
    message: string 
  }
}

// 创建全局事件总线
export const eventBus: Emitter<WalletEvents> = mitt<WalletEvents>()

// 使用示例
export const EventTypes = {
  WALLET_CONNECT: 'wallet:connect',
  WALLET_DISCONNECT: 'wallet:disconnect',
  ACCOUNTS_CHANGED: 'wallet:accountsChanged',
  CHAIN_CHANGED: 'wallet:chainChanged',
  TRANSACTION_SEND: 'transaction:send',
  TRANSACTION_PENDING: 'transaction:pending',
  TRANSACTION_CONFIRMED: 'transaction:confirmed',
  TRANSACTION_FAILED: 'transaction:failed',
  BALANCE_UPDATE: 'balance:update',
  BALANCE_REFRESH: 'balance:refresh',
  ERROR_WALLET: 'error:wallet'
} as const