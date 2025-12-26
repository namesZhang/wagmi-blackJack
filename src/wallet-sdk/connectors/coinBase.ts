import { ethers } from "ethers"
import { Wallet } from "../type"


// 判断coinbase是否被初始化
function isCoinbaseWalletInstalled() {
  return typeof window !== 'undefined' && typeof (window as any).coinbaseWalletExtension !== 'undefined'
}

const connectCoinbaseWallet = async () => {
  try {
    if (!isCoinbaseWalletInstalled) {
      throw new Error('coinbase wallet is not installed')
    }

    // 创建一个 CoinBase 的provider
    const provider = (window as any).coinbaseWalletExtension

    // 请求连接账户
    const accounts = await provider.send('eth_requestsAccount',[])

    // 获取用户的钱包地址
    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    // 获取区块链ID
    const { chainId } = await provider.getNetwork()

    // 注册监听账户变化
    provider.on('accountsChanged',(accounts: string[]) => {
      window.dispatchEvent(new CustomEvent('wallet_accounts_changed',{
        detail: { accounts }
      }))
    })

    // 注册监听区块链网络变化
    provider.on('chainChanged', (chainId: string) => {
      window.dispatchEvent(new CustomEvent('wallet_chain_changed', {
        detail: { chainId }
      }))
    })

    // 注册监听断开连接
    provider.on('disconnected',(error: any) => {
      window.dispatchEvent(new CustomEvent('wallet_disconnected', {
        detail: { error }
      }))
    })

    console.log('coinbasewalletInfo:::', provider, signer, chainId, accounts, address);
    

    return { provider, signer, chainId, accounts, address }

  } catch (error) {
    throw error
  }
}

export const coinBaseWallet: Wallet = {
  id: 'coinbase',
  name: 'Coinbase Wallet',
  icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMwMDUyRkYiLz4KPHBhdGggZD0iTTE5LjUgMTVWMTBIMjguNVYxNUgxOS41Wk0xOS41IDM4VjMzSDI4LjVWMzhIMTkuNVpNMzMgMTkuNVYyOEgzOFYxOS41SDMzWk0xMCAxOS41VjI4SDE1VjE5LjVIMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  connetc: connectCoinbaseWallet,
  description: 'Coinbase 官方钱包，与交易所无缝集成',
  installed: isCoinbaseWalletInstalled(),
  downloadLink: 'https://www.coinbase.com/wallet/downloads',
}

export default coinBaseWallet