const { ethers } = require('ethers');
require('dotenv').config();

// --- CONFIGURATION ---
const USDC_DECIMALS = 6;

// Support both Base mainnet (default) and Base Sepolia testnet
const NETWORKS = {
    mainnet: {
        name: "base-mainnet",
        rpcUrl: "https://mainnet.base.org",
        chainId: 8453n, // Base mainnet
        addresses: {
            borrowerManager: "0xc6ecd37c42ee73714956b6a449b41bc1d46b07b0",
            usdc: "0x43848d5a4efa0b1c72e1fd8ece1abf42e9d5e221",
        },
    },
    testnet: {
        name: "base-sepolia",
        rpcUrl: "https://sepolia.base.org",
        chainId: 84532n, // Base Sepolia
        addresses: {
            borrowerManager: "0xc6ecd37c42ee73714956b6a449b41bc1d46b07b0",
            usdc: "0x43848d5a4efa0b1c72e1fd8ece1abf42e9d5e221",
        },
    },
};

const BORROWER_MANAGER_ABI = [
    "function isBorrowerRegistered(address) view returns (bool)",
    "function isActiveBorrower(address) view returns (bool)",
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
];

const formatStatusFlag = (value) => value === null ? "⚠️ unknown" : (value ? "✅ yes" : "❌ no");

const MODERN_PROFILE_RETURNS = "uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,bool,uint256[]";
const LEGACY_PROFILE_RETURNS = "uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint256";

const normalizeModernProfile = (result) => {
    const arr = Array.from(result);
    const txIdsRaw = Array.isArray(arr[10]) ? Array.from(arr[10]) : [];
    return {
        creditLimit: arr[0],
        outstandingDebt: arr[1],
        totalSpent: arr[2],
        totalRepaid: arr[3],
        spendingCount: arr[4],
        repaymentCount: arr[5],
        lastActivityTime: arr[6],
        creditScore: arr[7],
        profileIsActive: !!arr[8],
        profileIsAgent: !!arr[9],
        transactionIds: txIdsRaw.map((value) => BigInt(value)),
        legacyAgentSpendLimit: null,
    };
};

const normalizeLegacyProfile = (result) => {
    const arr = Array.from(result);
    return {
        creditLimit: arr[0],
        outstandingDebt: arr[1],
        totalSpent: arr[2],
        totalRepaid: arr[3],
        spendingCount: arr[4],
        repaymentCount: arr[5],
        lastActivityTime: arr[6],
        creditScore: arr[7],
        profileIsActive: !!arr[8],
        profileIsAgent: null,
        transactionIds: [],
        legacyAgentSpendLimit: arr[9],
    };
};

const PROFILE_LAYOUTS = [
    {
        name: "modern-borrowerProfiles",
        functionName: "borrowerProfiles",
        returnTypes: MODERN_PROFILE_RETURNS,
        normalize: normalizeModernProfile,
    },
    {
        name: "modern-sBorrowerProfiles",
        functionName: "s_borrowerProfiles",
        returnTypes: MODERN_PROFILE_RETURNS,
        normalize: normalizeModernProfile,
    },
    {
        name: "legacy-sBorrowerProfiles",
        functionName: "s_borrowerProfiles",
        returnTypes: LEGACY_PROFILE_RETURNS,
        normalize: normalizeLegacyProfile,
    },
];

async function fetchBorrowerProfile(provider, borrowerManagerAddress, borrowerAddress) {
    let lastError;
    for (const layout of PROFILE_LAYOUTS) {
        const iface = new ethers.Interface([
            `function ${layout.functionName}(address) view returns (${layout.returnTypes})`,
        ]);
        try {
            const data = iface.encodeFunctionData(layout.functionName, [borrowerAddress]);
            const raw = await provider.call({ to: borrowerManagerAddress, data });
            if (!raw || raw === "0x") {
                throw new Error("empty response");
            }
            const decoded = iface.decodeFunctionResult(layout.functionName, raw);
            return {
                layout: layout.name,
                profile: layout.normalize(decoded),
            };
        } catch (err) {
            lastError = err;
        }
    }
    const error = new Error("Unable to decode borrower profile via known layouts");
    error.cause = lastError;
    throw error;
}

