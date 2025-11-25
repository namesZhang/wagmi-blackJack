'use client'
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useState } from "react";
import { tokenAbi } from "../../abis/tokenAbi";
import TransferEventListener from './transferEventListener'

// 转账组件接口
interface TransferEthersProps {
  tokenAddress: string
}

// ERC20合约转账组件
export default function TransferToken({ tokenAddress }: TransferEthersProps) {
  const [amount,setAmount] = useState('1')
  const [toAddress, setToAddress]  = useState<string>('')

  // 写入合约
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  // 等待交易确认
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })
  // 发送代币方法
  const handleSend = () => {
    const toAmount = BigInt(Number(amount) * 10 ** 18) // 考虑小数位
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: tokenAbi,
      functionName: 'transfer',
      args: [ toAddress, toAmount ]
    })
  }

  return (
    <div className="w-screen p-6 border rounded space-y-4 mb-2.5">
      {/* 接收转账地址 */}
      <div>
        <label>接收地址</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
      </div>
      {/* 发送数量 */}
      <div>
        <label >发送数量：</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder='请输入发送数量'
          min="1"
        />
      </div>
      {/* 发送按钮 */}
      <button
        className="px-2.5 py-1.5 bg-blue-500 text-white rounded"
        onClick={handleSend}
        disabled = {isPending || isConfirming}
      >{isPending?'确认交易...':isConfirming?'交易确认中...':'发送代币'}</button>
      <TransferEventListener tokenAddress={tokenAddress}></TransferEventListener>
      {/* 错误显示 */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded">
          <p className="text-red-700">错误: {error.message}</p>
        </div>
      )}
    </div>
  )
}