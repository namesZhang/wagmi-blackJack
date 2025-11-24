import MintToken from '@/components/wagmi/mintToken'
import ShowTokenBalance from '@/components/wagmi/shwoBlanace'
import TransferToken from '@/components/wagmi/transferToken'
import React from 'react'

export default function page() {
  return (
    <div>
      <MintToken></MintToken>
      <ShowTokenBalance></ShowTokenBalance>
      <TransferToken></TransferToken>
    </div>
  )
}
