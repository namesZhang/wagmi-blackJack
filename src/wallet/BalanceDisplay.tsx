'use client'
import React, { useState } from 'react';
import { useWallet } from './walletContext';

export const BalanceDisplay: React.FC = () => {
  const { balance, chainId, address, isConnected, refreshBalance } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  if (!isConnected || !balance || !address) {
    return null;
  }

  const formatBalance = (balance: string, symbol: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return `0 ${symbol}`;
    if (num < 0.001) return `< 0.001 ${symbol}`;
    if (num < 1) return `${num.toFixed(4)} ${symbol}`;
    if (num < 1000) return `${num.toFixed(3)} ${symbol}`;
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K ${symbol}`;
    return `${(num / 1000000).toFixed(2)}M ${symbol}`;
  };

  const getNetworkColor = (chainId: bigint | null): string => {
    const id = chainId ? Number(chainId) : null;
    switch (id) {
      case 1: return '#3cba54';
      case 5: return '#3099f2';
      case 11155111: return '#f2a130';
      case 137: return '#8247e5';
      case 42161: return '#28a0f0';
      case 10: return '#ff0420';
      default: return '#666';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>钱包信息</h3>
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>链 ID: {chainId?.toString()}</span>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getNetworkColor(chainId),
            }} />
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: 'none',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
        >
          {refreshing ? (
            <>
              <span style={{ 
                display: 'inline-block',
                animation: 'spin 1s linear infinite',
              }}>↻</span>
              刷新中...
            </>
          ) : (
            '↻ 刷新余额'
          )}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div style={{
          backgroundColor: '#f9f9ff',
          padding: '12px',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>地址</div>
          <div style={{ 
            fontSize: '14px', 
            fontFamily: '"SF Mono", monospace',
            wordBreak: 'break-all',
            color: '#333',
          }}>
            {address}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(address)}
            style={{
              marginTop: '8px',
              background: 'none',
              border: '1px solid #667eea',
              color: '#667eea',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            复制地址
          </button>
        </div>

        <div style={{
          backgroundColor: '#fff8e1',
          padding: '12px',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '12px', color: '#ff9800', marginBottom: '4px' }}>主网代币余额</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff9800' }}>
            {formatBalance(balance.formatted, balance.symbol)}
          </div>
          <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '4px' }}>
            更新于: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#e8f5e9', 
        padding: '12px', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#2e7d32',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ marginRight: '6px' }}>💡</span>
          <strong>余额说明</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>余额每30秒自动刷新一次</li>
          <li>支持以太坊、Polygon、Arbitrum、Optimism等多链</li>
          <li>余额为原生代币（ETH、MATIC等）</li>
          <li>ERC20代币余额需要额外查询</li>
        </ul>
      </div>
    </div>
  );
};