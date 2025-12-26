This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).

在next环境中完成，部署一个erc20合约到sepolia测试网
再用wagmi, ethers, viem 创建三个页面分别完成四个子任务 
1. 使用交互库连接sepolia测试网，查询一个你的地址的余额
2. 发送 ETH 到另一个地址 
3. 调用一个 ERC-20 合约的 balanceOf 方法
4. 实现ERC20的转账功能
5. 监听 ERC-20 合约的 Transfer 事件


# 链接钱包组件思路整理
1. 数据状态的管理使用 React原有的Context
2. 文件夹目录 wallet-sdk provider components connectors
3. 统一的ts类型管理 walletContextvalue 钱包上下文接口 walletState 钱包状态接口 chain 类型
4. 