import { ethers } from "ethers"
import { Wallet } from "../type"
import WalletStorage from "@/utils/storage"


const connectOkx = async (): Promise<any>  => {
  // 判断是否安装了metaMask
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

    if (!accounts || accounts.length == 0) {
      throw new Error('No Accounts Found')
    }

    // 获取provider,根据provider获取信息
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const netWork = await provider.getNetwork()
    let chainId = Number(netWork.chainId)

    // 返回一个标志，申明是否需要切换网络
    const savedWalletChainId = WalletStorage.getChainId()
    const shouldSwitchNetwork = savedWalletChainId && savedWalletChainId !== -1 && savedWalletChainId !== chainId

    // 监听连接账户的变化
    window.ethereum.on('accountsChanged',(newAccounts: string[]) => {
      if (newAccounts.length === 0) {
        window.dispatchEvent(new CustomEvent('wallet_disconnected'))
      } else {
        window.dispatchEvent(new CustomEvent('wallet_accounts_changed', {
          detail: { accounts: newAccounts }
        }))
      }
    })

    // 监听区块链网络变化
    window.ethereum.on('chainChanged',(newChainIdHex: string) => {
      const newChainId = parseInt (newChainIdHex)
      window.dispatchEvent(new CustomEvent('wallet_chain_changed', {
        detail: { chainId: newChainId }
      }))
    })
    console.log('connectOXKwallet:::', provider, signer, chainId, accounts, address);
    return { accounts, signer, address, chainId, provider, shouldSwitchNetwork }
  } catch (error) {
    throw error
  }
}

export const okxWallet: Wallet = {
  id: 'okx',
  name: 'OKX Wallet',
  icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAARVBMVEWa7Syb7yyM2CiN2SiS4SqQ3imc8C18vyQAAAALEgOg9y4aKAd9wSSBxiUhMwme9C2U5CqEyyYJDgIXIwY3VBAdLQiX6SvoP/SuAAAAjElEQVR4AdXRRQJEIQgAUPhpt97/qCNsprvfxg4A/gmS3T7CHhzGcRwmIDiPZG/HsgoiFQ8Em/F4gz6/wTy74foTVhCnlmXxSrAJdi2eBMGUJwhHcBTs1Nr+BnjHhkWRIJhi++sxaa1zCWMXqu5SOFGsrLDzT9Ti+WKlsxuwWRKRN1gGe3AhCGxh8Ec2hUsK/53DAekAAAAASUVORK5CYII=',
  connetc: connectOkx,
  description: 'OKX交易所官方钱包，支持多链和跨链交易',
  installed: true,
  downloadLink: 'https://www.okx.com/download',
}


export default okxWallet