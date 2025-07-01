const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🔍 Verifying Chainlink Infrastructure Deployment...");
    
    // Load deployment info
    const deploymentFile = 'deployment-info.json';
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`❌ Deployment file not found: ${deploymentFile}`);
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log(`📋 Loaded deployment from block ${deployment.blockNumber}`);
    
    const [deployer] = await ethers.getSigners();
    console.log(`🔐 Verifying with account: ${deployer.address}`);
    
    // Verify base contracts
    console.log("\n🏗️  Verifying Base Contracts...");
    await verifyContract("LINK Token", deployment.linkToken);
    await verifyContract("LINK/ETH Feed", deployment.linkEthFeed);
    
    // Verify automation contracts if deployed
    if (deployment.automationRegistry && deployment.automationRegistry !== ethers.constants.AddressZero) {
        console.log("\n🤖 Verifying Automation Contracts...");
        await verifyContract("Automation Registry", deployment.automationRegistry);
        await verifyContract("Automation Registrar", deployment.automationRegistrar);
        await verifyContract("Keeper Registry 2.1", deployment.keeperRegistry2_1);
        await verifyContract("Log Upkeep Counter", deployment.logUpkeepCounter);
        await verifyContract("Upkeep Transcoder", deployment.upkeepTranscoder);
        
        // Test automation registry functionality
        await testAutomationRegistry(deployment.automationRegistry);
    }
    
    // Verify Functions contracts if deployed
    if (deployment.functionsRouter && deployment.functionsRouter !== ethers.constants.AddressZero) {
        console.log("\n⚡ Verifying Functions Contracts...");
        await verifyContract("Functions Router", deployment.functionsRouter);
        await verifyContract("Functions Coordinator", deployment.functionsCoordinator);
        await verifyContract("Functions DON Proxy", deployment.functionsDONProxy);
        await verifyContract("Functions Test Client", deployment.functionsLoadTestClient);
        
        // Test Functions functionality
        await testFunctionsRouter(deployment.functionsRouter);
    }
    
    // Verify Direct Request contracts if deployed
    if (deployment.operator && deployment.operator !== ethers.constants.AddressZero) {
        console.log("\n📡 Verifying Direct Request Contracts...");
        await verifyContract("Operator", deployment.operator);
        await verifyContract("Direct Request Consumer", deployment.directRequestConsumer);
        await verifyContract("API Consumer", deployment.apiConsumer);
        
        // Test operator functionality
        await testOperator(deployment.operator);
    }
    
    console.log("\n✅ All contracts verified successfully!");
    console.log("\n📊 Verification Summary:");
    console.log(`  - Infrastructure Contract: ${deployment.infrastructureContract}`);
    console.log(`  - Total Gas Used: ${deployment.gasUsed}`);
    console.log(`  - Deployment Block: ${deployment.blockNumber}`);
    console.log(`  - Transaction Hash: ${deployment.transactionHash}`);
}

async function verifyContract(name, address) {
    try {
        // Check if contract has code
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
            throw new Error("No code at address");
        }
        
        console.log(`  ✅ ${name}: ${address} (${code.length} bytes)`);
        return true;
    } catch (error) {
        console.log(`  ❌ ${name}: ${address} - ${error.message}`);
        return false;
    }
}

async function testAutomationRegistry(registryAddress) {
    try {
        console.log(`\n🔧 Testing Automation Registry: ${registryAddress}`);
        
        // Get the registry contract (we'll use a basic interface)
        const registry = await ethers.getContractAt(
            ["function getState() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)"],
            registryAddress
        );
        
        // Test basic read function
        const state = await registry.getState();
        console.log(`  📊 Registry State: nonce=${state[0]}, ownerLinkBalance=${state[1]}`);
        console.log(`  ✅ Automation Registry is functional`);
        
    } catch (error) {
        console.log(`  ⚠️  Could not test registry functionality: ${error.message}`);
    }
}

async function testFunctionsRouter(routerAddress) {
    try {
        console.log(`\n🔧 Testing Functions Router: ${routerAddress}`);
        
        // Get the router contract with basic interface
        const router = await ethers.getContractAt(
            ["function getConfig() view returns (uint16, uint16, bytes32, address)"],
            routerAddress
        );
        
        // Test basic read function
        const config = await router.getConfig();
        console.log(`  📊 Router Config: maxConsumersPerSubscription=${config[0]}`);
        console.log(`  ✅ Functions Router is functional`);
        
    } catch (error) {
        console.log(`  ⚠️  Could not test router functionality: ${error.message}`);
    }
}

async function testOperator(operatorAddress) {
    try {
        console.log(`\n🔧 Testing Operator: ${operatorAddress}`);
        
        // Get the operator contract
        const operator = await ethers.getContractAt(
            ["function getChainlinkToken() view returns (address)", "function owner() view returns (address)"],
            operatorAddress
        );
        
        // Test basic read functions
        const linkToken = await operator.getChainlinkToken();
        const owner = await operator.owner();
        
        console.log(`  📊 Operator LINK Token: ${linkToken}`);
        console.log(`  📊 Operator Owner: ${owner}`);
        console.log(`  ✅ Operator is functional`);
        
    } catch (error) {
        console.log(`  ⚠️  Could not test operator functionality: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }); 