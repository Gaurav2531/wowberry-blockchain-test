// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FundManager {
    
    address public owner;
    bool public paused;
    uint256 public transactionCount;
    
    uint256 public constant MIN_DEPOSIT = 0.001 ether;
    uint256 public constant MAX_TRANSACTION = 100 ether;
    
    mapping(address => uint256) public balances;
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isOperator;
    
    struct Transaction {
        uint256 id;
        address user;
        uint256 amount;
        string txType;
        uint256 timestamp;
    }
    
    Transaction[] public transactions;
    
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event Transferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event Whitelisted(address indexed user);
    event RemovedFromWhitelist(address indexed user);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event Paused(uint256 timestamp);
    event Unpaused(uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOperator() {
        require(isOperator[msg.sender] || msg.sender == owner, "Only operator or owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        isOperator[msg.sender] = true;
        isWhitelisted[msg.sender] = true;
    }
    
    function deposit() external payable whenNotPaused {
        require(msg.value >= MIN_DEPOSIT, "Below minimum deposit");
        require(msg.value <= MAX_TRANSACTION, "Exceeds maximum limit");
        
        balances[msg.sender] += msg.value;
        
        transactions.push(Transaction({
            id: transactionCount,
            user: msg.sender,
            amount: msg.value,
            txType: "DEPOSIT",
            timestamp: block.timestamp
        }));
        
        transactionCount++;
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
    
    function withdraw(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(amount <= MAX_TRANSACTION, "Exceeds maximum limit");
        
        balances[msg.sender] -= amount;
        
        transactions.push(Transaction({
            id: transactionCount,
            user: msg.sender,
            amount: amount,
            txType: "WITHDRAWAL",
            timestamp: block.timestamp
        }));
        
        transactionCount++;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }
    
    function transfer(address to, uint256 amount) external whenNotPaused {
        require(to != address(0), "Invalid address");
        require(to != msg.sender, "Cannot transfer to self");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        transactions.push(Transaction({
            id: transactionCount,
            user: msg.sender,
            amount: amount,
            txType: "TRANSFER",
            timestamp: block.timestamp
        }));
        
        transactionCount++;
        emit Transferred(msg.sender, to, amount, block.timestamp);
    }
    
    function addToWhitelist(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(!isWhitelisted[user], "Already whitelisted");
        
        isWhitelisted[user] = true;
        emit Whitelisted(user);
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        require(isWhitelisted[user], "Not whitelisted");
        
        isWhitelisted[user] = false;
        emit RemovedFromWhitelist(user);
    }
    
    function addOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid address");
        require(!isOperator[operator], "Already operator");
        
        isOperator[operator] = true;
        emit OperatorAdded(operator);
    }
    
    function removeOperator(address operator) external onlyOwner {
        require(isOperator[operator], "Not an operator");
        require(operator != owner, "Cannot remove owner");
        
        isOperator[operator] = false;
        emit OperatorRemoved(operator);
    }
    
    function pause() external onlyOperator {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(block.timestamp);
    }
    
    function unpause() external onlyOperator {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(block.timestamp);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    function getTransaction(uint256 txId) external view returns (Transaction memory) {
        require(txId < transactions.length, "Invalid transaction ID");
        return transactions[txId];
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function checkWhitelist(address user) external view returns (bool) {
        return isWhitelisted[user];
    }
    
    function checkOperator(address operator) external view returns (bool) {
        return isOperator[operator];
    }
}