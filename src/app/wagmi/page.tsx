import MintToken from '@/components/wagmi/mintToken'
import ShowTokenBalance from '@/components/wagmi/shwoBlanace'
import TransferToken from '@/components/wagmi/transferToken'
import React from 'react'

// ERC20合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`

export default function page() {
  return (
    <div>
      <ShowTokenBalance tokenAddress={TOKEN_ADDRESS}></ShowTokenBalance>
      <TransferToken tokenAddress={TOKEN_ADDRESS}></TransferToken>
      <MintToken tokenAddress={TOKEN_ADDRESS}></MintToken>
    </div>
  )
}
