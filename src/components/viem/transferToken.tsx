'use client'
import { tokenAbi } from '@/assets/abis/tokenAbi';
import React, { useState } from 'react'
import { Address, createPublicClient, Hash, TransactionReceipt, http, createWalletClient, custom, parseUnits } from 'viem'
import { sepolia } from 'viem/chains';

// 定义交易记录接口
interface TransactionRecord {
  hash: Hash,
  timestamp: Number,
  from: Address,
  to: Address,
  amount: string,
  tokenSymbol: string,
  status: 'pending' | 'success' | 'failed',
  receipt?: TransactionReceipt
}

// 定义代币信息接口
interface TokenInfoProps {
  symbol: string;
  decimals: number;
  name: string
}

// 定义组件props
interface TransferTokenProps {
  rpcUrl?: string;
  defaultTokenAddress?: Address
}

// 定义React function 组件 转账组件
const TransferTokenCompoent: React.FC<TransferTokenProps> = ({
  rpcUrl = 'https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8',
  defaultTokenAddress = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44' 
}) => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoProps | null>(null)
  const [recipientAddress, setRecipientAddress] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState('')
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [transferStatus, setTransferStatus] = useState<string>('')
  const [customTokenAddress, setCustomTokenAddress] = useState<string>(defaultTokenAddress)

  // 初始化公共客户端
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // 交易记录
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)

  // 添加交易记录
  const addTransaction = (transaction: TransactionRecord) => {
    const updateTransactions = [transaction, ...transactions]
    setTransactions(updateTransactions)
  }


  // 转账ERC20代币
  const handleTransfer = async () => {
    if (!transferAmount || !recipientAddress || !customTokenAddress) {
      alert('请填写必要信息')
      return
    }

    setIsTransferring(true)
    setTransferStatus('...准备转账')

    try {
      // 创建钱包客户端
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
      })

      // 解析转账金额
      const amountWei = parseUnits(transferAmount, 18)

      setTransferStatus('发送交易请求...')
      // 发送转账交易
      const hash = await walletClient.writeContract({
        address: customTokenAddress as Address,
        abi: tokenAbi,
        functionName: 'transfer',
        args: [recipientAddress as Address, amountWei],
        account: '0x3f2fd8fde0f51c1e1d5987a3e9603aa6977a5911'
      })
      
      setTransferStatus(`交易已发送，等待确认... 哈希: ${hash.substring(0, 10)}...`);

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash as Hash,
        timeout: 120000 // 2分钟超时
      })

      if (receipt.status == 'success') {
        const pendingTransaction: TransactionRecord = {
          hash: hash,
          timestamp: Date.now(),
          from: '0x3f2fd8fde0f51c1e1d5987a3e9603aa6977a5911' as Address,
          to: recipientAddress as Address,
          amount: transferAmount,
          tokenSymbol: 'ERC20',
          status: 'pending',
        }
        // 设置交易记录 函数式更新
        setTransactions(prev => [...prev, pendingTransaction]);
        setTransferStatus('✅ 转账成功！');
        setTransferAmount('')
        
      }
    } catch (error) {
      console.error('转账失败:', error);
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <div>
      {/* 代币转账 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>转账 ERC20 代币</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
            接收地址:
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="输入接收地址"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
            转账数量:
          </label>
          <input
            type="text"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder='输入转账数量'
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={isTransferring}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isTransferring ? '#ccc' : '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isTransferring ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {isTransferring ? '转账中...' : '确认转账'}
        </button>

        {transferStatus && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: transferStatus.includes('成功') ? '#E8F5E9' : 
                          transferStatus.includes('失败') ? '#FFEBEE' : '#E3F2FD',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#333'
          }}>
            {transferStatus}
          </div>
        )}
      </div>
      {/* 转账记录 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {transactions.map((transfer,index) => (
          <div className="mb-2" key={index}>
            <div className="bg-gray-200 py-1.5 px-1.5 rounded">
              <span>form: {transfer.from}</span>
              <span className="px-4">to: {transfer.to}</span>
              <span>value: {transfer.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransferTokenCompoent
