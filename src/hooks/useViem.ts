import { createWalletClient, createPublicClient, http } from "viem"; 
import { sepolia } from "viem/chains";
import { tokenAbi } from "@/assets/abis/tokenAbi";
import { parseEther, formatEther } from "viem";

// 钱包地址
const ACCOUNT_ADDRESS = '0x3f2fd8fde0f51c1e1d5987a3e9603aa6977a5911' as `0x${string}`
// 合约地址
const TOKEN_ADDRESS = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' as `0x${string}`

export function useViem() {
  // createWalletClient 用户钱包交互

  // createPublicClient 读取区块链数据
  // 创建公共客户端
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8')
  })

  // 读取账户余额
  const balance = publicClient.getBalance({
    address: ACCOUNT_ADDRESS
  })

  // 读取合约代币余额
  const tokenBalance = publicClient.readContract({
    abi: tokenAbi,
    address: TOKEN_ADDRESS,
    args: [!ACCOUNT_ADDRESS],
    functionName: 'balanceOf'
  })

  return {
    balance,
    tokenBalance
  }
}
