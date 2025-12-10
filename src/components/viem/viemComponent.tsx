'use client'
import React, { useState, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits, type Address, type Hash, type TransactionReceipt } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// 定义交易记录类型
interface TransactionRecord {
  hash: Hash;
  timestamp: number;
  from: Address;
  to: Address;
  amount: string;
  tokenSymbol: string;
  status: 'pending' | 'success' | 'failed';
  receipt?: TransactionReceipt;
}

// ERC20 ABI (简化版本，包含最常用的方法)
const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

// 定义组件 Props
interface WalletComponentProps {
  rpcUrl?: string;
  defaultTokenAddress?: Address;
}

const WalletComponent1: React.FC<WalletComponentProps> = ({
  rpcUrl = 'https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8',
  defaultTokenAddress = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44', // USDT
}) => {
  // 状态管理
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; decimals: number; name: string } | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [customTokenAddress, setCustomTokenAddress] = useState<string>(defaultTokenAddress);
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('mainnet');
  
  // 新增：交易记录状态
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // 初始化公共客户端
  const publicClient = createPublicClient({
    chain: network === 'mainnet' ? mainnet : sepolia,
    transport: http(rpcUrl),
  });

  // 从 localStorage 加载交易记录
  const loadTransactionsFromStorage = () => {
    try {
      const saved = localStorage.getItem(`wallet_transactions_${account}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 确保时间戳是数字
        const transactionsWithNumberTimestamp = parsed.map((tx: any) => ({
          ...tx,
          timestamp: Number(tx.timestamp)
        }));
        setTransactions(transactionsWithNumberTimestamp);
      }
    } catch (error) {
      console.error('加载交易记录失败:', error);
    }
  };

  // 保存交易记录到 localStorage
  const saveTransactionsToStorage = (txs: TransactionRecord[]) => {
    if (!account) return;
    try {
      localStorage.setItem(`wallet_transactions_${account}`, JSON.stringify(txs));
    } catch (error) {
      console.error('保存交易记录失败:', error);
    }
  };

  // 添加交易记录
  const addTransaction = (transaction: TransactionRecord) => {
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    saveTransactionsToStorage(updatedTransactions);
  };

  // 更新交易记录状态
  const updateTransactionStatus = (hash: Hash, status: 'pending' | 'success' | 'failed', receipt?: TransactionReceipt) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.hash === hash ? { ...tx, status, receipt } : tx
      );
      saveTransactionsToStorage(updated);
      return updated;
    });
  };

  // 连接钱包
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('请安装 MetaMask 或其他以太坊钱包扩展');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const walletAddress = accounts[0] as Address;
      setAccount(walletAddress);

      // 获取链 ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const chainIdValue = BigInt(chainIdHex);
      setChainId(chainIdValue);

      // 加载该账户的交易记录
      loadTransactionsFromStorage();

      console.log('钱包已连接:', walletAddress, '链 ID:', chainIdValue);
    } catch (error) {
      console.error('连接钱包失败:', error);
      alert('连接钱包失败，请检查控制台');
    }
  };

  // 获取 ETH 余额
  const fetchEthBalance = async () => {
    if (!account) return;

    try {
      const balance = await publicClient.getBalance({
        address: account,
      });
      setEthBalance(formatUnits(balance, 18)); // ETH 有 18 位小数
    } catch (error) {
      console.error('获取 ETH 余额失败:', error);
    }
  };

  // 获取代币信息
  const fetchTokenInfo = async (tokenAddress: Address) => {
    try {
      const [symbol, decimals, name] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'name',
        }) as Promise<string>,
      ]);

      setTokenInfo({ symbol, decimals, name });
      console.log('代币信息:', { symbol, decimals, name });
    } catch (error) {
      console.error('获取代币信息失败:', error);
      setTokenInfo(null);
    }
  };

  // 获取 ERC20 代币余额
  const fetchTokenBalance = async () => {
    if (!account || !customTokenAddress) return;

    try {
      const tokenAddress = customTokenAddress as Address;
      
      // 先获取代币信息
      await fetchTokenInfo(tokenAddress);

      // 获取余额
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
      }) as bigint;

      if (tokenInfo) {
        setTokenBalance(formatUnits(balance, tokenInfo.decimals));
      } else {
        // 如果无法获取小数位数，使用默认值 18
        setTokenBalance(formatUnits(balance, 18));
      }
    } catch (error) {
      console.error('获取代币余额失败:', error);
      setTokenBalance('0');
    }
  };

  // 获取交易详情
  const fetchTransactionDetails = async (hash: Hash) => {
    try {
      const [transaction, receipt] = await Promise.all([
        publicClient.getTransaction({ hash }),
        publicClient.getTransactionReceipt({ hash }),
      ]);

      return { transaction, receipt };
    } catch (error) {
      console.error('获取交易详情失败:', error);
      return null;
    }
  };

  // 加载交易历史
  const loadTransactionHistory = async () => {
    if (!account) return;
    
    setIsLoadingHistory(true);
    try {
      // 这里可以添加从区块链获取历史交易的逻辑
      // 例如通过查询 Transfer 事件日志
      console.log('加载交易历史...');
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里可以实际实现从区块链获取交易历史
      // 当前我们先显示本地存储的交易记录
      
    } catch (error) {
      console.error('加载交易历史失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 转账 ERC20 代币
  const transferTokens = async () => {
    if (!account || !recipientAddress || !transferAmount || !customTokenAddress || !tokenInfo) {
      alert('请填写所有必要信息');
      return;
    }

    if (!window.ethereum) {
      alert('请安装钱包扩展');
      return;
    }

    setIsTransferring(true);
    setTransferStatus('准备转账...');

    try {
      // 创建钱包客户端
      const walletClient = createWalletClient({
        chain: network === 'mainnet' ? mainnet : sepolia,
        transport: custom(window.ethereum),
      });

      // 解析转账金额
      const amountInWei = parseUnits(transferAmount, tokenInfo.decimals);

      // 先添加一个 pending 状态的交易记录
      const transactionHash = `pending_${Date.now()}` as Hash;
      const pendingTransaction: TransactionRecord = {
        hash: transactionHash,
        timestamp: Date.now(),
        from: account,
        to: recipientAddress as Address,
        amount: transferAmount,
        tokenSymbol: tokenInfo.symbol,
        status: 'pending',
      };
      
      addTransaction(pendingTransaction);

      setTransferStatus('发送交易请求...');

      // 发送转账交易
      const hash = await walletClient.writeContract({
        address: customTokenAddress as Address,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipientAddress as Address, amountInWei],
        account,
      });

      // 更新交易记录为真实 hash
      const updatedTransaction: TransactionRecord = {
        ...pendingTransaction,
        hash,
      };
      
      updateTransactionStatus(transactionHash, 'pending');
      
      // 移除旧的 pending 记录，添加新的记录
      setTransactions(prev => {
        const filtered = prev.filter(tx => tx.hash !== transactionHash);
        const updated = [updatedTransaction, ...filtered];
        saveTransactionsToStorage(updated);
        return updated;
      });

      setTransferStatus(`交易已发送，等待确认... 哈希: ${hash.substring(0, 10)}...`);

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash as Hash,
        timeout: 120000, // 2分钟超时
      });

      if (receipt.status === 'success') {
        setTransferStatus('✅ 转账成功！');
        updateTransactionStatus(hash, 'success', receipt);
        
        // 更新余额
        await Promise.all([fetchEthBalance(), fetchTokenBalance()]);
        
        // 清空表单
        setRecipientAddress('');
        setTransferAmount('');
      } else {
        setTransferStatus('❌ 转账失败');
        updateTransactionStatus(hash, 'failed', receipt);
      }
    } catch (error: any) {
      console.error('转账失败:', error);
      setTransferStatus(`❌ 转账失败: ${error.message || '未知错误'}`);
      
      // 更新 pending 交易为失败状态
      if (error.message?.includes('user rejected')) {
        // 如果用户拒绝了交易，移除 pending 记录
        setTransactions(prev => {
          const filtered = prev.filter(tx => !tx.hash.startsWith('pending_'));
          saveTransactionsToStorage(filtered);
          return filtered;
        });
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setEthBalance('0');
          setTokenBalance('0');
          setTransactions([]);
        } else {
          const newAccount = accounts[0] as Address;
          setAccount(newAccount);
          // 加载新账户的交易记录
          loadTransactionsFromStorage();
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(BigInt(chainIdHex));
        // 切换网络时清空交易记录（不同网络的交易不通用）
        setTransactions([]);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 当账户或代币地址变化时，更新余额
  useEffect(() => {
    if (account) {
      fetchEthBalance();
      if (customTokenAddress) {
        fetchTokenBalance();
      }
    }
  }, [account, customTokenAddress, network]);

  // 切换网络
  const switchNetwork = async (newNetwork: 'mainnet' | 'sepolia') => {
    if (!window.ethereum) return;

    try {
      if (newNetwork === 'sepolia') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia 链 ID
        });
      } else {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Mainnet 链 ID
        });
      }
      setNetwork(newNetwork);
      // 切换网络时清空交易记录
      setTransactions([]);
    } catch (error: any) {
      if (error.code === 4902) {
        // 如果链不存在，尝试添加它
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
              },
            ],
          });
          setNetwork(newNetwork);
          setTransactions([]);
        } catch (addError) {
          console.error('添加网络失败:', addError);
        }
      } else {
        console.error('切换网络失败:', error);
      }
    }
  };

  // 清空交易记录
  const clearTransactionHistory = () => {
    if (window.confirm('确定要清空所有交易记录吗？此操作不可撤销。')) {
      setTransactions([]);
      if (account) {
        localStorage.removeItem(`wallet_transactions_${account}`);
      }
    }
  };

  // 复制交易哈希到剪贴板
  const copyTransactionHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      alert('交易哈希已复制到剪贴板');
    });
  };

  // 打开区块链浏览器查看交易详情
  const viewOnExplorer = (hash: Hash) => {
    const explorerUrl = network === 'mainnet' 
      ? `https://etherscan.io/tx/${hash}`
      : `https://sepolia.etherscan.io/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'pending': return '处理中';
      default: return '未知';
    }
  };

  return (
    <div className="wallet-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        Viem 钱包组件
      </h2>

      {/* 网络选择 */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={() => switchNetwork('mainnet')}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            backgroundColor: network === 'mainnet' ? '#4CAF50' : '#e0e0e0',
            color: network === 'mainnet' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          主网
        </button>
        <button
          onClick={() => switchNetwork('sepolia')}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            backgroundColor: network === 'sepolia' ? '#4CAF50' : '#e0e0e0',
            color: network === 'sepolia' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Sepolia 测试网
        </button>
      </div>

      {/* 钱包连接状态 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>钱包状态</h3>
            <p style={{ margin: '5px 0', color: '#666' }}>
              {account ? `已连接: ${account.substring(0, 6)}...${account.substring(38)}` : '未连接'}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              网络: {network === 'mainnet' ? '以太坊主网' : 'Sepolia 测试网'} {chainId ? `(链ID: ${chainId.toString()})` : ''}
            </p>
          </div>
          <button
            onClick={connectWallet}
            style={{
              padding: '10px 20px',
              backgroundColor: account ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {account ? '已连接' : '连接钱包'}
          </button>
        </div>
      </div>

      {/* 余额显示 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>余额信息</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>ETH 余额:</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2196F3' }}>
              {ethBalance} ETH
            </span>
          </div>
          <button
            onClick={fetchEthBalance}
            style={{
              marginTop: '5px',
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            刷新 ETH 余额
          </button>
        </div>

        <div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
              代币合约地址:
            </label>
            <input
              type="text"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              placeholder="输入 ERC20 合约地址"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
          </div>

          {tokenInfo && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '5px 0', color: '#666' }}>
                代币: {tokenInfo.name} ({tokenInfo.symbol})
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>代币余额:</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#FF9800' }}>
              {tokenBalance} {tokenInfo?.symbol || 'TOKEN'}
            </span>
          </div>
          <button
            onClick={fetchTokenBalance}
            style={{
              marginTop: '5px',
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            刷新代币余额
          </button>
        </div>
      </div>

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
            placeholder={`输入转账数量 (${tokenInfo?.symbol || '代币'})`}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={transferTokens}
          disabled={isTransferring || !account || !tokenInfo}
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

      {/* 交易记录 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: '0', color: '#555' }}>交易记录</h3>
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px 15px',
                marginRight: '10px',
                backgroundColor: showHistory ? '#2196F3' : '#f0f0f0',
                color: showHistory ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showHistory ? '隐藏记录' : '显示记录'} ({transactions.length})
            </button>
            {transactions.length > 0 && (
              <button
                onClick={clearTransactionHistory}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                清空记录
              </button>
            )}
          </div>
        </div>

        {showHistory && (
          <>
            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                加载交易记录中...
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无交易记录
                <p style={{ marginTop: '10px', fontSize: '14px' }}>
                  转账成功后，交易记录将显示在这里
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>时间</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>类型</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>金额</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>状态</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr 
                        key={tx.hash} 
                        style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '10px', fontSize: '13px' }}>
                          {formatTime(tx.timestamp)}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>
                          <div>转账</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {tx.from.substring(0, 6)}... → {tx.to.substring(0, 6)}...
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                          {tx.amount} {tx.tokenSymbol}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getStatusColor(tx.status),
                            color: 'white'
                          }}>
                            {getStatusText(tx.status)}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => copyTransactionHash(tx.hash)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#f0f0f0',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              复制哈希
                            </button>
                            {!tx.hash.startsWith('pending_') && (
                              <button
                                onClick={() => viewOnExplorer(tx.hash)}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: '#2196F3',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                查看详情
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {transactions.length > 0 && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
                <p style={{ margin: '0' }}>
                  提示: 交易记录保存在浏览器本地存储中，仅当前设备可见
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 使用说明 */}
      <div style={{
        backgroundColor: '#E8F5E9',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#2E7D32'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>使用说明:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>确保已安装 MetaMask 或其他兼容的以太坊钱包</li>
          <li>首次使用需要连接钱包并授权</li>
          <li>代币余额查询需要正确的 ERC20 合约地址</li>
          <li>转账前请确认网络和余额充足</li>
          <li>测试建议使用 Sepolia 测试网，避免真实资产损失</li>
          <li>交易记录保存在浏览器本地，切换设备或清空缓存会丢失</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletComponent1;