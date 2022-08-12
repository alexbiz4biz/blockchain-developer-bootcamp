const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
} 

describe('Exchange', () => {
	let deployer, feeAccount, exchange

	const feePercent = 10
	
	beforeEach(async () => {
		const Exchange = await ethers.getContractFactory('Exchange')
		const Token = await ethers.getContractFactory('Token')

		token1 = await Token.deploy('DIGIT-AL GOLD','ALGOLD', 1000000)

		accounts = await ethers.getSigners();
		deployer = accounts[0]
		feeAccount = accounts[1]

		const Exchange = await ethers.getContractFactory('Exchange')
		exchange = await Exchange.deploy(feeAccount.address, feePercent)

	})

	describe('Deployment', () => {

		it('tracks the fee account', async () => {
			expect(await exchange.feeAccount()).to.equal(feeAccount.address)
		})

		it('tracks the fee percent', async () => {
			expect(await exchange.feePercent()).to.equal(feePercent)
		})

	})

	describe('Depositing Tokens', () => {
		let transaction, result
		let amount = tokens(10)

		beforeEach(async () => {
			// Approve token
			transaction = await exchange.connect(token1).depositToken(token1.address, amount)
			result = await transaction.wait()

			// Deposit token

		})
	
		describe('success', () => {
			it('tracks the token deposit', async () => {
				expect(await token1.balanceOf(exchange.address)).to.equal(amount)
			})


		})

		it('tracks the fee percent', async () => {
			expect(await exchange.feePercent()).to.equal(feePercent)
		})

	})

})
