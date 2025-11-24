'use client'

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId
} from 'wagmi'
import { tokenAbi } from '../../abis/tokenAbi'
import { useState } from 'react'

// ERC20合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`
// ERC20合约铸造代币组件
export default function MintToken() {
  const { address, isConnected, chain } = useAccount() // 获取账户地址和连接状态
  const [mintAmount, setMintAmount] = useState('1')

  // 检查合约代码是否存在
  const { data: contractCode } = useReadContract({
    abi: tokenAbi,
    address: TOKEN_ADDRESS,
    functionName: 'name', // 尝试读取任何函数来检查合约是否存在
  })
  console.log('contractCode====',contractCode);

  // 读取合约，获取合约地址的余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    abi: tokenAbi,
    address: TOKEN_ADDRESS,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })

  // 当前账户的连接的网络ID
  const chainId = useChainId()

  // 铸造代币方法
  const handleMint = () => {
    if (!address) return
    const amount = BigInt(Number(mintAmount) * 10 ** 18) // 考虑小数位
    writeContract({
      abi: tokenAbi,
      address: TOKEN_ADDRESS,
      functionName: 'mint',
      args: [amount]
    })
  }

  // 写入合约
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  return (
    <div className="p-6 border rounded space-y-4 max-w-6xl mb-2.5">
      <h2 className="text-xl font-bold">铸造代币</h2>
      {/* 状态概览 */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="p-3 border rounded">
          <p>🔄 连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</p>
          <p>🌐 网络: {chain?.name || '未知'}</p>
          <p>🆔 网络ID: {chainId}</p>
        </div>
        <div className="p-3 border rounded col-span-2">
          <p>📝 合约状态: {contractCode ? '✅ 有效' : '❌ 无效'}</p>
          <p>💰 当前地址: {address ? address : '未连接'}</p>
        </div>
      </div>
      {/* 余额显示 */}
      <div className="p-3 bg-gray-50 rounded">
        <p className="text-lg font-semibold">
          当前余额:{balance ? (Number(balance) / 10 ** 18).toLocaleString() : '0'} 代币
        </p>
      </div>
      {/* 铸造输入 */}
      <div>
        <label >铸造数量：</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          placeholder='请输入铸造数量'
          min="1"
        />
      </div>
      {/* 铸造按钮 */}
      <button
        className="px-2 py-1.5 bg-blue-500 rounded text-white"
        onClick={handleMint}
        disabled = {isPending || isConfirming}
      >{isPending?'确认交易...':isConfirming?'铸造中':'铸造代币'}</button>
      <button
        className="px-2 py-1.5 ml-2 bg-blue-500 rounded text-white"
        onClick={() => refetchBalance()}>刷新余额</button>
      {/* 交易状态 哈希值存在时显示 */}
      {hash && (
        <div>
          <p>交易哈希：{hash}</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
          >
              在区块浏览器中查看
          </a>
        </div>
      )}
      {
        isConfirmed && (
          <div>
            <p className="text-green-700">✅ 铸造成功!</p>
          </div>
      )}
      {/* 错误显示 */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded">
          <p className="text-red-700">错误: {error.message}</p>
        </div>
      )}
    </div>
  )
}