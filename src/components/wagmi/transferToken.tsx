'use client'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useState } from "react";
import { tokenAbi } from "../../assets/abis/tokenAbi";
import TransferEventListener from './transferEventListener'
import { useWallet } from "@/wallet-sdk/privader";
import { eventBus } from "@/utils/eventBus";
import { ethers } from "ethers";

// 转账组件接口
interface TransferEthersProps {
  tokenAddress: string
}

// ERC20合约转账组件
export default function TransferToken({ tokenAddress }: TransferEthersProps) {
  const [amount, setAmount] = useState('1')
  const [toAddress, setToAddress] = useState<string>('')
  const { provider, address, signer } = useWallet()

  // 写入合约
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction()
  // 等待交易确认
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })
  // 发送代币方法
  const handleSend = async () => {
    // const toAmount = BigInt(Number(amount) * 10 ** 18) // 考虑小数位
    // try {
    //   sendTransaction({
    //     to: toAddress as `0x${string}`,
    //     value: toAmount
    //   })
    // } catch (err) {
    //   console.log('senderror=====',err);

    // }
    // const singer = await provider.getSinger()
    // ERC20代币转账需创建合约实例  sendTransaction 需要手动编码数据，value为0，因为是合约
    // 1. 创建合约实例
    const contract = new ethers.Contract(
      tokenAddress,
      tokenAbi,
      signer
    )
    // 2. 调用 transfer 方法
    const transaction = await contract.transfer(
      toAddress,
      ethers.parseUnits(amount, 18) // 100个代币（假设18位小数）
    )
    console.log('交易已发送:', transaction.hash)

    // 注册触发交易发送事件
    eventBus.emit('transaction:send', {
      hash: transaction.hash,
      from: address as string,
      to: toAddress,
      value: amount
    })

    // 等待交易确认
    const receipt = await transaction.wait()
    // 注册交易确认事件
    eventBus.emit('transaction:confirmed', {
      hash: transaction.hash,
      receipt,
      blockNumber: receipt.blockNumber || 0
    })
    console.log('交易确认:', receipt)
  }

  return (
    <div className="max-w-3xl mx-auto px-3 bg-gray-50 p-6 border rounded space-y-4 mb-2.5">
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
        disabled={isPending || isConfirming}
      >{isPending ? '确认交易...' : isConfirming ? '交易确认中...' : '发送代币'}</button>
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