const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    // const fundMeAddress = contracts["FundMe"].address
    console.log("Funding your mdfucking contract")
    const fundMe = await ethers.getContract("FundMe")
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("FUNDED")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
