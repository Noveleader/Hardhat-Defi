const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { getContractAddress, accessListify } = require("ethers/lib/utils")
require("dotenv").config()
async function main() {
  //The protocol treats everything as an ERC20 token - the WETH
  await getWeth()
  const { deployer } = await getNamedAccounts()
  //To interact with aave protocol, what do we need?
  //ABI, contract address, signer
  const lendingPool = await getLendingPool(deployer)
  const daiAddress = process.env.DAI_ADDRESS //DAI token address
  console.log(`Lending Pool Address ${lendingPool.address}`)

  //deposit our collateral
  const wethTokenAddress = process.env.WETH_ADDRESS

  //approve
  await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
  console.log("Depositing....")
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
  console.log("Deposited!!")

  //Borrow
  /* 
  1. How much we have borrowed
  2. How much we have in collateral
  3. How much we can borrow
  So if the health factor goes below 1, time to liquidate 📉
  */

  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  )

  //Get the price of DAI
  const daiPrice = await getDaiPrice()
  const amountDaiToBorrow = //this will give us the DAI amount we can borrow
    availableBorrowsETH.toNumber() * 0.95 * (1 / daiPrice.toNumber())
  //We can borrow max of 95% of our collateral
  console.log(`You can borrow ${amountDaiToBorrow} DAI`)
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  )

  //BORROW TIME
  await borrowDAI(daiAddress, lendingPool, amountDaiToBorrowWei, deployer)
  await getBorrowUserData(lendingPool, deployer)
  await repay(amountDaiToBorrowWei, daiAddress, lendingPool, deployer)
}
async function repay(amount, daiAddress, lendingPool, account) {
  await approveERC20(daiAddress, lendingPool.address, amount, account) //We need to approve sending back the DAI
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
}
async function borrowDAI(
  daiAddress,
  lendingPool,
  amountDaiToBorrowWei,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    1,
    0,
    account
  ) //Here 1 represent stable interest mode and 0 represents referral code
  await borrowTx.wait(1)
  console.log("Borrowed!!")
}
async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    process.env.DAI_TO_ETH
  ) //Since we are just reading we don't need a signer account

  const price = (await daiEthPriceFeed.latestRoundData())[1]
  console.log(`DAI/ETH price is ${price.toString()}`)
  return price
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account)

  console.log(`You have ${totalCollateralETH} worth of collateral`)
  console.log(`You have ${totalDebtETH} worth of debt`)
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH`)
  return { availableBorrowsETH, totalDebtETH }
}
async function getLendingPool(account) {
  const lendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    process.env.LENDING_POOL_ADDRESS_PROVIDER_V2,
    account
  )
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  )
  return lendingPool
}

async function approveERC20( //approving the contract to interact with our ERC20 tokens
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
  const tx = await erc20Token.approve(spenderAddress, amountToSpend)
  await tx.wait(1)
  console.log("Approved!!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
