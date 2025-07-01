const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("📡 Deploying Direct Request Contracts...");
    
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
    
    // Deploy Operator
    console.log("Deploying Operator...");
    const Operator = await ethers.getContractFactory("Operator");
    const operator = await Operator.deploy(linkToken, deployer.address);
    await operator.deployed();
    console.log("Operator deployed:", operator.address);
    
    // Deploy DirectRequestConsumer
    console.log("Deploying DirectRequestConsumer...");
    const DirectRequestConsumer = await ethers.getContractFactory("DirectRequestConsumer");
    const directRequestConsumer = await DirectRequestConsumer.deploy(
        linkToken,
        operator.address
    );
    await directRequestConsumer.deployed();
    console.log("DirectRequestConsumer deployed:", directRequestConsumer.address);
    
    // Deploy APIConsumer
    console.log("Deploying APIConsumer...");
    const APIConsumer = await ethers.getContractFactory("APIConsumer");
    const apiConsumer = await APIConsumer.deploy(
        linkToken,
        operator.address
    );
    await apiConsumer.deployed();
    console.log("APIConsumer deployed:", apiConsumer.address);
    
    const result = {
        operator: operator.address,
        directRequestConsumer: directRequestConsumer.address,
        apiConsumer: apiConsumer.address,
        deployer: deployer.address,
        blockNumber: await ethers.provider.getBlockNumber()
    };
    
    fs.writeFileSync('direct-requests-deployment.json', JSON.stringify(result, null, 2));
    console.log("✅ Direct Request contracts deployed");
    
    return result;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Direct Request deployment failed:", error);
        process.exit(1);
    }); 