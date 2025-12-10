'use client'
import React, { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { tokenAbi } from '@/assets/abis/tokenAbi';

// 定义组件 Props
interface WalletComponentProps {
  rpcUrl?: string;
  defaultTokenAddress?: Address;
}

const ShowBalanceComponent: React.FC<WalletComponentProps> = ({
  rpcUrl = 'https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8',
  defaultTokenAddress = '0xFaEE12073Da53f529b5F4485Ad587b2D1DD81b44',
}) => {
  // 状态管理
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; decimals: number; name: string } | null>(null);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>(defaultTokenAddress);
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('mainnet');

  // 初始化公共客户端
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // 连接钱包
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('请安装 MetaMask 或其他以太坊钱包扩展');
        return;
      }
      
      // 读取用户信息，返回用户钱包地址
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      // 设置钱包地址
      const walletAddress = accounts[0] as Address;
      setAccount(walletAddress);

      // 获取链 ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });
      // 设置链 ID
      const chainIdValue = BigInt(chainIdHex);
      setChainId(chainIdValue);

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
      // 通过publicClient读取用户ETH余额
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
          abi: tokenAbi,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress,
          abi: tokenAbi,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: tokenAddress,
          abi: tokenAbi,
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
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: [account],
      }) as bigint;
      
      // 设置余额
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

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setEthBalance('0');
          setTokenBalance('0');
        } else {
          setAccount(accounts[0] as Address);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(BigInt(chainIdHex));
        window.location.reload(); // 通常建议刷新页面
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
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

  return (
    <div>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        Viem 钱包组件
      </h2>
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
              网络: Sepolia 测试网 {chainId ? `(链ID: ${chainId.toString()})` : ''}
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
              {parseFloat(ethBalance).toFixed(4)} ETH
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
    </div>
  );
};

export default ShowBalanceComponent;