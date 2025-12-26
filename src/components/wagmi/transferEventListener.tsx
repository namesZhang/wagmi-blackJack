import { useWatchContractEvent, useAccount } from "wagmi";
import { tokenAbi } from "@/assets/abis/tokenAbi";
import { useEffect, useState } from "react";
import { sepolia } from "wagmi/chains";

interface TransferEvent {
  from: string,
  to: string,
  value: bigint,
  transactionHash: string
}

interface TransferEthersProps {
  tokenAddress: string
}

export default function TransferEventListener({ tokenAddress }: TransferEthersProps) {
  const [transfers,setTransfers] = useState<TransferEvent[]>([])

  // 监听transfer事件
  useWatchContractEvent({
    address: tokenAddress as `0x${string}`,
    abi: tokenAbi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      console.log('监听到transfer事件', logs);
      logs.forEach(log => {
        // 类型断言
        const typedLog = log as unknown as {
          args: {
            from: string
            to: string
            value: bigint
          }
          transactionHash: string
        }
        if (typedLog.args) {
          const newTransfer: TransferEvent = {
            from: typedLog.args.from,
            to: typedLog.args.to,
            value: typedLog.args.value,
            transactionHash: typedLog.transactionHash as `0x${string}`
          }
          
          setTransfers(prev => [newTransfer, ...prev.slice(0, 9)]) // 只保留最近10条
        }
      })
    },
    chainId: sepolia.id,
  })

  return (
    <div className="max-w-3xl mx-auto px-3 bg-gray-50 p-6 border rounded-lg">
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