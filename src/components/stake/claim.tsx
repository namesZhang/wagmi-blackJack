'use client'
import { useEffect, useMemo } from 'react'
import {useStaking} from '@/hooks/useStaking'
import { useState } from 'react'

// 质押组件
export default function Claim() {
  // 获取质押hooks数据和方法
  const {
    formattedStakedAmount,
    formattedClaimAmount,
    userInfo,
    handleClaim,
    isClaiming,
    isClaimed
  } = useStaking()
  const [ UnstakeAmount, setUnStakeAmount ] = useState<string>('0')
  console.log('userInfo:::',userInfo)
  const canClaim = parseFloat(formattedClaimAmount) > 0
  // 使用 useEffect 监听状态变化
  // useEffect(() => {
  //   if (isConfirmUnstaked === false) { // 交易确认完成
  //     refetchAll()
  //   }
  // }, [isConfirmUnstaked, refetchAll])
  return (
    <div className='max-w-3xl mx-auto px-3'>
      <h1 className='text-4xl text-blue-400 text-center pt-7 pb-6'>Claim Rewards</h1>
      <div className='text-gray-400 text-xl text-center pb-7'>Claim your MetaNode rewards</div>
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
            <div className='text-sm text-gray-600 mb-1'>Pending Rewards</div>
            <div className="text-2xl font-semibold text-blue-500">
              { formattedClaimAmount }
            </div>
          </div>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='text-sm text-gray-600 mb-1'>Last Update</div>
            <div className="text-2xl font-semibold text-blue-500">
              ...
            </div>
          </div>
        </div>
        {/* 领取奖励 */}
        <div className='my-5 mx-8'>
          <button
            disabled={!canClaim}
            onClick={() => handleClaim()}
            className='w-full py-3 sm:py-5 text-lg bg-blue-500 text-white rounded disabled:bg-gray-400'
          >
              {isClaiming ? 'Processing...' : canClaim ? 'Claim Rewards' : 'No Rewards'}
          </button>
        </div>
      </div>
    </div>
  )
}
