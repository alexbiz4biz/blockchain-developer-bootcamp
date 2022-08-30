
const config = require('../src/config.json')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}


async function main() {
	// Fetch accounts
	const accounts = await ethers.getSigners()


	const { chainId } = await ethers.provider.getNetwork()
	console.log("Using chainId: ", chainId)

	const DApp = await ethers.getContractAt('Token', config[chainId].DApp.address)
	console.log(`DApp Token fetched: ${DApp.address}`)

	const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
	console.log(`mETH Token fetched: ${mETH.address}`)

	const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
	console.log(`mDAI Token fetched: ${mDAI.address}`)

	const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
	console.log(`exchange fetched: ${exchange.address}`)

	// Set up accounts
	const sender = accounts[0]
	const receiver = accounts[1]
	let amount = tokens(10000)

	console.log(`sender is: ${sender.address}`)
	console.log(`receiver is: ${receiver.address}`)


	// User 1 Transfers 10K mETH
	let transaction, result
	transaction = await mETH.connect(sender).transfer(receiver.address, amount)
	console.log(`sender transferred ${amount} tokens from ${sender.address} to receiver ${receiver.address} \n`)

	const user1 = accounts[0]
	const user2 = accounts[1]

	console.log(`user1 is: ${sender.address}`)
	console.log(`user2 is: ${receiver.address}`)

	// User1 approves 10000 DApp
	transaction = await DApp.connect(user1).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`user1 Approved ${amount} tokens from ${user1.address} to Exch: ${exchange.address} \n`)

	// User1 deposits 10000 DApp
	transaction = await exchange.connect(user1).depositToken(DApp.address, amount)
	await transaction.wait()
	console.log(`User1 Deposited ${amount} tokens from ${user1.address} to DApp: ${DApp.address} \n`)

	// User2 approves mETH
	transaction = await mETH.connect(user2).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`user2 Approved ${amount} tokens from ${user2.address} to Exch: ${exchange.address} \n`)

	// User2 deposits mETH
	transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
	await transaction.wait()
	console.log(`user2 Deposited ${amount} tokens from ${user2.address} to mETH: ${mETH.address} \n`)

	
	//////////////////////////////////////////////////////////////////////////////////////////////
	// Seed a cancelled Order

	// User 1 Makes order to get tokens
	let orderId
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(5))
	result = await transaction.wait()
	console.log(`Made order from User1: ${user1.address} \n`)
	
	// User 1 Cancels Order
	orderId = result.events[0].args.id
	console.log(`orderId is : ${orderId} \n`)
	transaction = await exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log(`Cancelled order from User1: ${user1.address} \n`)

	// Wait 1 second
	await wait(1)

	
	//////////////////////////////////////////////////////////////////////////////////////////////
	// Seed a filled Order

	// User 1 Makes order
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(10))
	result = await transaction.wait()
	console.log(`Made order from User1: ${user1.address} \n`)

	// User 2 Fills Order
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from User1: ${user1.address} \n`)

	// Wait 1 second
	await wait(1)

	// User 1 Makes another order
	transaction = await exchange.makeOrder(mETH.address, tokens(50), DApp.address, tokens(15))
	result = await transaction.wait()
	console.log(`Made another order from User1: ${user1.address} \n`)

	// User 2 Fills another Order
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled another order from User1: ${user1.address} \n`)

	// Wait 1 second
	await wait(1)

	// User 1 Makes final order
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), DApp.address, tokens(20))
	result = await transaction.wait()
	console.log(`Made final order from User1: ${user1.address} \n`)

	// User 2 Fills final Order
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled final order from User1: ${user1.address} \n`)

	// Wait 1 second
	await wait(1)


	//////////////////////////////////////////////////////////////////////////////////////////////
	// Seed open Order

	// User1 Makes 10 Orders
	for (let i = 1; i <= 10; i++){
		transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), DApp.address, tokens(10))
		result = await transaction.wait()
		console.log(`Made order from User1: ${user1.address} \n`)
	}

	// User2 Makes 10 Orders
	for (let i = 1; i <= 10; i++){
		transaction = await exchange.connect(user2).makeOrder(DApp.address, tokens(10), mETH.address, tokens(10 * i))
		result = await transaction.wait()
		console.log(`Made order from User2: ${user2.address} \n`)

		// Wait 1 second
		await wait(1)
	}

}

// main()
// 	.then(() ==> process.exit(0))
// 	.catch((error) => {
// 		console.error(error);
// 		process.exit(1);
// 	});

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
