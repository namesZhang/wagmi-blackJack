'use client'

import { useReadContract, useBalance } from 'wagmi'
import { tokenAbi } from '../../assets/abis/tokenAbi'
import { useWallet } from '@/wallet-sdk/privader'

interface TransferEthersProps {
  tokenAddress: string
}

// 显示ERC20合约余额组件
export default function ShowTokenBalanceOf({ tokenAddress }: TransferEthersProps) {
  const { address, isConnected, chainId } = useWallet()
  const walletAddress = address as `0x${string}`

  // 读取账户余额
  const { data: nativeBalance } = useBalance({
    address: walletAddress,
    chainId: chainId as any,
    query: {
      enabled: !!address
    }
  })

  // 读取ERC20合约代币余额
  const { data: balance } = useReadContract({
    abi: tokenAbi,
    address: tokenAddress as `0x${string}`,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })

  // 判断是否接入钱包
  if (!isConnected) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
        <p>🔌 请先连接钱包</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded space-y-4 max-w-3xl mx-auto px-3 bg-gray-50 mb-2.5">
      <h2 className="text-xl font-bold">SepoliaETH余额</h2>
      {/* 基础信息 */}
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>💰 SepoliaETH 余额: {nativeBalance?.formatted} ETH</p>
        <p>📝 钱包地址: {address}</p>
        <p>🌐 当前网络: Sepolia (ID: {Number(chainId)})</p>
      </div>
      {/* 代币信息显示 */}
      <h2 className="text-xl font-bold">ERC20合约代币余额</h2>
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>✅ ERC20 余额: {balance ? (Number(balance) / 10 ** 18).toLocaleString() : '0'} ERC20</p>
        <p>💰 钱包地址: {address}</p>
        <p>🌐 当前网络: Sepolia (ID: {Number(chainId)})</p>
      </div>
    </div>
  )
}