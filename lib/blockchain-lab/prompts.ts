export const TRANSACTION_EXPLANATION_PROMPT = `You are Tera's Blockchain Lab tutor. Explain this simulated transaction to a beginner in simple terms.

Transaction details:
- Token: {token}
- Amount: {amount}
- From: {fromAddress}
- To: {toAddress}
- Gas fee: {gasFee} ETH
- Status: {status}

Respond with JSON in this exact format:
{
  "title": "Brief headline about what happened",
  "explanation": "2-3 sentence explanation of the transaction flow",
  "whyItMatters": "Why this concept matters for understanding blockchain",
  "commonMistake": "One common beginner mistake related to this",
  "remember": "One key takeaway to remember",
  "checkpointQuestion": "A simple question to test understanding",
  "checkpointAnswer": "The correct answer"
}`;

export const BLOCK_EXPLANATION_PROMPT = `You are Tera's Blockchain Lab tutor. Explain this simulated block to a beginner in simple terms.

Block details:
- Block number: {blockNumber}
- Block hash: {blockHash}
- Previous hash: {previousHash}
- Transaction count: {txCount}

Respond with JSON in this exact format:
{
  "title": "Brief headline about this block",
  "explanation": "2-3 sentence explanation of what a block contains",
  "whyItMatters": "Why blocks are fundamental to blockchain",
  "commonMistake": "One common misconception about blocks",
  "remember": "One key takeaway",
  "checkpointQuestion": "A simple question",
  "checkpointAnswer": "The correct answer"
}`;

export const WALLET_EXPLANATION_PROMPT = `You are Tera's Blockchain Lab tutor. Explain this simulated wallet to a beginner in simple terms.

Wallet details:
- Label: {label}
- Address: {address}
- Network: {network}

Respond with JSON in this exact format:
{
  "title": "Brief headline about wallets",
  "explanation": "2-3 sentence explanation of what a wallet is",
  "whyItMatters": "Why understanding wallets matters",
  "commonMistake": "One common mistake beginners make with wallets",
  "remember": "One key takeaway",
  "checkpointQuestion": "A simple question",
  "checkpointAnswer": "The correct answer"
}`;

export const GAS_EXPLANATION_PROMPT = `You are Tera's Blockchain Lab tutor. Explain gas fees in simple terms for a beginner who just made a transaction.

Transaction details:
- Token: {token}
- Amount: {amount}
- Gas fee: {gasFee} ETH

Respond with JSON in this exact format:
{
  "title": "Brief headline about gas",
  "explanation": "2-3 sentence explanation of what gas fees are",
  "whyItMatters": "Why gas fees are necessary",
  "commonMistake": "One common mistake about gas fees",
  "remember": "One key takeaway",
  "checkpointQuestion": "A simple question",
  "checkpointAnswer": "The correct answer"
}`;

export const FALLBACK_EXPLANATIONS = {
  transaction: {
    title: 'Transaction Complete',
    explanation: 'You just sent fake tokens from one wallet to another. In real blockchains, this would broadcast to the network and be included in a block.',
    whyItMatters: 'Understanding transactions is fundamental to how blockchain works. Every transfer, swap, or smart contract interaction starts as a transaction.',
    commonMistake: 'Beginners often think the transaction is instant. In reality, it goes through pending, confirmation, and block inclusion stages.',
    remember: 'Always check the transaction status and wait for confirmations before assuming it succeeded.',
    checkpointQuestion: 'What are the stages of a blockchain transaction?',
    checkpointAnswer: 'Created → Pending → Confirmed → Added to block',
  },
  block: {
    title: 'Block Confirmed',
    explanation: 'Transactions are grouped together in blocks. When your transaction was confirmed, it was added to a new block on your simulated blockchain.',
    whyItMatters: 'Blocks are the building blocks of blockchain. They batch transactions together and link them cryptographically to create an immutable record.',
    commonMistake: 'Some think each transaction gets its own block. In reality, many transactions are bundled into a single block.',
    remember: 'More confirmations = more security. Each new block on top makes it harder to reverse.',
    checkpointQuestion: 'What is a block in blockchain?',
    checkpointAnswer: 'A batch of confirmed transactions grouped together with a unique hash',
  },
  wallet: {
    title: 'Wallet Created',
    explanation: 'Your simulated wallet has a public address (like an email) and can hold multiple tokens. The private key controls access, but in this lab we use safe fake keys.',
    whyItMatters: 'Wallets are your interface to blockchain. They hold keys, not coins - the coins exist on the blockchain, the wallet just lets you access them.',
    commonMistake: 'Beginners think wallets store crypto. They actually store private keys that let you sign transactions on the blockchain.',
    remember: 'Never share your private key or seed phrase. In this lab, we use fake keys for safe learning.',
    checkpointQuestion: 'What does a crypto wallet actually store?',
    checkpointAnswer: 'Private keys, not the tokens themselves',
  },
  gas: {
    title: 'Gas Fee Paid',
    explanation: 'You paid a small gas fee in fake ETH to process your transaction. Gas covers the computational work of running the transaction on the network.',
    whyItMatters: 'Gas fees prevent spam and pay validators for their work. Without fees, anyone could flood the network with free transactions.',
    commonMistake: 'Beginners think gas is a fixed fee. It varies based on network congestion and transaction complexity.',
    remember: 'In busy times, gas fees can spike. This is normal and helps prioritize transactions.',
    checkpointQuestion: 'Why do we pay gas fees?',
    checkpointAnswer: 'To compensate network validators and prevent spam',
  },
};