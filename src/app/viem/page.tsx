import React from 'react'
import ShowBalanceComponent from '@/components/viem/showBalance'
import TransferTokenCompoent from '@/components/viem/transferToken'

export default function page() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <ShowBalanceComponent />
      <TransferTokenCompoent />
    </div>
  )
}
