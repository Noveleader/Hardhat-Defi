const { getNamedAccounts } = require("hardhat")
const AMOUNT = ethers.utils.parseEther("0.01")
async function getWeth() {
  const { deployer } = await getNamedAccounts()
  // call the "deposit" function on the weth contact
  // To call a contract you need: abi, contract address
  //0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

  //Get the IWeth contract ABI which is already compiled.
  //At the mainnet address connected to the deployer
  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    deployer
  )
  const tx = await iWeth.deposit({ value: AMOUNT })
  await tx.wait(1)
  const wethBalance = await iWeth.balanceOf(deployer)
  console.log(`Got ${wethBalance.toString()} Weth`)
}
module.exports = { getWeth, AMOUNT }
