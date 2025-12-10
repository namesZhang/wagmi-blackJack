'use client'
import { useEffect, useMemo } from 'react'
import { useStaking } from '@/hooks/useStaking'
import { useState } from 'react'

// 质押组件
export default function WithDraw() {
  // 获取质押hooks数据和方法
  const {
    handleUnstake,
    handleWithDraw,
    withDrawData,
    formattedStakedAmount,
    isUnstaking,
    isConfirmUnstaked,
    refetchAll
  } = useStaking()
  const [ UnstakeAmount, setUnStakeAmount ] = useState<string>('0')

  // 解质押按钮禁用
  const unStakeDisabled = useMemo(() => {
    return isUnstaking || Number(UnstakeAmount) <= 0
  }, [isUnstaking,UnstakeAmount])
  
  // 使用 useEffect 监听状态变化
  useEffect(() => {
    if (isConfirmUnstaked) { // 交易确认完成
      refetchAll()
    }
  }, [isConfirmUnstaked])
  
  return (
    <div className='max-w-3xl mx-auto px-3'>
      <h1 className='text-4xl text-blue-400 text-center pt-7 pb-6'>Withdraw</h1>
      <div className='text-gray-400 text-xl text-center pb-7'>Unstake and withdraw your ETH</div>
      <div className="border border-blue-400 rounded-lg">
        {/* 已质押金额 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 m-8'>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='text-sm text-gray-600 mb-1'>Staked Amount</div>
            <div className="text-2xl font-semibold text-blue-500">
              { formattedStakedAmount }ETH
            </div>
          </div>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='text-sm text-gray-600 mb-1'>Available to Withdraw</div>
            <div className="text-2xl font-semibold text-blue-500">
              { withDrawData ? Number(withDrawData[1]) / 10**18 : '0.0000' }ETH
            </div>
          </div>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='text-sm text-gray-600 mb-1'>Pending Withdraw</div>
            <div className="text-2xl font-semibold text-blue-500">
              { withDrawData ? (Number(withDrawData[0]) / 10**18 - Number(withDrawData[1]) / 10**18).toFixed(4) : '0.0000' }ETH
            </div>
          </div>
        </div>
        {/* 解质押 */}
        <div className='mx-8 my-6'>
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Unstake</h2>
          <label className='block text-sm font-medium text-gray-400'>Amount to Unstake</label>
          <input
            onChange={(e) => setUnStakeAmount(e.target.value)}
            value={UnstakeAmount} 
            className='text-white border border-blue-400 w-full rounded px-8 text-lg sm:text-xl py-3 sm:py-5'
            type="number"
          />
        </div>
        <div className='my-5 mx-8'>
          <button
            disabled={unStakeDisabled}
            onClick={() => handleUnstake(UnstakeAmount)}
            className='w-full py-3 sm:py-5 text-lg bg-blue-500 text-white rounded disabled:bg-gray-400'
          >
              { isUnstaking ? 'UnstakingETH...' : 'UnStake ETH' }
          </button>
        </div>
        {/* 赎回 */}
        <div className='px-8'>
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Withdraw</h2>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm text-gray-600'>Ready to Withdraw</div>
                <div className="text-2xl font-semibold text-blue-500">
                  { withDrawData ? Number(withDrawData[1]) / 10**18 : '0.0000' }ETH
                </div>
              </div>
              <div className='text-sm text-gray-500'>🕓20 min cooldown</div>
            </div>
          </div>
          <div className='text-sm text-gray-500 my-5'>!After unstaking, you need to wait 20 minutes to withdraw</div>
          <button
            disabled={Number(withDrawData? withDrawData[1] : 0) <= 0}
            onClick={() => handleWithDraw()}
            className='w-full py-3 mb-5 sm:py-5 text-lg bg-blue-500 text-white rounded disabled:bg-gray-400'
          >
              Withdraw ETH
          </button>
        </div>
      </div>
    </div>
  )
}
