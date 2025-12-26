'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from '../wallet-sdk/components/ConnectButton'

const Header = () => {
  const links = [
    { name: 'wagmi', path: '/wagmi' },
    { name: 'ethers', path: '/ethers' },
    { name: 'viem', path: '/viem' },
    { name: 'stake', path: '/stake' },
  ]
  
  return (
    <div className='bg-gray-800 border-b border-b-blue-400 flex justify-between px-3 py-5'>
      <div>
        {
          links.map(link => {
            return (
              <Link key={link.path} className="text-2xl text-white px-3" href={link.path}>{ link.name }</Link>
            )
          })
        }
      </div>
      <ConnectButton />
    </div>
  )
}

export default Header
 

  
