const CONTRACT_ABI = [
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function transfer(address to, uint256 amount) external",
    "function addToWhitelist(address user) external",
    "function removeFromWhitelist(address user) external",
    "function addOperator(address operator) external",
    "function removeOperator(address operator) external",
    "function pause() external",
    "function unpause() external",
    "function owner() external view returns (address)",
    "function paused() external view returns (bool)",
    "function transactionCount() external view returns (uint256)",
    "function balances(address user) external view returns (uint256)",
    "function isWhitelisted(address user) external view returns (bool)",
    "function isOperator(address operator) external view returns (bool)",
    "function getBalance(address user) external view returns (uint256)",
    "function getTransaction(uint256 txId) external view returns (tuple(uint256 id, address user, uint256 amount, string txType, uint256 timestamp))",
    "function getContractBalance() external view returns (uint256)",
    "function checkWhitelist(address user) external view returns (bool)",
    "function checkOperator(address operator) external view returns (bool)",
    "event Deposited(address indexed user, uint256 amount, uint256 timestamp)",
    "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)",
    "event Transferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp)"
];

let provider, signer, contract, userAddress;
let isOwner = false;
let isOperatorUser = false;
let isConnected = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    checkEthereumAvailability();
    init();
});

function checkEthereumAvailability() {
    if (typeof window.ethereum === 'undefined') {
        console.error('❌ MetaMask not detected!');
        alert('⚠️ MetaMask not detected!\n\nPlease install MetaMask:\n1. Visit https://metamask.io/download/\n2. Install the extension\n3. Refresh this page');
    } else {
        console.log('✅ MetaMask detected');
        console.log('Ethereum object:', window.ethereum);
    }
}

function init() {
    setupEventListeners();
    checkWalletConnection();
}

function setupEventListeners() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
        console.log('✅ Connect button listener added');
    } else {
        console.error('❌ Connect button not found!');
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
        console.log('✅ Disconnect button listener added');
    }

    document.getElementById('loadContractBtn')?.addEventListener('click', loadContract);
    document.getElementById('depositBtn')?.addEventListener('click', deposit);
    document.getElementById('withdrawBtn')?.addEventListener('click', withdraw);
    document.getElementById('transferBtn')?.addEventListener('click', transfer);
    document.getElementById('checkBalanceBtn')?.addEventListener('click', checkBalance);
    document.getElementById('addWhitelistBtn')?.addEventListener('click', () => manageWhitelist('add'));
    document.getElementById('removeWhitelistBtn')?.addEventListener('click', () => manageWhitelist('remove'));
    document.getElementById('checkWhitelistBtn')?.addEventListener('click', () => manageWhitelist('check'));
    document.getElementById('addOperatorBtn')?.addEventListener('click', () => manageOperator('add'));
    document.getElementById('removeOperatorBtn')?.addEventListener('click', () => manageOperator('remove'));
    document.getElementById('checkOperatorBtn')?.addEventListener('click', () => manageOperator('check'));
    document.getElementById('pauseBtn')?.addEventListener('click', pauseContract);
    document.getElementById('unpauseBtn')?.addEventListener('click', unpauseContract);
    document.getElementById('refreshBtn')?.addEventListener('click', loadTransactionHistory);
}

async function checkWalletConnection() {
    console.log('Checking wallet connection...');
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            console.log('Existing accounts:', accounts);
            if (accounts.length > 0) {
                console.log('Auto-connecting to existing account');
                await connectWallet();
            }
        } catch (error) {
            console.error('Check connection error:', error);
        }
    }
}

