'use client'
import React, { useEffect, useState } from 'react'
import { useWallet } from '@/wallet-sdk/privader';
import { useBalance } from 'wagmi';
import WalletStorage from '@/utils/storage';
import okxWallet from '../connectors/okxWallet';
import metaMaskWallet from '../connectors/metaMask';


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
  // 通过钱包组件hook获取数据
  const { isConnected, disconnect, openModal, openChainModal, address, chainId, chains, connect} = useWallet()
  const address1 = address as `0x${string}`
  // 根据钱包组件的hook数据，获取对应账户的余额
  const { data: nativeBalance, refetch: refetchBalance } = useBalance({
      address: address1,
      chainId: chainId as any,
      query: {
        enabled: !!address,
        staleTime: 0, // 禁用缓存
      }
    })
  // 根据当前chainID,获取chain信息
  const chainInfo = chains.find(item => item.id == chainId)
  console.log(chainInfo);
  
  // 格式化余额
  const formatBalance = (balance: string | undefined, decimals = 4) => {
    const balanceStr = balance ?? '0'; // 如果 undefined 则使用 '0'
    return parseFloat(balanceStr).toFixed(decimals);
  };

  // 监听网络切换
  useEffect(() => {
    const handleWalletChainChange = (event: CustomEvent<{ chainId: number }>) => {
      console.log('监听到自定义链变化事件:', event.detail.chainId);
      setLastUpdate(Date.now()); // 更新时间戳触发重新获取
      
      // 立即重新获取余额
      setTimeout(() => {
        refetchBalance();
      }, 500); // 延迟500ms确保网络已切换
    }

    window.addEventListener('wallet_chain_change', handleWalletChainChange as EventListener)

    return () => {
      window.removeEventListener('wallet_chain_changed', handleWalletChainChange as EventListener)
    }
  }, [refetchBalance])

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
        { formatBalance(nativeBalance?.formatted) }{nativeBalance?.symbol}
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
