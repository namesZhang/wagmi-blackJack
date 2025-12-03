'use client'
import { useCallback, useEffect, useMemo } from 'react'
import {useStaking} from '@/hooks/useStaking'
import { useState } from 'react'
import { useBalance } from 'wagmi'
import { formatEther } from 'ethers'

// 质押组件
export default function Stake() {
  // 获取质押hooks数据和方法
  const {
    handleStake,
    formattedStakedAmount,
    isStaking,
    isConfirmStaked,
    address,
    refetchAll
  } = useStaking()
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address }) // 账户余额
  const [ stakeAmount, setStakeAmount ] = useState<string>('0')
  
  // 余额转换
  const availableBalanceEth = useMemo(() => {
    const val = ethBalance?.value || BigInt(0)
    return parseFloat(formatEther(val))
  },[ethBalance])

  // 校验input输入内容
  const validateInput = useCallback((val: string) => {
    const amount = parseFloat(val)
    if (val == '' || isNaN(amount)) {
      return { isValid: true }
    }
    // 输入小于0大于可用金额时，返回false
    if (amount < 0 || amount > availableBalanceEth) {
      return { isValid: false }
    }
    return { isValid: true }
  },[availableBalanceEth])

  // 使用 useEffect 监听状态变化
  useEffect(() => {
    if (isConfirmStaked === false) { // 交易确认完成
      refetchAll()
      refetchBalance()
    }
  }, [isConfirmStaked, refetchAll, refetchBalance])
  return (
    <div className='max-w-3xl mx-auto px-3'>
      <h1 className='text-4xl text-blue-400 text-center pt-7 pb-6'>MetaNode Stake</h1>
      <div className='text-gray-400 text-xl text-center pb-7'>Stake ETH to earn tokens</div>
      <div className="border border-blue-400 rounded-lg">
        {/* 已质押金额 */}
        <div className='rounded mx-8 my-6 px-3 py-6 border border-blue-400'>
          <div className='text-gray-400 text-base sm:text-lg mb-1'>Staked Amount</div>
          <div className='text-3xl sm:text-5xl font-bold bg-linear-to-r bg-clip-text text-blue-500 leading-tight break-all'>
            { formattedStakedAmount }ETH
          </div>
        </div>
        {/* 质押输入 */}
        <div className='mx-8 my-6'>
          <label className='block text-sm font-medium text-gray-400'>Amount to stake</label>
          <input
            onChange={(e) => setStakeAmount(e.target.value)}
            value={stakeAmount} 
            className='text-white border border-blue-400 w-full rounded px-8 text-lg sm:text-xl py-3 sm:py-5'
            type="number"
          />
          <div className='text-sm text-gray-500'>Available: {availableBalanceEth.toFixed(4)}ETH</div>
        </div>
        <div className='my-5 mx-8'>
          <button
            disabled={isStaking || !validateInput(stakeAmount).isValid || isConfirmStaked}
            onClick={() => handleStake(stakeAmount)}
            className='w-full py-3 sm:py-5 text-lg bg-blue-500 text-white rounded disabled:bg-gray-400'
          >
              { isStaking ? 'stakingETH...' : 'Stake ETH' }
          </button>
        </div>
      </div>
    </div>
  )
}
