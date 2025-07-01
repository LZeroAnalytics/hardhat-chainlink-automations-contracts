const { ethers } = require("hardhat");

async function main() {
  console.log("🤖  DEPLOYING AUTOMATION v2.3 (OCR3 stack)");

  //------------------------------------------------------------------
  // 0. Basics
  //------------------------------------------------------------------
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  console.log("signer :", deployer.address);
  console.log("chain  :", net.chainId.toString());

  //------------------------------------------------------------------
  // 1. Deploy LINK token & feeds (mock if not provided)
  //------------------------------------------------------------------
  const linkToken = await deployIfMissing("LinkToken", process.env.LINK_TOKEN_ADDRESS);
  //Not used in v2.3 anymore: const linkNativeFeed = await deployIfMissing("MockV3Aggregator", process.env.LINK_NATIVE_FEED_ADDRESS, 8, ethers.utils.parseUnits("7.5", 8));
  const linkUsdFeed = await deployIfMissing(
    "MockV3Aggregator",
    process.env.LINK_USD_FEED_ADDRESS,
    8,
    ethers.utils.parseUnits("7.5", 8)
  );
  const nativeUsdFeed = await deployIfMissing(
    "MockETHUSDAggregator",
    process.env.NATIVE_USD_FEED_ADDRESS,
    8,
    ethers.utils.parseUnits("2000", 8)
  );
  const fastGasFeed = await deployIfMissing(
    "MockV3Aggregator",
    process.env.GAS_FEED_ADDRESS,
    9,
    ethers.utils.parseUnits("50", 9)
  );
  const wrappedNative = await deployIfMissing("WETH9", process.env.WRAPPED_NATIVE_ADDRESS);

  //------------------------------------------------------------------
  // 2. Deploy Chain-Specific Module
  //------------------------------------------------------------------
  let chainModule;
  const networkType = process.env.NETWORK_TYPE;
  
  if (networkType === "arbitrum") {
    console.log("Deploying ArbitrumModule for Arbitrum...");
    const ArbitrumModule = await ethers.getContractFactory("ArbitrumModule");
    chainModule = await ArbitrumModule.deploy();
    await chainModule.deployed();
  } else if (networkType === "optimism") {
    console.log("Deploying OptimismModule for Optimism...");
    const OptimismModule = await ethers.getContractFactory("OptimismModule");
    chainModule = await OptimismModule.deploy();
    await chainModule.deployed();
  } else if (networkType === "base") {
    console.log("Deploying OptimismModule for Base (uses Optimism module)...");
    const OptimismModule = await ethers.getContractFactory("OptimismModule");
    chainModule = await OptimismModule.deploy();
    await chainModule.deployed();
  } else if (networkType === "scroll") {
    console.log("Deploying ScrollModule for Scroll...");
    const ScrollModule = await ethers.getContractFactory("ScrollModule");
    chainModule = await ScrollModule.deploy();
    await chainModule.deployed();
  } else {
    // Ethereum mainnet, testnets, or other evm chains
    console.log("Deploying ChainModuleBase for generic chains...");
    const ChainModule = await ethers.getContractFactory("ChainModuleBase");
    chainModule = await ChainModule.deploy();
    await chainModule.deployed();
  }
  
  console.log("   ChainModule:", chainModule.address);

  //------------------------------------------------------------------
  // 3. Helper contracts
  //------------------------------------------------------------------
  const ForwarderLogic = await ethers.getContractFactory("AutomationForwarderLogic");
  const forwarderLogic = await ForwarderLogic.deploy();
  await forwarderLogic.deployed();
  //usually would also deploy trancoder but seams 2_3 does not need it

  //------------------------------------------------------------------
  // 4. Logic contracts (C → B → A)
  //------------------------------------------------------------------
  const LogicC = await ethers.getContractFactory("AutomationRegistryLogicC2_3");
  const logicC = await LogicC.deploy(
    linkToken.address,
    linkUsdFeed.address, 
    nativeUsdFeed.address,
    fastGasFeed.address,
    forwarderLogic.address,
    ethers.constants.AddressZero, // readOnly ✓
    0, // payout ON_CHAIN ✓
    wrappedNative.address
  );
  await logicC.deployed();

  const LogicB = await ethers.getContractFactory("AutomationRegistryLogicB2_3");
  const logicB = await LogicB.deploy(logicC.address);
  await logicB.deployed();

  const LogicA = await ethers.getContractFactory("AutomationRegistryLogicA2_3");
  const logicA = await LogicA.deploy(logicB.address);
  await logicA.deployed();

  //------------------------------------------------------------------
  // 5. Root Registry 2.3
  //------------------------------------------------------------------
  const Registry = await ethers.getContractFactory("AutomationRegistry2_3");
  const registry = await Registry.deploy(logicA.address);
  await registry.deployed();

  //------------------------------------------------------------------
  // 6. Registrar 2.3
  //------------------------------------------------------------------
  const Registrar = await ethers.getContractFactory("AutomationRegistrar2_3");
  const registrar = await Registrar.deploy(linkToken.address, registry.address);
  await registrar.deployed();

  await registrar.setRegistrationConfig({
    autoApproveConfigType: 2,
    autoApproveMaxAllowed: 1000,
    minLinkJuels: 0
  });

  //------------------------------------------------------------------
  // 7. Output JSON for Kurtosis extraction
  //------------------------------------------------------------------
  const output = {
    automationRegistry: registry.address,
    automationRegistrar: registrar.address,
    linkToken: linkToken.address,
    linkUsdFeed: linkUsdFeed.address,
    nativeUsdFeed: nativeUsdFeed.address,
    fastGasFeed: fastGasFeed.address,
    wrappedNativeToken: wrappedNative.address,
    forwarderLogic: forwarderLogic.address,
    chainModule: chainModule.address,
    logicC: logicC.address,
    logicB: logicB.address,
    logicA: logicA.address,
    //upkeepTranscoder: transcoder.address,
  };

  console.log("DEPLOYMENT_JSON_BEGIN");
  console.log(JSON.stringify(output, null, 2));
  console.log("DEPLOYMENT_JSON_END");
}

// Helper: deploy contract only if addr not provided / zero-address
async function deployIfMissing(name, addr, ...ctor) {
  if (addr && ethers.utils.isAddress(addr) && addr !== ethers.constants.AddressZero) {
    return { address: addr };
  }
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...ctor);
  await c.deployed();
  return c;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 