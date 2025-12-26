'use client'
import React from 'react'
import ShowEthersBalance from '../../components/ethers/showBalance'
import TransferTokenEthers from '@/components/ethers/transferToken'
import { useAccount } from 'wagmi'

// ERC20合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`
const RPC_URL = 'https://sepolia.infura.io/v3/450e2c5187cf435ba707cd8a68ff7e0b'

export default function page() {
  return (
    <div>
      <ShowEthersBalance
        tokenAddress={TOKEN_ADDRESS}
        rpcUrl={RPC_URL}
      />
      <TransferTokenEthers tokenAddress={TOKEN_ADDRESS} />
    </div>
  )
}
