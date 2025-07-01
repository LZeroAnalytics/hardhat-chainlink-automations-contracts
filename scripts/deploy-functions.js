const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("⚡ Deploying Functions Contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    
    // Load base contracts
    let baseDeployment;
    try {
        baseDeployment = JSON.parse(fs.readFileSync('base-deployment.json', 'utf8'));
    } catch (error) {
        console.error("❌ Base contracts not found. Run deploy-base.js first.");
        process.exit(1);
    }
    
    const linkToken = baseDeployment.linkToken;
    console.log("Using LINK token:", linkToken);
    
    // Deploy TermsOfServiceAllowList
    console.log("Deploying TermsOfServiceAllowList...");
    const TermsOfServiceAllowList = await ethers.getContractFactory("TermsOfServiceAllowList");
    const tosAllowList = await TermsOfServiceAllowList.deploy();
    await tosAllowList.deployed();
    console.log("TermsOfServiceAllowList deployed:", tosAllowList.address);
    
    // Deploy FunctionsRouter
    console.log("Deploying FunctionsRouter...");
    const FunctionsRouter = await ethers.getContractFactory("FunctionsRouter");
    const functionsRouter = await FunctionsRouter.deploy(
        linkToken,
        ethers.constants.AddressZero // config
    );
    await functionsRouter.deployed();
    console.log("FunctionsRouter deployed:", functionsRouter.address);
    
    // Deploy FunctionsCoordinator
    console.log("Deploying FunctionsCoordinator...");
    const FunctionsCoordinator = await ethers.getContractFactory("FunctionsCoordinator");
    const functionsCoordinator = await FunctionsCoordinator.deploy(
        functionsRouter.address,
        ethers.constants.AddressZero, // config
        linkToken
    );
    await functionsCoordinator.deployed();
    console.log("FunctionsCoordinator deployed:", functionsCoordinator.address);
    
    // Deploy FunctionsLoadTestClient
    console.log("Deploying FunctionsLoadTestClient...");
    const FunctionsLoadTestClient = await ethers.getContractFactory("FunctionsLoadTestClient");
    const functionsTestClient = await FunctionsLoadTestClient.deploy(functionsRouter.address);
    await functionsTestClient.deployed();
    console.log("FunctionsLoadTestClient deployed:", functionsTestClient.address);
    
    const result = {
        functionsRouter: functionsRouter.address,
        functionsCoordinator: functionsCoordinator.address,
        functionsDONProxy: functionsCoordinator.address, // Using coordinator as DON proxy
        functionsLoadTestClient: functionsTestClient.address,
        functionsAllowList: tosAllowList.address,
        deployer: deployer.address,
        blockNumber: await ethers.provider.getBlockNumber()
    };
    
    fs.writeFileSync('functions-deployment.json', JSON.stringify(result, null, 2));
    console.log("✅ Functions contracts deployed");
    
    return result;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Functions deployment failed:", error);
        process.exit(1);
    }); 