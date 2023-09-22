//import
//manin function                 It's not going to be like this with HARDHAT DEPLOY
// calling of main function

// function deployFunc(hre) {             |
//     console.log("Hi!")                 |
// }                                      |   It's will be similar to this but with some more details
//                                        |
// module.exports.default = deployFunc    |

/* this uses an ANONYMOUS function. ARROW FUNCTION 'hre' = 'hardhat runtime enviroment' */
// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre  /*it's like writing hre.getNamedAccounts , hre.deployments */
// }

const {
    //single line
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config") /*brakets extrapolate the networkConfig out of the entire file*/
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()

// this can be synthetised in:
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId //what happens when we want to change chain?

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    //when going fr localhost or hardhat network we want to use a MOCK!
    //if the contract doesn't exist, we deploy a minimal version for our local testing
    log("Deploying FundMe and waiting for confirmations...")

    const FundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], //put price feed address here
        log: true,
        waitConfirmation: network.config.blockconfirmations || 1,
    })
    log("---------------1--")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(FundMe.address, [ethUsdPriceFeedAddress])
    }
    log("-.-.-.-.-.-.-")
}
module.exports.tags = ["all"]
