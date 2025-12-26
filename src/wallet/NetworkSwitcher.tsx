'use client'
import React, { useState } from 'react';
import { useWallet, SUPPORTED_NETWORKS } from './walletContext';

interface NetworkSwitcherProps {
  onClose: () => void;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ onClose }) => {
  const { chainId, switchNetwork } = useWallet();
  const [switching, setSwitching] = useState<number | null>(null);

  const handleSwitchNetwork = async (networkId: number) => {
    setSwitching(networkId);
    try {
      await switchNetwork(networkId);
      onClose();
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      alert(`切换网络失败: ${error.message || '未知错误'}`);
    } finally {
      setSwitching(null);
    }
  };

  const getNetworkColor = (networkId: number): string => {
    switch (networkId) {
      case 1: return '#3cba54';
      case 5: return '#3099f2';
      case 11155111: return '#f2a130';
      case 137: return '#8247e5';
      case 42161: return '#28a0f0';
      case 10: return '#ff0420';
      default: return '#666';
    }
  };

  const isCurrentNetwork = (networkId: number) => {
    const currentChainId = chainId ? Number(chainId) : null;
    return currentChainId === networkId;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={onClose}
      />
      
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 1001,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>选择网络</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {SUPPORTED_NETWORKS.map((network) => (
            <button
              key={network.chainId}
              onClick={() => handleSwitchNetwork(network.chainId)}
              disabled={switching === network.chainId || isCurrentNetwork(network.chainId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                border: `1px solid ${isCurrentNetwork(network.chainId) ? getNetworkColor(network.chainId) : '#e0e0e0'}`,
                borderRadius: '10px',
                backgroundColor: isCurrentNetwork(network.chainId) 
                  ? getNetworkColor(network.chainId) + '10' 
                  : 'white',
                cursor: isCurrentNetwork(network.chainId) ? 'default' : 'pointer',
                transition: 'all 0.2s',
                opacity: switching === network.chainId ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getNetworkColor(network.chainId),
                }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{network.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {network.currency} ({network.symbol})
                    {network.isTestnet && (
                      <span style={{ 
                        backgroundColor: '#ffeb3b',
                        color: '#333',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        marginLeft: '4px',
                        fontSize: '10px',
                      }}>
                        测试网
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                {isCurrentNetwork(network.chainId) ? (
                  <span style={{ color: getNetworkColor(network.chainId) }}>✓ 已连接</span>
                ) : switching === network.chainId ? (
                  <span style={{ color: '#666' }}>切换中...</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f9f9ff', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            <strong>提示：</strong>切换网络时，钱包可能会弹出确认窗口。请确保你在钱包中确认网络切换。
          </p>
        </div>
      </div>
    </div>
  );
};