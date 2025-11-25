'use client'

import { useAccount, useConnect, useDisconnect } from "wagmi"

export default function ConnectWallet() {
  const { address, isConnected, chainId, status: accountStatus  } = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  console.log(connectors);
  
  // 判断是否接入钱包
  // if (!isConnected) {
  //   return (
  //     <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
  //       <p>🔌 请先连接钱包</p>
  //     </div>
  //   )
  // }

  return (
    <div className="p-6 border rounded-lg bg-white">
      {/* 链接钱包 */}
      <div>
        {connectors.map((connector) => {
          const name = connector.name
          const showWallet = ['MetaMask','OKX Wallet','Coinbase Wallet']
          if (showWallet.includes(name)) {
            return (
              <button
                className="px-2.5 py-1.5 border rounded"
                key={connector.uid}
                onClick={() => connect({ connector })}
                type="button"
              >
                <span>
                  <img className="w-3.5" src={connector.icon} alt="" />
                </span>
                {connector.name}
              </button>
            )
          }
        })}
      </div>
      <div>
        {accountStatus === 'connected' && (
          <button
            type="button"
            onClick={() => disconnect()}
            className="px-2.5 py-1.5 bg-blue-500 text-white rounded"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  )
}