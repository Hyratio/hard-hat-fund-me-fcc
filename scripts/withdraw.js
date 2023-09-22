const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe")
    console.log("FUuuunding bitch..")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it bitch")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