async function connectWallet() {
    console.log('🔄 Connecting wallet...');
    
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('⚠️ MetaMask not installed!\n\nPlease install MetaMask from:\nhttps://metamask.io/download/');
            return;
        }

        console.log('Requesting accounts...');
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Accounts received:', accounts);

        if (!accounts || accounts.length === 0) {
            alert('No accounts found. Please unlock MetaMask and try again.');
            return;
        }

        console.log('Creating provider...');
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = accounts[0];
        isConnected = true;

        console.log('✅ Wallet connected:', userAddress);

        const balance = await provider.getBalance(userAddress);
        const network = await provider.getNetwork();

        console.log('Balance:', ethers.utils.formatEther(balance));
        console.log('Network:', network);

        document.getElementById('userAddress').textContent = formatAddress(userAddress);
        document.getElementById('walletBalance').textContent = ethers.utils.formatEther(balance).substring(0, 8) + ' BNB';
        document.getElementById('networkName').textContent = network.chainId === 97 ? 'BNB Testnet' : `Network ${network.chainId}`;
        document.getElementById('walletStatus').textContent = '✅ ' + formatAddress(userAddress);
        document.getElementById('walletInfo').style.display = 'block';

        updateConnectionUI(true);

        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', () => {
            console.log('Network changed, reloading...');
            window.location.reload();
        });

        showToast('✅ Wallet connected successfully!', 'success');
    } catch (error) {
        console.error('❌ Connection error:', error);
        
        if (error.code === 4001) {
            alert('⚠️ Connection rejected!\n\nYou rejected the connection request.\nPlease try again and approve the connection.');
        } else if (error.code === -32002) {
            alert('⚠️ Connection pending!\n\nPlease check MetaMask.\nThere might be a pending connection request.');
        } else {
            alert('❌ Connection failed!\n\nError: ' + error.message);
        }
    }
}

function disconnectWallet() {
    console.log('🔌 Disconnecting wallet...');
    
    provider = null;
    signer = null;
    contract = null;
    userAddress = null;
    isConnected = false;
    isOwner = false;
    isOperatorUser = false;

    document.getElementById('walletInfo').style.display = 'none';
    document.getElementById('contractInfoSection').style.display = 'none';
    document.getElementById('actionsGrid').style.display = 'none';
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('emergencySection').style.display = 'none';
    
    document.getElementById('contractAddress').value = '';
    document.getElementById('userAddress').textContent = 'Not Connected';
    document.getElementById('walletBalance').textContent = '0 BNB';
    document.getElementById('networkName').textContent = 'Unknown';
    document.getElementById('contractBalance').textContent = '0 BNB';
    document.getElementById('walletStatus').textContent = '🔌 Connect Wallet';

    updateConnectionUI(false);

    showToast('🔴 Wallet disconnected', 'warning');
}

function updateConnectionUI(connected) {
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');

    if (connected) {
        connectBtn.classList.add('connected');
        connectBtn.disabled = true;
        disconnectBtn.style.display = 'block';
    } else {
        connectBtn.classList.remove('connected');
        connectBtn.disabled = false;
        disconnectBtn.style.display = 'none';
    }
}

