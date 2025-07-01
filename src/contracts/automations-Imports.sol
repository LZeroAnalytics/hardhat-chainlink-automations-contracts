// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/v2_3/AutomationRegistry2_3.sol";
import "@chainlink/contracts/src/v0.8/automation/v2_3/AutomationRegistrar2_3.sol";
import "@chainlink/contracts/src/v0.8/automation/v2_3/UpkeepTranscoder5_0.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationForwarder.sol";
import "@chainlink/contracts/src/v0.8/automation/testhelpers/LogUpkeepCounter.sol";
import "@chainlink/contracts/src/v0.8/automation/testhelpers/MockETHUSDAggregator.sol";
import "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";
import "@chainlink/contracts/src/v0.8/vendor/canonical-weth/WETH9.sol";


// Chain-specific modules
import "@chainlink/contracts/src/v0.8/automation/v2_3/ArbitrumModule.sol";
import "@chainlink/contracts/src/v0.8/automation/v2_3/OptimismModule.sol"; 
import "@chainlink/contracts/src/v0.8/automation/v2_3/ScrollModule.sol";
import "@chainlink/contracts/src/v0.8/automation/v2_3/ChainModuleBase.sol";

