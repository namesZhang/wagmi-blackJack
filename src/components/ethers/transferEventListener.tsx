'use client'
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { tokenAbi } from "@/abis/tokenAbi";

// 转账组件接口
interface TransferEthersProps {
  tokenAddress: string
}

interface TransferEvent {
  from: string,
  to: string,
  value: bigint,
  transactionHash: string
}

// Ethers.js 转账监听组件
export default function TransferEventListener({ tokenAddress }: TransferEthersProps) {
  const [transfers, setTransfers] = useState<TransferEvent[]>([])

  useEffect(() => {
    if (!tokenAddress) return

    let contract
    const startListening = () => {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        contract = new ethers.Contract(tokenAddress,tokenAbi,provider)

        // 监听事件
        contract.on('Transfer', (from,to,value,event) => {
          const newTransfer: TransferEvent = {
            from,
            to,
            value,
            transactionHash: event.transactionHash
          }

          setTransfers(prev => [newTransfer, ...prev.slice(0, 9)])
        })
        console.log('开始监听Transfer事件...')
      } catch(error) {
        console.log('启动监听失败...', error);
      }
    }

    startListening()
  })
  
  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">实时转账事件监听</h3>
      <div>
        {transfers.map((transfer,index) => (
          <div className="mb-2" key={index}>
            <div className="bg-gray-200 py-1.5 px-1.5 rounded">
              <span>form: {transfer.from}</span>
              <span className="px-4">to: {transfer.to}</span>
              <span>value: {Number(transfer.value) / 10 ** 18}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}