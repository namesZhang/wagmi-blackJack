'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import WalletPrivoder from '@/wallet-sdk/privader'
import { getConfig } from '@/wagmi'
import { Chain, Wallet } from '@/wallet-sdk/type'
import { ethers } from 'ethers'
import { metaMaskWallet } from '@/wallet-sdk/connectors/metaMask'
import { coinBaseWallet } from '@/wallet-sdk/connectors/coinBase'
import { okxWallet } from '@/wallet-sdk/connectors/okxWallet'
import Header from '@/components/Header'

// 或者更简单的版本
declare global {
  interface Window {
    ethereum?: any;
  }
}

const chains: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io"
    },
  },
  {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8",
    currency: {
      name: "Sepolia Ether",
      symbol: "ETH", // 有时也显示为 ETH
      decimals: 18
    },
      blockExplorer: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io"
    }
  }
]

const wallets: Wallet[] = [ metaMaskWallet, coinBaseWallet, okxWallet ]

export function Providers(props: {
  children: ReactNode
  initialState?: State
}) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())
  //const provider = new ethers.BrowserProvider(window.ethereum)

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <WalletPrivoder chains={chains} autoConnetc={true} wallets={wallets}>
          <Header />
          {props.children}
        </WalletPrivoder>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
