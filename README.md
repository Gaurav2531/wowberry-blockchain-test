# Wowberry Fund Manager

A secure blockchain-based fund management system built on BNB Smart Chain Testnet with role-based access control and comprehensive audit trails.

## Overview

This project implements a decentralized fund management solution that allows users to deposit, withdraw, and transfer funds securely on the blockchain. The system includes role-based permissions, emergency controls, and maintains a complete transaction history for transparency and auditability.

## Deployment Details

**Contract Address:** `0xbE62BCA0369c684C3e410dA6C2e2956bf984Cf41`  
**Network:** BNB Smart Chain Testnet  
**Chain ID:** 97  
**Explorer:** https://testnet.bscscan.com/address/0xbE62BCA0369c684C3e410dA6C2e2956bf984Cf41

## Features

- **Deposits**: Users can deposit BNB with minimum 0.001 BNB
- **Withdrawals**: Users can withdraw their deposited funds
- **Transfers**: Internal transfers between users
- **Whitelist System**: Owner can whitelist trusted addresses
- **Operator Management**: Owner can add/remove operators
- **Emergency Pause**: Operators can pause contract in emergencies
- **Transaction History**: All transactions are logged on-chain
- **Event Logging**: Complete audit trail via events

## Contract Functions

**User Functions:**
- `deposit()` - Deposit BNB (min 0.001)
- `withdraw(uint256 amount)` - Withdraw funds
- `transfer(address to, uint256 amount)` - Transfer to another user
- `balances(address user)` - Check balance
- `getTransaction(uint256 txId)` - View transaction details

**Owner Functions:**
- `addToWhitelist(address user)` - Add user to whitelist
- `removeFromWhitelist(address user)` - Remove from whitelist
- `addOperator(address operator)` - Add operator
- `removeOperator(address operator)` - Remove operator

**Operator Functions:**
- `pause()` - Pause contract
- `unpause()` - Unpause contract

## Technology Stack

- Solidity 0.8.19 for smart contracts
- Hardhat for development and testing
- Ethers.js for blockchain interaction
- Vanilla JavaScript, HTML, CSS for the frontend
- Deployed on BNB Smart Chain Testnet

## Installation

Install dependencies:
```bash
npm install --legacy-peer-deps
```

## Local Development

Compile contracts:
```bash
npm run compile
```

Run tests:
```bash
npm test
```

## Deployment

The contract was deployed using Remix IDE on BNB Testnet. To deploy your own instance:

1. Open Remix at https://remix.ethereum.org
2. Load the contract from `contracts/FundManager.sol`
3. Set compiler to 0.8.19 with optimization enabled (200 runs)
4. Connect MetaMask to BNB Testnet
5. Deploy the contract
6. Save the deployed address

## BNB Testnet Setup

Add BNB Testnet to MetaMask:

- Network Name: BNB Smart Chain Testnet
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97
- Symbol: tBNB
- Explorer: https://testnet.bscscan.com

Get test BNB from: https://testnet.bnbchain.org/faucet-smart

## Using the Dashboard

Open `frontend/index.html` in a browser to access the web interface.

Steps to use:
1. Connect your MetaMask wallet
2. Enter the deployed contract address
3. Click "Load Contract" to initialize
4. Use the interface to deposit, withdraw, or transfer funds

## Contract Functions

Main functions available:

- `deposit()` - Deposit BNB into the contract (minimum 0.001 BNB)
- `withdraw(uint256 amount)` - Withdraw your deposited funds
- `transfer(address to, uint256 amount)` - Transfer funds to another user
- `balanceOf(address user)` - Check account balance
- `getTransaction(uint256 txId)` - View transaction details
- `getUserTransactions(address user)` - Get all transactions for a user

Admin functions:
- `grantRole(bytes32 role, address account)` - Grant roles to users
- `revokeRole(bytes32 role, address account)` - Revoke roles
- `pause()` - Pause contract operations
- `unpause()` - Resume operations

## Security Considerations

The contract implements several security measures:

- Reentrancy protection using guard counters
- Role-based access control for sensitive functions
- Input validation on all user operations
- Minimum and maximum transaction limits
- Emergency pause mechanism
- Complete event logging for auditability

## Testing

The test suite covers core functionality including deposits, withdrawals, transfers, access control, and emergency functions. Run the tests to verify contract behavior:
```bash
npm test
```

## Project Structure
```
wowberry-blockchain-test/
├── contracts/
│   └── FundManager.sol
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── test/
│   └── FundManager.test.js
├── hardhat.config.js
├── package.json
└── README.md
```

## License

MIT



# UTXO Model vs Account Model

## What is UTXO?

**UTXO** = Unspent Transaction Output
**UTXO (Unspent Transaction Output)**: Bitcoin's model that tracks individual transaction outputs.  
**Account Model**: Ethereum/BNB model that tracks account balances directly.
A blockchain accounting method where transactions consume previous outputs and create new ones.

## Quick Comparison

| Aspect | UTXO Model | Account Model |
|--------|------------|---------------|
| **Used By** | Bitcoin, Cardano | Ethereum, BNB Chain |
| **How It Works** | Tracks individual coins/outputs | Tracks account balances |
| **Balance** | Sum of unspent outputs | Direct balance value |
| **Privacy** | Better (new addresses) | Lower (same address) |
| **Complexity** | Higher | Lower |
| **Smart Contracts** | Difficult | Easy |

## Simple Examples

### UTXO Model (Bitcoin)
```
Alice has 5 BTC in 2 outputs:
- Output 1: 3 BTC
- Output 2: 2 BTC

Alice sends 4 BTC to Bob:
- Input: 3 BTC + 2 BTC = 5 BTC
- Output 1: 4 BTC to Bob
- Output 2: 1 BTC change to Alice
- Old outputs destroyed, new outputs created
```

### Account Model (Ethereum/BNB)
```
Alice balance: 5 BNB
Bob balance: 0 BNB

Alice sends 4 BNB to Bob:
- Alice: 5 - 4 = 1 BNB
- Bob: 0 + 4 = 4 BNB
- Simple balance update
```

## Why We Use Account Model

Our Fund Manager contract uses **Account Model** because:

1. ✅ Deployed on BNB Chain (EVM)
2. ✅ Requires smart contract logic
3. ✅ Easier for DApps
4. ✅ Better user experience
```solidity
// Our implementation - Account Model
mapping(address => uint256) public balances;

function deposit() external payable {
    balances[msg.sender] += msg.value;
}

function withdraw(uint256 amount) external {
    balances[msg.sender] -= amount;
}
```

## Transaction History

While using Account Model, we maintain transaction logs for auditability:
```solidity
struct Transaction {
    uint256 id;
    address user;
    uint256 amount;
    string txType;
    uint256 timestamp;
}
```

This combines:
- ✅ Account Model simplicity
- ✅ UTXO-style audit trail

## Key Takeaway

**UTXO** = Like physical cash (individual bills)  
**Account** = Like bank account (one balance)

We chose Account Model because it's the standard for EVM smart contracts and provides the best experience for our DApp.
