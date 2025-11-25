import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { baseAccount, injected, walletConnect } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      injected(),
      baseAccount(),
      walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http('https://sepolia.infura.io/v3/f9d85d16d7fd4bb3b4f72b88bc2ad1e8'),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
