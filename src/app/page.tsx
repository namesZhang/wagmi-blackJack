'use client'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import Link from 'next/link'

function App() {
  const account = useAccount()
  const { disconnect } = useDisconnect()
  // 读取账户余额
    const { data: balance } = useBalance({ address: account.address })
  return (
    <>
      <div>
        <h2 className='my-4 text-lg'>账户信息</h2>
        {/* 基础信息 */}
        <div className="p-4 border bg-gray-50 rounded space-y-2">
          <p>📝 钱包地址: {JSON.stringify(account.addresses)}</p>
          <p>💰 钱包余额：{balance?.formatted} SepoliaETH</p>
          <p>🌐 当前网络: Sepolia (ID: {account.chainId})</p>
          <p>✅ 链接状态：{account.status}</p>
        </div>
        {account.status === 'connected' && (
          <button className="px-2.5 py-1.5 bg-blue-500 text-white rounded" type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>
    </>
  )
}

export default App
