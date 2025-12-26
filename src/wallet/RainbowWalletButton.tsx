'use client'
import React, { useState, useEffect } from 'react';
import { useWallet, SUPPORTED_WALLETS, ConnectorType, SUPPORTED_NETWORKS } from './walletContext';
import { NetworkSwitcher } from './NetworkSwitcher';

// 样式对象
const styles = {
  rainbowButton: (isConnected: boolean) => ({
    position: 'relative' as const,
    background: isConnected 
      ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' 
      : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontWeight: 600,
    fontSize: '16px',
    padding: isConnected ? '8px 16px' : '12px 24px',
    cursor: 'pointer',
    overflow: 'hidden' as const,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    minWidth: isConnected ? 'auto' : '160px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  }),

  dropdownMenu: {
    position: 'absolute' as const,
    top: 'calc(100% + 10px)',
    right: 0,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    minWidth: '320px',
    zIndex: 1000,
    overflow: 'hidden' as const,
  },

  menuItem: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    color: '#333',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },

  walletConnectorList: {
    padding: '12px',
  },

  walletConnectorButton: {
    width: '100%',
    padding: '12px 16px',
    margin: '4px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '&:hover': {
      background: '#f8f8f8',
      borderColor: '#667eea',
    },
  },

  walletIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
  },

  connectedInfo: {
    padding: '16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9ff',
  },

  balanceInfo: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
  },

  refreshButton: {
    background: 'none',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    marginLeft: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
};

const LoadingDots: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'white',
          animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);


const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getChainName = (chainId: bigint | number | null): string => {
  const id = chainId ? Number(chainId) : null;
  switch (id) {
    case 1: return 'Ethereum';
    case 5: return 'Goerli';
    case 11155111: return 'Sepolia';
    case 137: return 'Polygon';
    case 42161: return 'Arbitrum';
    case 10: return 'Optimism';
    default: return `Chain ${id}`;
  }
};

const getNetworkColor = (chainId: number | null): string => {
  switch (chainId) {
    case 1: return '#3cba54';
    case 5: return '#3099f2';
    case 11155111: return '#f2a130';
    case 137: return '#8247e5';
    case 42161: return '#28a0f0';
    case 10: return '#ff0420';
    default: return '#666';
  }
};

