'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@/wallet-sdk/privader';
import { useBalance } from 'wagmi';
import WalletStorage from '@/utils/storage';
import okxWallet from '../connectors/okxWallet';
import metaMaskWallet from '../connectors/metaMask';
import { ethers } from 'ethers';


interface ConnectButtonProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showBalance?: boolean;
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onChainChange?: (chainId: number) => void;
  onBalanceChange?: (balance: string) => void;
}

export const ConnectButton = ({
  label = 'Connect Wallet',
  size = 'sm',
  showBalance = false,
  className = '',
  onConnect
}: ConnectButtonProps) => {

  // size样式
  const sizeClass = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2'
  }
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [balance,setBalance] = useState('')
  const { isConnected, disconnect, openModal, openChainModal, address, provider, chainId, chains } = useWallet()
  
  // 根据当前chainID,获取chain信息
  const chainInfo = chains.find(item => item.id == Number(chainId))
  
  const fetchBalance = useCallback(async () => {
    const balanceWei = await provider.getBalance(address)
    const balanceEth = ethers.formatEther(balanceWei)
    console.log('balanceEth===',balanceEth);
    setBalance(balanceEth)
  },[provider])

  useEffect(() => {
    if (address && provider) {
      fetchBalance()
    }
  }, [fetchBalance, provider])
  // 格式化余额
  const formatBalance = (balance: string | undefined, decimals = 4) => {
    const balanceStr = balance ?? '0'; // 如果 undefined 则使用 '0'
    return parseFloat(balanceStr).toFixed(decimals);
  };

  // 未连接钱包
  if (!isConnected) {
    return (
      <button
        className={`bg-blue-500 text-white font-blod rounded ${sizeClass[size]}`}
        onClick={openModal}
      >
        { label }
      </button>
    )
  }

  return (
    <div>
      {/* 切换网络 */}
      <span
        onClick={openChainModal}
        className='px-2.5 py-1.5 bg-green-200 text-gray-600 rounded mr-3 cursor-pointer'
      >
        {chainInfo?.name} 
        <span className='px-1'>|</span>
        {chainInfo?.id}
        <span className='pl-1'>🔽</span>
      </span>
      {/* 显示余额和地址 */}
      <span className='px-2.5 py-1.5 bg-green-200 text-gray-600 rounded mr-3'>
        { formatBalance(balance) }
        <span className='px-1'>|</span>
        { address?.slice(0,4)}...{address?.slice(-4) }
      </span>
      <button
        className={`bg-blue-500 text-white font-blod rounded ${sizeClass[size]}`}
        onClick={disconnect}
      >
        disconnect
      </button>
    </div>
    
  )
}
