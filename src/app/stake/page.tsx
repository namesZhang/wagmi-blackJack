'use client'
import { useState } from 'react'
import Stake from '@/components/stake/stake'
import WithDraw from '@/components/stake/withDraw'
import Claim from '@/components/stake/claim'

export default function page() {
  const tabList = [
    { name: 'stake', active: '0' },
    { name: 'withDraw', active: '1' },
    { name: 'claim', active: '2' }
  ]
  const [showTabActive, setTabActive] = useState('0')
  const showComp = () => {
    switch (showTabActive) {
      case '0': return <Stake />
      case '1': return <WithDraw />
      case '2': return <Claim />
    }
  }
  const showClass = (val: string) => {
    return showTabActive == val ? 'text-2xl px-2 text-blue-400 border-b border-blue-400' : 'text-2xl text-white px-2'
  }
  return (
    <div className='max-w-3xl mx-auto px-3'>
      <div className='flex justify-around py-5'>
        {tabList.map(tab => {
          return (
            <div
              key={tab.active}
              onClick={() => setTabActive(tab.active)}
              className={showClass(tab.active)}
            >
              { tab.name }
            </div>
          )
        })}
      </div>
      {/* 展示页面 */}
      <div>
        { showComp() }
      </div>
    </div>
  )
}
