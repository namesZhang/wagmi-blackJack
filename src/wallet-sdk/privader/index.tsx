'use client'
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Wallet, WalletContextValue, WalletProviderProps, WalletStatus } from '../type'
import Modal from '@/wallet-sdk/components/modal'
import { useDisconnect, useSwitchChain } from 'wagmi';
import SwitchChainModal from '../components/switchChainModal';
import WalletStorage from '@/utils/storage';
import { ethers } from 'ethers';

const WalletContext = createContext<WalletContextValue>({
  connect: async () => { },
  disconnect: async () => { },
  isConnected: false,
  isConnecting: false,
  switchChain: function (chainId: number): Promise<void> {
    throw new Error('Function not implemented.')
  },
  openModal: function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
  closeModal: function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
  openChainModal: function () {

  },
  closeChainModal: function (chainId: number) {

  },
  address: null,
  chainId: -1,
  ensName: '',
  error: null,
  chains: [],
  provider: undefined
})

export const WalletPrivoder: React.FC<WalletProviderProps> = ({
  children,
  chains,
  wallets,
  autoConnetc,
  provider
}) => {
  // 声明钱包变量
  const [walletState, setWalletState] = useState<WalletStatus>({
    address: '',
    chainId: -1,
    isConnecting: false,
    isConnected: false,
    ensName: '',
    error: null,
    chains,
    provider,
  })

  // 声明弹框变量
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [chainModalOpen, setchainModalOpen] = useState<boolean>(false)
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  // 将wallets转换为map对象 {string => Wallet{...}}
  const walletsMap = useMemo(() => {
    return wallets.reduce((acc, wallet) => {
      acc[wallet.id] = wallet
      return acc
    }, {} as Record<string, Wallet>)
  }, [wallets])

  const value: WalletContextValue = {
    ...walletState,
    connect: async (walletId: string) => {
      const wallet = walletsMap[walletId]
      if (!wallet) {
        throw new Error(`Wallet ${walletId} is not found`)
      }
      setWalletState({ ...walletState, isConnecting: true })
      try {
        const { address, chainId, provider, shouldSwitchNetwork } = await wallet.connetc()
        setWalletState({
          ...walletState,
          address,
          chainId,
          provider,
          isConnected: true,
        })
        WalletStorage.saveWalletType(wallet.name)
        WalletStorage.saveAddress(address);
        // 判断是否切换网络
        if (shouldSwitchNetwork) {
          // 延迟切换，避免与连接过程冲突
          setTimeout(async () => {
            try {
              const savedChainId = WalletStorage.getChainId()
              await switchNetworkAfterConnect(Number(savedChainId), provider)
            } catch (error) {
              console.warn('Post-connect network switch failed:', error);
              // 切换失败不影响连接状态，使用当前网络
              WalletStorage.saveChainId(chainId);
            }
          }, 1000)
        } else {
          WalletStorage.saveChainId(chainId);
        }
        setModalOpen(false)
      } catch (error) {

      }
    },
    disconnect: async () => {
      disconnect()
      setWalletState({
        ...walletState,
        address: '',
        chainId: -1,
        isConnected: false,
      })
    },
    switchChain: async (chainId: number) => {
      await switchChain({ chainId: chainId as any })
      WalletStorage.saveChainId(chainId);
      setWalletState({
        ...walletState,
        chainId
      })
      setchainModalOpen(false)
    },
    openModal: function (): void {
      setModalOpen(true)
    },
    closeModal: function (): void {
      setModalOpen(false)
    },
    openChainModal: function (): void {
      setchainModalOpen(true)
    },
    closeChainModal: function (chainId: number): void {
      setchainModalOpen(false)
    }
  }

  // 切换网络函数
  const switchNetworkAfterConnect = async (chainId: number, provider: any) => {
    try {
      // 使用 wallet_switchEthereumChain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      // 等待网络切换完成（OKX 需要时间）
      await new Promise(resolve => setTimeout(resolve, 500));

      // 重新获取网络信息
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newNetwork = await newProvider.getNetwork();
      const newChainId = Number(newNetwork.chainId);

      if (newChainId === chainId) {
        // 更新状态
        setWalletState(prev => ({ ...prev, chainId: newChainId }));
        WalletStorage.saveChainId(newChainId);
      } else {
        console.warn(`网络切换未生效，当前网络: ${newChainId}`);
        WalletStorage.saveChainId(newChainId);
      }
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    if (autoConnetc) {
      // value.connect()
    }
  })

  // 保存连接状态
  // useEffect(() => {
  //   const { isConnected, address, chainId } = walletState
  //   if (isConnected && address) {
  //     WalletStorage.saveAddress(address)
  //     WalletStorage.saveChainId(chainId)
  //   } else {
  //     WalletStorage.clear()
  //   }
  // },[ walletState.isConnected, walletState.address, walletState.chainId ])

  // 自动重新连接
  useEffect(() => {
    if (autoConnetc && !walletState.isConnected) {
      const savedWalletType = WalletStorage.getWalletType()
      if (savedWalletType) {
        setTimeout(async () => {
          try {
            const wallet = wallets.find(w => w.name === savedWalletType);
            if (wallet) {
              await value.connect(wallet.id);
            }
          } catch (error) {
            console.error('Auto-connect failed:', error);
            WalletStorage.clear();
          }
        }, 1000)
      }
    }
  }, [walletState.isConnected, autoConnetc, walletState.chainId])

  return (
    <WalletContext.Provider value={value}>
      {children}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        wallets={wallets}
        onSelectWallet={(e) => value.connect(e.id)}
        connecting={false}
      />
      <SwitchChainModal
        chainId={value.chainId}
        open={chainModalOpen}
        onChangeChain={value.switchChain}
        onClose={value.closeChainModal}
      />
    </WalletContext.Provider>
  )
}

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a wallet Provider')
  }
  return context
}

export default WalletPrivoder 