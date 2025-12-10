'use client'
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { tokenAbi } from "@/assets/abis/tokenAbi";

interface EthersBalanceProps {
  tokenAddress: string,
  rpcUrl?: string,
  address?: string
}


export default function ShowEthersBalance({
  tokenAddress,
  rpcUrl,
  address
}: EthersBalanceProps) {
  const [balanceOf,setBalance] = useState<string>('0')
  const [contractName,setContractName] = useState<string>('')
  const fetchBalance = async () => {
    try {
      // 获取EthersV6Provider
      // 服务端JsonRpcProvider  客户端BrowserProvider
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      // 创建合约实例
      const contract = new ethers.Contract(tokenAddress, tokenAbi, provider)
      // 读取合约余额信息
      // const balanceOf = await Number(contract.balanceOf(address))
      const [balanceOf,contractName] = await Promise.all([
        contract.balanceOf(address),
        contract.name()
      ])
      const bal = (Number(balanceOf) / 10 ** 18).toLocaleString()
      setBalance(bal)
      setContractName(contractName)
    } catch (err: any) {
      console.error('Ethers v6 读取余额失败:', err)
    }
  }

  useEffect(() => {
    if (address && tokenAddress) {
      fetchBalance()
    }
  }, [address, tokenAddress, rpcUrl])


  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2">
          Ethers
        </span>
        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2">
          显示余额
        </span>
      </h3>
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>✅ ERC20 余额: {balanceOf} ERC20</p>
        <p>💰 钱包地址: {address}</p>
      </div>
      <div>
        <button 
          onClick={fetchBalance}
          className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
        >
          刷新余额
        </button>
      </div>
    </div>
  )
}