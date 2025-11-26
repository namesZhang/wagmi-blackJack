// store/transferStore.ts - 数组版本
import { create } from 'zustand'

interface TransferState {
  pendingTransactions: string[]
  addPendingTransaction: (txHash: string) => void
  removePendingTransaction: (txHash: string) => void
  isTransactionPending: (txHash: string) => boolean
  clearPendingTransactions: () => void
}

export const useTransferStore = create<TransferState>((set, get) => ({
  pendingTransactions: [],
  
  addPendingTransaction: (txHash: string) => {
    console.log('➕ 添加待处理交易:', txHash)
    set((state) => ({
      pendingTransactions: [...state.pendingTransactions, txHash]
    }))
  },
  
  removePendingTransaction: (txHash: string) => {
    console.log('➖ 移除待处理交易:', txHash)
    set((state) => ({
      pendingTransactions: state.pendingTransactions.filter(tx => tx !== txHash)
    }))
  },
  
  isTransactionPending: (txHash: string) => {
    return get().pendingTransactions.includes(txHash)
  },
  
  clearPendingTransactions: () => {
    set({ pendingTransactions: [] })
  }
}))