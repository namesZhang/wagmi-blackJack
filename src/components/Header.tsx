'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi'
import Modal from './modal'
import { formatEther } from 'ethers'

const Header = () => {
  const links = [
    { name: 'wagmi', path: '/wagmi' },
    { name: 'ethers', path: '/ethers' },
    { name: 'viem', path: '/viem' },
    { name: 'stake', path: '/stake' },
  ]
  const pathName = usePathname() // 获取当前路径
  const [modalOpen, setModalOpen] = useState(false); // 弹框显示
  const { isConnected, address } = useAccount() // 读取账户地址
  const { data: ethBalance } = useBalance({ address }) // 账户余额
  const { connectors, connect, status, error } = useConnect() // 链接钱包
  const { disconnect } = useDisconnect() // 断开连接
  
  const formatBalance = (balance: string | undefined, decimals = 4) => {
    const balanceStr = balance ?? '0'; // 如果 undefined 则使用 '0'
    return parseFloat(balanceStr).toFixed(decimals);
  };
  return (
    <div className='bg-gray-800 border-b border-b-blue-400 flex justify-between px-3 py-5'>
      <div>
        {
          links.map(link => {
            const isActive = pathName === link.path
            return (
              <Link key={link.path} className="text-2xl text-white px-3" href={link.path}>{ link.name }</Link>
            )
          })
        }
      </div>
      {/* 已连接 */}
      {
        isConnected && (
          <div>
            <span className='px-2.5 py-1.5 bg-green-200 text-gray-600 rounded mr-3'>
              { formatBalance(ethBalance?.formatted) }{ethBalance?.symbol}
              <span className='px-1'>|</span>
              { address?.slice(0,4)}...{address?.slice(-4) }
            </span>
            <button
              type="button"
              onClick={() => disconnect()}
              className="px-2.5 py-1.5 bg-blue-500 text-white rounded"
            >
              Disconnect
            </button>
          </div>
        )
      }
      {/* 未链接 */}
      {
        !isConnected && (
          <button
            className='px-2.5 py-1.5 bg-blue-500 text-white rounded'
            onClick={() => setModalOpen(true)}
          >
              Connect Wallet
          </button>
        )
      }
      {/* 选择钱包弹框 */}
      <Modal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="普通弹框"
      >
        <div>
          {connectors.map((connector) => {
            const name = connector.name
            const showWallet = ['MetaMask','OKX Wallet','Coinbase Wallet']
            if (showWallet.includes(name)) {
              return (
                <button
                  className="px-2.5 py-1.5 border rounded"
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  type="button"
                >
                  <span>
                    <img className="w-3.5" src={connector.icon} alt="" />
                  </span>
                  {connector.name}
                </button>
              )
            }
          })}
        </div>
        <div className="modal-footer">
          <button className="btn secondary" onClick={() => setModalOpen(false)}>取消</button>
          <button className="btn primary" onClick={() => setModalOpen(false)}>确定</button>
        </div>
      </Modal>
    </div>
  )
}

export default Header
 

  
