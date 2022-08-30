
async function main() {
  console.log(`Preparing Deployment ... >>>:\n`)


  // Fetch contract to deploy
  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")

  const accounts = await ethers.getSigners()

console.log(`Accounts Fetched ... >>>:\n`)
console.log(`accounts[0].address ... >>>: ${accounts[0].address}\n`)
console.log(`accounts[1].address ... >>>: ${accounts[1].address}\n`)
  // Deploy contract
  const dapp = await Token.deploy('Dapp University', 'DAPP', 100000)
  await dapp.deployed()
  console.log(`Dapp Deployed to >>>: ${dapp.address}`)

  const mETH = await Token.deploy('mETH', 'mETH', 100000)
  await mETH.deployed()
  console.log(`mETH Deployed to >>>: ${mETH.address}`)

  const mDAI = await Token.deploy('mDAI', 'mDAI', 100000)
  await mDAI.deployed()
  console.log(`mDAI Deployed to >>>: ${mDAI.address}`)

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange Deployed to >>>: ${exchange.address}`)

}

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
