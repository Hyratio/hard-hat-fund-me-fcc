const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let FundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.parseEther("1") //1 ETH (1e18 Wei)
    beforeEach(async () => {
        //deploy our FundMe contract using hardhat deploy
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer

        await deployments.fixture(["all"]) //deploys everything from the deploy folder with the tag we choose
        const signer = await ethers.getSigner(deployer)
        const contracts = await deployments.fixture(["all"])
        const fundMeAddress = contracts["FundMe"].address
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer)
        mockV3Aggregator = contracts["MockV3Aggregator"]
    })

    describe("constructor", async function () {
        it("Sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getpriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!",
            )
        })
        it("update the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getaddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
            //we it need it string cos the number is in 'Wei'
            // and JS can't handle it well
        })
        it("Adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getfunder(0)
            assert.equal(funder, deployer)
        })
        describe("withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue })
            })
            it("withdraw ETH from a single founder", async function () {
                //Arrange
                const startingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const startingDeployerBalance =
                    await ethers.provider.getBalance(deployer)
                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                //On VS you can put a "BREAKPOINT" the code stops there to debug
                // and you can see all the variables defined till that point
                // so we found out all the component of transactionReceipt
                //  so we can extrapolate GAS used
                //We can also use CONSOLE.LOG to see the variables

                const { gasUsed, gasPrice } = transactionReceipt
                //the variable within the brakets are extrapolated from transactionReceipt

                const gasCost = gasUsed * gasPrice

                const endingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const endingDeployerBalance =
                    await ethers.provider.getBalance(deployer)
                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    endingDeployerBalance + gasCost,

                    startingFundMeBalance + startingDeployerBalance,
                )
            })
            it("allows us to withdraw with multiple funders", async () => {
                //Arrange
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i],
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const startingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                const { gasUsed, gasPrice } = transactionReceipt
                const gasCost = gasUsed * gasPrice

                const endingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const endingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    endingDeployerBalance + gasCost,

                    startingFundMeBalance + startingDeployerBalance,
                )
                //we have to see also if the the getfunder are reset properlu
                await expect(fundMe.getfunder(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getaddressToAmountFunded(
                            accounts[i].address,
                        ),
                        0,
                    )
                }
            })

            it("only allows owner to withdraw", async () => {
                const accounts = await ethers.getSigners()
                const attackerConnectedContract = await fundMe.connect(
                    accounts[1],
                )
                await expect(
                    attackerConnectedContract.withdraw(),
                ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
            })

            it("cheaperWithdraw test", async () => {
                //Arrange
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i],
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const startingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                const { gasUsed, gasPrice } = transactionReceipt
                const gasCost = gasUsed * gasPrice

                const endingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.getAddress(),
                )
                const endingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    endingDeployerBalance + gasCost,

                    startingFundMeBalance + startingDeployerBalance,
                )
                //we have to see also if the the getfunder are reset properlu
                await expect(fundMe.getfunder(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getaddressToAmountFunded(
                            accounts[i].address,
                        ),
                        0,
                    )
                }
            })
        })
    })
})
