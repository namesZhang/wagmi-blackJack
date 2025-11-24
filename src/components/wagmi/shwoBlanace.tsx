'use client'

import { useAccount, useReadContract, useBalance } from 'wagmi'
import { tokenAbi } from '../../abis/tokenAbi'
import { sepolia } from 'wagmi/chains'

// ERC20合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`

// 显示ERC20合约余额组件
export default function ShowTokenBalanceOf() {
  const { address, isConnected, chainId } = useAccount()

  // 读取账户余额
  const { data: nativeBalance } = useBalance({ address })

  // 读取ERC20合约代币余额
  const { data: balance, error } = useReadContract({
    abi: tokenAbi,
    address: TOKEN_ADDRESS,
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

  // 判断当前网络是否sepolia测试网
  if (chainId !== sepolia.id) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded">
        <p>🌐 网络错误</p>
        <p>当前网络: {chainId}，应该是: {sepolia.id} (Sepolia)</p>
        <p>请在 MetaMask 中切换到 Sepolia 测试网</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded space-y-4">
      <h2 className="text-xl font-bold">SepoliaETH余额</h2>
      {/* 基础信息 */}
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>💰 SepoliaETH 余额: {nativeBalance?.formatted} ETH</p>
        <p>📝 钱包地址: {address}</p>
        <p>🌐 当前网络: Sepolia (ID: {chainId})</p>
      </div>
      {/* 代币信息显示 */}
      <h2 className="text-xl font-bold">ERC20合约代币余额</h2>
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>✅ ERC20 余额: {balance ? (Number(balance) / 10 ** 18).toLocaleString() : '0'} ERC20</p>
        <p>💰 钱包地址: {address}</p>
        <p>🌐 当前网络: Sepolia (ID: {chainId})</p>
      </div>
    </div>
  )
}