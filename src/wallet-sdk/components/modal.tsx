import React, { useState, useEffect, ReactNode } from 'react';
import '@/style/modal.css'
import { Wallet } from '@/wallet-sdk/type';

type ModalType = 'default' | 'warning' | 'danger' | 'success' | 'info';

interface ModalProps {
  isOpen: boolean,
  onClose: () => void,
  wallets: Wallet[],
  title?: string,
  type?: ModalType,
  connecting: boolean,
  onSelectWallet: (wallet: Wallet) => void
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  wallets,
  title='钱包登录组件',
  connecting,
  onSelectWallet,
  type = 'default',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.keyCode === 27) onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        {/* 渲染钱包list */}
        <div className="modal-body">
          <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-1'>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className='flex items-center p-2 rounded-lg hover:bg-gray-200 cursor-pointer'
                onClick={() => onSelectWallet(wallet)}
              >
                <img src={wallet.icon} alt={wallet.name} className='w-6 h-6 mr-2' />
                <span className='text-sm'>{wallet.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal