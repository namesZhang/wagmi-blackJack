'use client'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWaitForCallsStatus } from "wagmi";
import { stakeAbi } from "@/assets/abis/stakeAbi";
import { useMemo } from "react";

// 质押合约地址
const STAKE_CONTRACT = '0xF136927bB54709e548fC77F7ee9947b5Ef3136ff'

// 质押 => 显示质押余额 staked amount
// 解质押 => 输入解质押金额进行 unstake
// 赎回 => 显示已赎回的可用金额（已过冷静期的）withDrawData[1]、正在赎回中的金额（未过冷静期的）pendingwithdraw = withDrawData[0]-withDrawData[1]
// 领取 => 显示可领取的质押奖励 pendingMetaNode == userInfo[2]
export function useStaking(pid: number = 0) {
  const { address, isConnected } = useAccount()

  // 读取用户信息
  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: STAKE_CONTRACT,
    abi: stakeAbi,
    functionName: 'user',
    args: [BigInt(pid), address!]
  })

  // 格式化用户质押信息
  const formattedStakedAmount = useMemo(() => {
    if (!userInfo?.[0]) return '0.0000'
    const amount = Number(userInfo[0]) / 10**18
    console.log('formattedStakedAmount',amount);
    return amount.toFixed(4)
  }, [userInfo])

  // 根绝用户信息的pendingMetaNode判断是否可领取
  const formattedClaimAmount = useMemo(() => {
    if (!userInfo?.[2]) return '0.0000'
    const amount = Number(userInfo[2]) / 10**18
    console.log('formattedClaimAmount',amount);
    return amount.toFixed(4)
  },[userInfo])

  // 读取已质押的代币
  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    address: STAKE_CONTRACT,
    abi: stakeAbi,
    functionName: 'stakingBalance',
    args: [BigInt(pid),address!],
    query: {
      enabled: !!address
    }
  })

  // 读取可赎回总代币和赎回中的代币
  const { data: withDrawData, refetch: refetchWithDrawData } = useReadContract({
    address: STAKE_CONTRACT,
    abi: stakeAbi,
    functionName: 'withdrawAmount',
    args: [BigInt(pid),address!],
    query: {
      enabled: !!address
    }
  })

  // 质押操作 stake
  const { writeContract: stake, data: stakeHash, isPending: isStaking } = useWriteContract()
  const { isLoading: isConfirmStaked } = useWaitForTransactionReceipt({
    hash: stakeHash
  })

  // 解质押 unstake
  const { writeContract: unstake, data: unstakeHash, isPending: isUnstaking  } = useWriteContract()
  const { isLoading: isConfirmUnstaked } = useWaitForTransactionReceipt({
    hash: unstakeHash
  })

  // 赎回 withDraw
  const { writeContract: withDraw, data: withDrawHash, isPending: isWithDrawing } = useWriteContract()
  const { isLoading: isConfirmWithDrawed } = useWaitForTransactionReceipt({
    hash: withDrawHash
  })

  // 领取奖励 claim
  const { writeContract: claim, data: claimHash, isPending: isClaiming } = useWriteContract()
  const { isLoading: isClaimed } = useWaitForTransactionReceipt({
    hash: claimHash
  })

  // 质押函数
  const handleStake = async (amount: string) => {
    if (Number(amount) <= 0) return
    const value = BigInt(Number(amount) * 10**18)
    try {
      await stake({
        address: STAKE_CONTRACT,
        abi: stakeAbi,
        functionName: 'depositETH',
        value
      })
    } catch (error) {
      console.log('质押报错:::',error);
    }
  }

  // 解质押函数
  const handleUnstake = async (amount: string) => {
    if (Number(amount) <= 0) return
    const value = BigInt(Number(amount) * 10**18)
    try {
      await unstake({
        address: STAKE_CONTRACT,
        abi: stakeAbi,
        functionName: 'unstake',
        args: [BigInt(pid), value]
      })
    } catch (error) {
      console.log('解质押报错:::', error)
    }
  }

  // 赎回函数
  const handleWithDraw = async () => {
    try {
      await withDraw({
        address: STAKE_CONTRACT,
        abi: stakeAbi,
        functionName: 'withdraw',
        args: [BigInt(pid)]
      })
    } catch (error) {
      console.log('赎回报错:::',error)
    }
  }

  // 领取奖励函数
  const handleClaim = async () => {
    try {
      await claim({
        address: STAKE_CONTRACT,
        abi: stakeAbi,
        functionName: 'claim',
        args: [BigInt(pid)]
      })
    } catch (error) {
      console.log('领取奖励报错:::',error)
    }
  }

  // 交易确认后刷新数据
  const refetchAll = () => {
    refetchStaked()
    refetchUserInfo() // 刷新用户数据
    refetchWithDrawData() // 刷新用户赎回数据
  }

  return {
    // 数据
    userInfo,
    stakedBalance,
    withDrawData,
    formattedStakedAmount,
    formattedClaimAmount,
    // 操作函数
    handleStake,
    handleUnstake,
    handleWithDraw,
    handleClaim,
    refetchAll,
    // 加载状态
    isStaking: isStaking,
    isConfirmStaked,
    isUnstaking,
    isConfirmUnstaked,
    isWithDrawing: isWithDrawing || isConfirmWithDrawed,
    isClaiming,
    isClaimed,
    // 钱包用户
    isConnected,
    address
  }
}