function handleAccountChange(accounts) {
    console.log('Account changed:', accounts);
    if (accounts.length === 0) {
        console.log('No accounts, disconnecting...');
        disconnectWallet();
    } else {
        console.log('New account detected, reconnecting...');
        showToast('Account changed, reconnecting...', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

async function loadContract() {
    try {
        if (!isConnected || !signer) {
            showToast('Please connect wallet first', 'error');
            return;
        }

        const address = document.getElementById('contractAddress').value.trim();

        if (!address) {
            showToast('Please enter contract address', 'error');
            return;
        }

        if (!ethers.utils.isAddress(address)) {
            showToast('Invalid contract address format', 'error');
            return;
        }

        console.log('Loading contract at:', address);
        contract = new ethers.Contract(address, CONTRACT_ABI, signer);

        const owner = await contract.owner();
        const paused = await contract.paused();
        const txCount = await contract.transactionCount();
        const userBalance = await contract.balances(userAddress);
        const isWhiteListed = await contract.checkWhitelist(userAddress);
        const isOp = await contract.checkOperator(userAddress);

        isOwner = owner.toLowerCase() === userAddress.toLowerCase();
        isOperatorUser = isOp;

        console.log('Contract loaded successfully');
        console.log('Owner:', owner);
        console.log('Is owner:', isOwner);
        console.log('Is operator:', isOperatorUser);

        document.getElementById('contractOwner').textContent = formatAddress(owner);
        document.getElementById('contractStatus').textContent = paused ? '⏸ Paused' : '▶ Active';
        document.getElementById('contractStatus').style.color = paused ? 'var(--danger)' : 'var(--success)';
        document.getElementById('txCount').textContent = txCount.toString();
        document.getElementById('contractBalance').textContent = ethers.utils.formatEther(userBalance).substring(0, 8) + ' BNB';
        
        let role = 'User';
        if (isOwner) role = 'Owner 👑';
        else if (isOperatorUser) role = 'Operator 👮';
        else if (isWhiteListed) role = 'Whitelisted ✅';
        document.getElementById('userRole').textContent = role;

        document.getElementById('contractInfoSection').style.display = 'block';
        document.getElementById('actionsGrid').style.display = 'grid';
        document.getElementById('historySection').style.display = 'block';

        if (isOwner || isOperatorUser) {
            document.getElementById('emergencySection').style.display = 'block';
        }

        if (isOwner) {
            document.getElementById('whitelistCard').style.display = 'block';
            document.getElementById('operatorCard').style.display = 'block';
        } else {
            document.getElementById('whitelistCard').style.display = 'none';
            document.getElementById('operatorCard').style.display = 'none';
        }

        await loadTransactionHistory();
        showToast('Contract loaded successfully!', 'success');
    } catch (error) {
        console.error('Load contract error:', error);
        showToast('Failed to load contract: ' + error.message, 'error');
    }
}

async function deposit() {
    try {
        const amount = document.getElementById('depositAmount').value;

        if (!amount || parseFloat(amount) < 0.001) {
            showToast('Minimum deposit is 0.001 BNB', 'error');
            return;
        }

        showToast('Processing deposit...', 'info');
        const tx = await contract.deposit({ value: ethers.utils.parseEther(amount) });
        showToast('Waiting for confirmation...', 'info');
        await tx.wait();

        showToast(`Deposited ${amount} BNB successfully!`, 'success');
        await loadContract();
        await updateWalletBalance();
        document.getElementById('depositAmount').value = '';
    } catch (error) {
        console.error('Deposit error:', error);
        showToast('Deposit failed: ' + (error.reason || error.message), 'error');
    }
}

async function withdraw() {
    try {
        const amount = document.getElementById('withdrawAmount').value;

        if (!amount || parseFloat(amount) <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }

        showToast('Processing withdrawal...', 'info');
        const tx = await contract.withdraw(ethers.utils.parseEther(amount));
        showToast('Waiting for confirmation...', 'info');
        await tx.wait();

        showToast(`Withdrew ${amount} BNB successfully!`, 'success');
        await loadContract();
        await updateWalletBalance();
        document.getElementById('withdrawAmount').value = '';
    } catch (error) {
        console.error('Withdraw error:', error);
        showToast('Withdrawal failed: ' + (error.reason || error.message), 'error');
    }
}

async function transfer() {
    try {
        const to = document.getElementById('transferTo').value.trim();
        const amount = document.getElementById('transferAmount').value;

        if (!to || !ethers.utils.isAddress(to)) {
            showToast('Invalid recipient address', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }

        showToast('Processing transfer...', 'info');
        const tx = await contract.transfer(to, ethers.utils.parseEther(amount));
        showToast('Waiting for confirmation...', 'info');
        await tx.wait();

        showToast(`Transferred ${amount} BNB successfully!`, 'success');
        await loadContract();
        document.getElementById('transferTo').value = '';
        document.getElementById('transferAmount').value = '';
    } catch (error) {
        console.error('Transfer error:', error);
        showToast('Transfer failed: ' + (error.reason || error.message), 'error');
    }
}

async function checkBalance() {
    try {
        const address = document.getElementById('checkBalanceAddress').value.trim();

        if (!address || !ethers.utils.isAddress(address)) {
            showToast('Invalid address', 'error');
            return;
        }

        const balance = await contract.balances(address);
        const resultBox = document.getElementById('balanceResult');
        resultBox.textContent = `Balance: ${ethers.utils.formatEther(balance).substring(0, 10)} BNB`;
        resultBox.className = 'result-box show success';
    } catch (error) {
        console.error('Check balance error:', error);
        showToast('Failed to check balance', 'error');
    }
}

async function manageWhitelist(action) {
    try {
        const address = document.getElementById('whitelistAddress').value.trim();
        const resultBox = document.getElementById('whitelistResult');

        if (!address || !ethers.utils.isAddress(address)) {
            showToast('Invalid address', 'error');
            return;
        }

        if (action === 'check') {
            const isWhiteListed = await contract.checkWhitelist(address);
            resultBox.textContent = isWhiteListed ? '✅ Whitelisted' : '❌ Not whitelisted';
            resultBox.className = 'result-box show ' + (isWhiteListed ? 'success' : 'error');
            return;
        }

        showToast(`${action === 'add' ? 'Adding to' : 'Removing from'} whitelist...`, 'info');
        const tx = action === 'add' 
            ? await contract.addToWhitelist(address)
            : await contract.removeFromWhitelist(address);
        await tx.wait();

        showToast(`Successfully ${action === 'add' ? 'added' : 'removed'}!`, 'success');
        document.getElementById('whitelistAddress').value = '';
        resultBox.className = 'result-box';
    } catch (error) {
        console.error('Whitelist error:', error);
        showToast('Operation failed: ' + (error.reason || error.message), 'error');
    }
}

async function manageOperator(action) {
    try {
        const address = document.getElementById('operatorAddress').value.trim();
        const resultBox = document.getElementById('operatorResult');

        if (!address || !ethers.utils.isAddress(address)) {
            showToast('Invalid address', 'error');
            return;
        }

        if (action === 'check') {
            const isOp = await contract.checkOperator(address);
            resultBox.textContent = isOp ? '✅ Is operator' : '❌ Not operator';
            resultBox.className = 'result-box show ' + (isOp ? 'success' : 'error');
            return;
        }

        showToast(`${action === 'add' ? 'Adding' : 'Removing'} operator...`, 'info');
        const tx = action === 'add' 
            ? await contract.addOperator(address)
            : await contract.removeOperator(address);
        await tx.wait();

        showToast(`Successfully ${action === 'add' ? 'added' : 'removed'}!`, 'success');
        document.getElementById('operatorAddress').value = '';
        resultBox.className = 'result-box';
    } catch (error) {
        console.error('Operator error:', error);
        showToast('Operation failed: ' + (error.reason || error.message), 'error');
    }
}

async function pauseContract() {
    try {
        showToast('Pausing contract...', 'info');
        const tx = await contract.pause();
        await tx.wait();
        showToast('Contract paused!', 'success');
        await loadContract();
    } catch (error) {
        console.error('Pause error:', error);
        showToast('Pause failed: ' + (error.reason || error.message), 'error');
    }
}

async function unpauseContract() {
    try {
        showToast('Unpausing contract...', 'info');
        const tx = await contract.unpause();
        await tx.wait();
        showToast('Contract unpaused!', 'success');
        await loadContract();
    } catch (error) {
        console.error('Unpause error:', error);
        showToast('Unpause failed: ' + (error.reason || error.message), 'error');
    }
}

async function loadTransactionHistory() {
    try {
        const txCount = await contract.transactionCount();
        const listElement = document.getElementById('transactionList');
        
        if (txCount.eq(0)) {
            listElement.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }

        listElement.innerHTML = '';
        
        const start = Math.max(0, txCount - 10);
        for (let i = txCount - 1; i >= start; i--) {
            const tx = await contract.getTransaction(i);
            const txElement = createTransactionElement(tx);
            listElement.appendChild(txElement);
        }
    } catch (error) {
        console.error('Load history error:', error);
        document.getElementById('transactionList').innerHTML = '<p class="empty-state">Failed to load</p>';
    }
}

function createTransactionElement(tx) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    const date = new Date(tx.timestamp * 1000).toLocaleString();
    
    div.innerHTML = `
        <span class="tx-type ${tx.txType.toLowerCase()}">${tx.txType}</span>
        <p><strong>User:</strong> ${formatAddress(tx.user)}</p>
        <p><strong>Amount:</strong> ${ethers.utils.formatEther(tx.amount).substring(0, 10)} BNB</p>
        <p><strong>Time:</strong> ${date}</p>
    `;
    
    return div;
}

async function updateWalletBalance() {
    if (!provider || !userAddress) return;
    try {
        const balance = await provider.getBalance(userAddress);
        document.getElementById('walletBalance').textContent = ethers.utils.formatEther(balance).substring(0, 8) + ' BNB';
    } catch (error) {
        console.error('Update balance error:', error);
    }
}

function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
        <span style="font-size: 1.2em;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function formatAddress(address) {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
        return 'N/A';
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}