// 格式化余额显示
const formatBalance = (balance: string, symbol: string): string => {
  const num = parseFloat(balance);
  if (num === 0) return `0 ${symbol}`;
  if (num < 0.001) return `< 0.001 ${symbol}`;
  if (num < 1) return `${num.toFixed(4)} ${symbol}`;
  if (num < 1000) return `${num.toFixed(3)} ${symbol}`;
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K ${symbol}`;
  return `${(num / 1000000).toFixed(2)}M ${symbol}`;
};

// 复制地址到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
};

export const RainbowWalletButton: React.FC = () => {
  const { 
    address, 
    isConnected, 
    isLoading, 
    connectedWallet,
    connectWallet, 
    disconnectWallet, 
    chainId,
    balance,
    refreshBalance,
    getAvailableWallets,
  } = useWallet();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const availableWallets = getAvailableWallets();

  const handleConnect = async () => {
    if (!isConnected) {
      setShowConnectors(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  const handleCopyAddress = () => {
    if (address) {
      copyToClipboard(address);
      setShowDropdown(false);
    }
  };

  const handleViewOnExplorer = () => {
    if (address && chainId) {
      const network = SUPPORTED_NETWORKS.find(n => n.chainId === Number(chainId));
      if (network) {
        window.open(`${network.explorerUrl}/address/${address}`, '_blank');
      } else {
        window.open(`https://etherscan.io/address/${address}`, '_blank');
      }
      setShowDropdown(false);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    try {
      await refreshBalance();
      setTimeout(() => setRefreshingBalance(false), 500);
    } catch (error) {
      console.error('刷新余额失败:', error);
      setRefreshingBalance(false);
    }
  };

  const getWalletDisplayName = () => {
    if (!connectedWallet) return '未知钱包';
    return SUPPORTED_WALLETS[connectedWallet].name;
  };

  const renderBalanceInfo = () => (
    <div style={styles.balanceInfo}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>余额</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
            {formatBalance(balance?.formatted || '0', balance?.symbol || 'ETH')}
          </div>
        </div>
        <button
          onClick={handleRefreshBalance}
          disabled={refreshingBalance}
          style={{
            ...styles.refreshButton,
            opacity: refreshingBalance ? 0.5 : 1,
          }}
        >
          {refreshingBalance ? (
            <span style={{ 
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
            }}>↻</span>
          ) : (
            '↻ 刷新'
          )}
        </button>
      </div>
      
      {balance && parseFloat(balance.formatted) === 0 && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fff8e1',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#ff9800',
        }}>
          ⚠️ 当前余额为 0，请确保钱包中有足够的 {balance.symbol}
        </div>
      )}
    </div>
  );

  const renderConnectors = () => (
    <div style={{
      ...styles.dropdownMenu,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>选择钱包连接</h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          选择一个已检测到的钱包
        </p>
      </div>
      <div style={styles.walletConnectorList}>
        {availableWallets.map((wallet, index) => {
          const connectorType = Object.keys(SUPPORTED_WALLETS).find(
            key => SUPPORTED_WALLETS[key as ConnectorType].name === wallet.name
          ) as ConnectorType;
          
          return (
            <button
              key={index}
              style={styles.walletConnectorButton}
              onClick={() => {
                if (connectorType === 'walletConnect') {
                  alert('WalletConnect 功能待实现');
                } else {
                  connectWallet(connectorType);
                }
                setShowConnectors(false);
              }}
            >
              <div style={styles.walletIcon}>
                {wallet.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>{wallet.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{wallet.description}</div>
              </div>
            </button>
          );
        })}
        
        {availableWallets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>未检测到钱包</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              请安装 MetaMask、OKX Wallet 或 Coinbase Wallet
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderConnectedDropdown = () => (
    <div style={{
      ...styles.dropdownMenu,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={styles.connectedInfo}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getNetworkColor(chainId ? Number(chainId) : null),
              marginRight: '8px',
            }} />
            <span style={{ fontSize: '12px', color: '#666' }}>
              {getWalletDisplayName()}
            </span>
          </div>
          <div style={{
            fontSize: '11px',
            padding: '2px 6px',
            backgroundColor: getNetworkColor(chainId ? Number(chainId) : null) + '20',
            borderRadius: '4px',
            color: getNetworkColor(chainId ? Number(chainId) : null),
            fontWeight: 600,
          }}>
            {getChainName(chainId)}
          </div>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            wordBreak: 'break-all',
            fontFamily: '"SF Mono", monospace',
            marginBottom: '4px',
          }}>
            {address}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleCopyAddress}
              style={{
                background: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              复制
            </button>
            <button
              onClick={() => {
                if (address) {
                  copyToClipboard(address);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              完整地址
            </button>
          </div>
        </div>
        
        {balance && (
          <div style={{ 
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '12px',
          }}>
            <div style={{ color: '#666', marginBottom: '2px' }}>当前余额</div>
            <div style={{ fontWeight: 600, color: '#667eea' }}>
              {formatBalance(balance.formatted, balance.symbol)}
            </div>
          </div>
        )}
      </div>
      
      {balance && renderBalanceInfo()}
      
      <button style={styles.menuItem} onClick={handleViewOnExplorer}>
        <span style={{ marginRight: '8px' }}>🔍</span>
        区块浏览器查看
      </button>
      
      <button 
        style={styles.menuItem} 
        onClick={() => {
          setShowNetworkSwitcher(true);
          setShowDropdown(false);
        }}
      >
        <span style={{ marginRight: '8px' }}>🔄</span>
        切换网络
      </button>
      
      <div style={{ height: '1px', background: '#eee', margin: '8px 0' }} />
      
      <button 
        style={{ ...styles.menuItem, color: '#ff4444' }} 
        onClick={handleDisconnect}
      >
        <span style={{ marginRight: '8px' }}>🚪</span>
        断开连接
      </button>
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        style={styles.rainbowButton(isConnected)}
        onClick={handleConnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isConnected ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"SF Mono", monospace',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getNetworkColor(chainId ? Number(chainId) : null),
            }} />
            <span>{formatAddress(address!)}</span>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
              ({getChainName(chainId)})
            </span>
            {balance && (
              <span style={{
                fontSize: '12px',
                opacity: 0.7,
                marginLeft: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                {formatBalance(balance.formatted, balance.symbol)}
              </span>
            )}
          </div>
        ) : (
          '连接钱包'
        )}
      </button>

      {showConnectors && renderConnectors()}
      {showDropdown && isConnected && renderConnectedDropdown()}
      
      {showNetworkSwitcher && (
        <NetworkSwitcher onClose={() => setShowNetworkSwitcher(false)} />
      )}
      
      {(showDropdown || showConnectors || showNetworkSwitcher) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => {
            setShowDropdown(false);
            setShowConnectors(false);
            setShowNetworkSwitcher(false);
          }}
        />
      )}
    </div>
  );
};