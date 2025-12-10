import { createWalletClient, createPublicClient, http, parseEther, formatEther, Address, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { tokenAbi } from "@/assets/abis/tokenAbi";

// 导出钱包管理类
export class WalletManager {
  private walletClient: ReturnType<typeof createWalletClient>
  private publicClient: ReturnType<typeof createPublicClient>
  private account: ReturnType<typeof privateKeyToAccount>

  constructor(privateKey: string) {
    // 创建账户
    this.account = privateKeyToAccount(privateKey as `0x${string}`)
    // 创建公共客户端(查询用)
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http('https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8')
    })
    // 创建钱包客户端（交易用）
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http('https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8')
    })
  }

  // 获取钱包地址
  getAddress(): Address {
    return this.account.address
  }

  // 获取原生代币余额
  async getNativeBalance(): Promise<string> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address
      })
      return formatEther(balance)
    } catch (error) {
      console.error('获取原生代币余额失败:', error)
      throw error
    }
  }

  // 获取ERC20代币余额
  async getTokenBalance(tokenAddress: Address): Promise<string> {
    try {
      const tokenBalance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: [this.account.address]
      })
      return tokenBalance ? tokenBalance.toString() : '0000'
    } catch (error) {
      console.error('获取代币余额失败:', error)
      throw error
    }
  }
  
  // 发送ERC20代币
  async sendToken(tokenAddress: Address,to: Address, amount: string) {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'transfer',
        args: [to, amount],
        account: this.account,
      })

      const hash = await this.walletClient.writeContract(request)
      console.log(`代币转账交易已发送，哈希: ${hash}`)

      // 等待交易确认
      const receipt = await this.publicClient.waitForTransactionReceipt({hash})
      console.log(`代币转账确认，状态: ${receipt.status}`)

      return hash
    } catch (error) {
      console.error('发送代币失败:', error)
      throw error
    }
  }
}