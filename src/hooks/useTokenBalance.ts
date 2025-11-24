import { useReadContract, useAccount } from "wagmi";
import { tokenAbi } from '../abis/tokenAbi'
import { useMemo } from "react";

export function UseTokenBalance(tokenAddress: string) {
  // 读取当前链接账户
  const { address, isConnected, chain, chainId } = useAccount()
  // 读取合约
  const { data: balance, isPending, refetch: refetchBalance } = useReadContract({
    abi: tokenAbi,
    address: tokenAddress as `0x${string}`,
    functionName: 'balancfOf',
    args: [address!],
    query: {enabled: !!address}
  })

  // 判断是否接入钱包
  if (!isConnected) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
        <p>🔌 请先连接钱包</p>
      </div>
    )
  }
}