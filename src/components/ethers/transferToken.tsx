'use client'
import { useState } from "react"
import { ethers } from "ethers"
import { useAccount } from "wagmi"
import { tokenAbi } from "@/abis/tokenAbi"
import TransferEventListener from "./transferEventListener"

// 转账组件接口
interface TransferEthersProps {
  tokenAddress: string
}

// Ethers.js 转账组件
export default function TransferTokenEthers({ tokenAddress }:TransferEthersProps) {
  const { address, isConnected } = useAccount()
  const [toAddress, setToAddress]  = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  if (!isConnected) connectMetaMask()
  // 转账方法
  const handleTransfer = async () => {
    if (!address || !isConnected) {
      setError('请先连接钱包')
      return
    }
    if (!toAddress || !amount) {
      setError('请先填写地址和金额')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      // 使用Ethers.js 先创建Provider，用于访问区块链网络
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const singer = await provider.getSigner() // 转账签名
      const contract = new ethers.Contract(tokenAddress,tokenAbi,singer) // 读取合约
      // 获取当前账户地址
        const address = singer.getAddress();
        console.log('连接账户:', address);
      // 发送交易 并设置返回的交易hash
      const tx = await contract.transfer(toAddress,ethers.parseUnits(amount, 18))

      // 等待交易确认，清空表单
      await tx.wait()
      setToAddress('')
      setAmount('')
    } catch (err: any) {
      console.error('Ethers v6 转账失败:', err)
      setError(err.message || '转账失败')
    } finally {
      setIsLoading(false)
    }
  }

  async function connectMetaMask() {
    try {
      // 请求账户访问权限
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // 创建 ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 获取签名者
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('已连接 MetaMask 钱包:', userAddress);
      return { provider, signer, userAddress };
    } catch (error) {
      console.error('连接 MetaMask 失败:', error);
    }
  }

  if (!isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <p className="text-yellow-700">请先连接钱包</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mr-2">
          Ethers
        </span>
        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mr-2">
          发送转账
        </span>
      </h3>

      {/* 转账地址 */}
      <div>
        <label>接收地址</label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      {/* 转账金额 */}
      <div>
        <label>转账金额</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step='0.001'
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <button
        disabled={isLoading}
        onClick={handleTransfer}
        className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
      >{ isLoading ? '转账中':'发送转账' }</button>
      {/* 转账监听组件 */}
      <TransferEventListener tokenAddress={tokenAddress} />
    </div>
  )
}