function printUsage() {
    console.error(`\nUSAGE:\n  node status.js                      # check bot status on mainnet\n  node status.js mainnet              # explicit mainnet\n  node status.js testnet              # Base Sepolia testnet\n`);
}

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ FATAL: PRIVATE_KEY environment variable not set. This script needs it to know which bot to inspect.");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    let networkKey = "mainnet";

    if (args[0]) {
        const maybeNet = args[0].toLowerCase();
        if (maybeNet === "mainnet" || maybeNet === "testnet") {
            networkKey = maybeNet;
        } else {
            printUsage();
            process.exit(1);
        }
    }

    const networkConfig = NETWORKS[networkKey];

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const network = await provider.getNetwork();
    const actualChainId = Number(network.chainId);
    const expectedChainId = Number(networkConfig.chainId);

    if (actualChainId !== expectedChainId) {
        console.error(`❌ FATAL: Unexpected chainId ${actualChainId}. Expected ${expectedChainId} (${networkConfig.name}). Aborting.`);
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const borrowerAddress = wallet.address;

    console.log("--- SOHO Pay Bot Status ---");
    console.log(`- Network: ${networkConfig.name} (${networkKey})`);
    console.log(`- Bot / Borrower address: ${borrowerAddress}`);
    console.log("-------------------------------------------");

    const borrowerManager = new ethers.Contract(
        networkConfig.addresses.borrowerManager,
        BORROWER_MANAGER_ABI,
        provider
    );

    console.log("\n🔍 Fetching registration & profile (via borrower manager)...");
    let isRegistered = null;
    try {
        isRegistered = await borrowerManager.isBorrowerRegistered(borrowerAddress);
    } catch (err) {
        console.warn('⚠️ Unable to read isBorrowerRegistered (continuing with profile data only):', err.shortMessage || err.message || err);
    }

    let isActive = null;
    try {
        isActive = await borrowerManager.isActiveBorrower(borrowerAddress);
    } catch (err) {
        console.warn('⚠️ Unable to read isActiveBorrower (continuing with profile data only):', err.shortMessage || err.message || err);
    }

    let profile;
    let profileLayout;
    try {
        const result = await fetchBorrowerProfile(provider, networkConfig.addresses.borrowerManager, borrowerAddress);
        profile = result.profile;
        profileLayout = result.layout;
    } catch (err) {
        console.error("\n❌ Failed to read borrower profile via known layouts.");
        console.error(err.cause || err);
        process.exit(1);
    }

    const {
        creditLimit,
        outstandingDebt,
        totalSpent,
        totalRepaid,
        spendingCount,
        repaymentCount,
        lastActivityTime,
        creditScore,
        profileIsActive,
        profileIsAgent,
        transactionIds,
    } = profile;

    const usdc = new ethers.Contract(networkConfig.addresses.usdc, ERC20_ABI, provider);
    const usdcBalanceRaw = await usdc.balanceOf(borrowerAddress);
    const usdcBalance = ethers.formatUnits(usdcBalanceRaw, USDC_DECIMALS);

    console.log(`- Registered (mapping): ${formatStatusFlag(isRegistered)}`);
    console.log(`- Active (BorrowerManager): ${formatStatusFlag(isActive)}`);
    console.log(`- USDC wallet balance: ${usdcBalance} USDC`);
    console.log(`- Profile layout source: ${profileLayout}`);

    console.log("\n📊 Borrower Profile:");
    console.log(`- Credit limit:       ${ethers.formatUnits(creditLimit, USDC_DECIMALS)} USDC`);
    console.log(`- Outstanding debt:   ${ethers.formatUnits(outstandingDebt, USDC_DECIMALS)} USDC`);
    console.log(`- Total spent:        ${ethers.formatUnits(totalSpent, USDC_DECIMALS)} USDC`);
    console.log(`- Total repaid:       ${ethers.formatUnits(totalRepaid, USDC_DECIMALS)} USDC`);
    console.log(`- Spending count:     ${spendingCount.toString()}`);
    console.log(`- Repayment count:    ${repaymentCount.toString()}`);
    const lastActivitySeconds = Number(lastActivityTime ?? 0n);
    const lastActivityDisplay = lastActivitySeconds === 0 ? "never" : new Date(lastActivitySeconds * 1000).toISOString();
    console.log(`- Last activity time: ${lastActivityDisplay}`);
    console.log(`- Credit score:       ${creditScore.toString()}`);
    console.log(`- isActive (profile): ${profileIsActive ? "✅ yes" : "❌ no"}`);

    if (profileIsAgent === null) {
        console.log("- isAgent (profile):  ⚠️ not provided by legacy layout");
    } else {
        console.log(`- isAgent (profile):  ${profileIsAgent ? "✅ yes" : "❌ no"}`);
    }

    if (profileLayout.startsWith("legacy")) {
        console.log("- Transactions seen:  ⚠️ not provided by legacy layout");
    } else {
        console.log(`- Transactions seen:  ${transactionIds.length}`);
    }

    console.log("\nSUMMARY:");
    console.log(`USDC balance for ${borrowerAddress} on ${networkConfig.name}: ${usdcBalance} USDC`);
    console.log(`Outstanding debt for ${borrowerAddress} on ${networkConfig.name}: ${ethers.formatUnits(outstandingDebt, USDC_DECIMALS)} USDC`);
}

main().catch((err) => {
    console.error("\n❌ Unexpected error in status.js:", err);
    process.exit(1);
});
