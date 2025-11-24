'use client'
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useState } from "react";
import { tokenAbi } from "../../abis/tokenAbi";
import TransferEventListener from './transferEventListener'

// ERC20合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`
// 接收转账地址
const TO_ADDRESS = '0xd30b718527191CA332dB5b6254474fe7A625fD15' as `0x${string}`

// ERC20合约转账组件
export default function TransferToken() {
  const [amount,setAmount] = useState('1')

  // 写入合约
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  // 等待交易确认
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })
  // 发送代币方法
  const handleSend = () => {
    const toAmount = BigInt(Number(amount) * 10 ** 18) // 考虑小数位
    writeContract({
      address: TOKEN_ADDRESS,
      abi: tokenAbi,
      functionName: 'transfer',
      args: [ TO_ADDRESS, toAmount ]
    })
  }

  return (
    <div className="w-screen p-6 border rounded space-y-4 mb-2.5">
      {/* 交易输入 */}
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
      <TransferEventListener></TransferEventListener>
      {/* 错误显示 */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded">
          <p className="text-red-700">错误: {error.message}</p>
        </div>
      )}
    </div>
  )
}