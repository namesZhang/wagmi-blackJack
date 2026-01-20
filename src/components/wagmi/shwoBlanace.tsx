'use client'

import { useReadContract, useBalance } from 'wagmi'
import { tokenAbi } from '../../assets/abis/tokenAbi'
import { useWallet } from '@/wallet-sdk/privader'
import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { eventBus } from '@/utils/eventBus'
import { useStaking } from '@/hooks/useStaking'

interface TransferEthersProps {
  tokenAddress: string
}

// 显示ERC20合约余额组件
export default function ShowTokenBalanceOf({ tokenAddress }: TransferEthersProps) {
  const { address, isConnected, chainId, provider } = useWallet()
  const walletAddress = address as `0x${string}`
  const [ethBalance,setEthBalance] = useState('')
  const [erc20Balance,setErc20Balance] = useState('')
  // 读取账户余额
  // const { data: nativeBalance } = useBalance({
  //   address: walletAddress,
  //   chainId: chainId as any,
  //   query: {
  //     enabled: !!address
  //   }
  // })

  // 读取ERC20合约代币余额 ? (Number(balance) / 10 ** 18).toLocaleString() : '0'
  // const { data: balance } = useReadContract({
  //   abi: tokenAbi,
  //   address: tokenAddress as `0x${string}`,
  //   functionName: 'balanceOf',
  //   args: [address!],
  //   query: { enabled: !!address }
  // })

  // 获取Sepolia ETH余额
  const fetchEthBalance = useCallback(async () => {
    if (!address || !provider) return

    try {
      const balanceWei = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
      const balanceEth = ethers.formatEther(balanceWei)
      console.log('balanceEth===',balanceEth);
      setEthBalance(balanceEth)

      // 注册余额更新事件
      eventBus.emit('balance:update', {
        address,
        balance: balanceEth,
        chainId: Number(chainId)
      })
    } catch (error) {
      console.error('获取原生代币余额失败:', error);
      setEthBalance('')
    }
  }, [provider])

  // 获取ERC20token代币余额
  const encodeBalanceOf = (address: string) => {
    // balanceOf(address) 的函数选择器
    const functionSelector = '0x70a08231'
    
    // 移除地址的 0x 前缀并填充到 64 字符
    const paddedAddress = address.replace('0x', '').padStart(64, '0')
    
    return functionSelector + paddedAddress
  }

  const fetchTokenBalance = useCallback(async () => {
    if (!address || !provider || Number(chainId) === 1) return

    try {
      const erc20Balance = await provider.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: encodeBalanceOf(address)
        }, 'latest']
      })
      console.log('erc20Balance===',ethers.formatUnits(erc20Balance, 18));
      setErc20Balance(ethers.formatUnits(erc20Balance, 18))
      // 注册余额更新事件
      eventBus.emit('balance:update', {
        address,
        balance: erc20Balance,
        chainId: Number(chainId)
      })
    } catch (error) {
      console.error('获取token代币余额失败:', error);
      setErc20Balance('')
    }
  }, [provider, chainId])

  // 监听相关事件自动刷新余额
  useEffect(() => {
    // 1. 监听交易确认事件
    const handleTransactionConfirmed = () => {
      console.log('交易确认，刷新余额')
      setTimeout(() => {
        fetchEthBalance()
        fetchTokenBalance()
      }, 2000)
    }

    // 初始获取余额
    if (address && provider) {
      fetchEthBalance()
      fetchTokenBalance()
    }

    // 注册事件监听 监听交易完成
    eventBus.on('transaction:confirmed', handleTransactionConfirmed)
    // 注册事件监听 监听网络切换
    eventBus.on('wallet:chainChanged', (val) => {
      console.log('valChainId',val)
      fetchEthBalance()
      fetchTokenBalance()
    })

    // 清理监听器
    return () => {
      eventBus.off('transaction:confirmed', handleTransactionConfirmed)
      eventBus.off('wallet:chainChanged', (val) => {
      console.log('valChainId',val)
      fetchEthBalance()
      fetchTokenBalance()
    })
    }
  }, [tokenAddress, provider, chainId])

  // 判断是否接入钱包
  if (!isConnected) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
        <p>🔌 请先连接钱包</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded space-y-4 max-w-3xl mx-auto px-3 bg-gray-50 mb-2.5">
      <h2 className="text-xl font-bold">SepoliaETH余额</h2>
      {/* 基础信息 */}
      <div className="p-4 border bg-gray-50 rounded space-y-2">
        <p>💰 ETH 余额: {ethBalance} ETH</p>
        <p>📝 钱包地址: {address}</p>
        <p>🌐 当前网络: (ID: {Number(chainId)})</p>
      </div>
      {/* 代币信息显示 */}
      {Number(chainId) !== 1 && <div>
        <h2 className="text-xl font-bold">ERC20合约代币余额</h2>
        <div className="p-4 border bg-gray-50 rounded space-y-2">
          <p>✅ ERC20 余额: {erc20Balance} ERC20</p>
          <p>💰 钱包地址: {address}</p>
          <p>🌐 当前网络: (ID: {Number(chainId)})</p>
        </div>
      </div> }
    </div>
  )
}