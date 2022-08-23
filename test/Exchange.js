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
		token2 = await Token.deploy('MOCK DAI','MDAI', 1000000)

		accounts = await ethers.getSigners();
		deployer = accounts[0]
		feeAccount = accounts[1]
		user1 = accounts[2]
		user2 = accounts[3]

		let transaction = await token1.connect(deployer).transfer(user1.address,tokens(100))
		await transaction.wait()

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


		describe('Success', () => {
			beforeEach(async () => {
				// Approve token
				transaction = await token1.connect(user1).approve(exchange.address, amount)
				result = await transaction.wait()
				// Deposit token
				transaction = await exchange.connect(user1).depositToken(token1.address, amount)
				result = await transaction.wait()
			})
		
			it('tracks the token deposit', async () => {
				expect(await token1.balanceOf(exchange.address)).to.equal(amount)
				expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
				expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
			})

			it('emits a Deposit event', async () => {
				const event = result.events[1]
				expect(event.event).to.equal('Deposit')

				const args = event.args
				expect(args.token).to.equal(token1.address)
				expect(args.user).to.equal(user1.address)
				expect(args.amount).to.equal(amount)
				expect(args.balance).to.equal(amount)
			})
		})


		describe('failure', () => {
	      it('fails when no tokens are approved', async () => {
	        // Don't approve any tokens before depositing
	        await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
	      })
		})
	})

	describe('Withdraws tokens funds', () => {
		let transaction, result
		let amount = tokens(10)


		describe('Success', () => {
			beforeEach(async () => {
				// Approve token
				transaction = await token1.connect(user1).approve(exchange.address, amount)
				result = await transaction.wait()
				// Deposit token
				transaction = await exchange.connect(user1).depositToken(token1.address, amount)
				result = await transaction.wait()
				// Now withdraw tokens
				transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
				result = await transaction.wait()
			})
		
			it('withdraws token funds', async () => {
				expect(await token1.balanceOf(exchange.address)).to.equal(0)
				expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
				expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
			})

			it('emits a Withdraw event', async () => {
				const event = result.events[1]
				expect(event.event).to.equal('Withdraw')

				const args = event.args
				expect(args.token).to.equal(token1.address)
				expect(args.user).to.equal(user1.address)
				expect(args.amount).to.equal(amount)
				expect(args.balance).to.equal(0)
			})
		})


		describe('failure', () => {
	      it('fails for insufficient balance', async () => {
	        // Attempt to withdraw tokens without depositing
	        await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
	      })
		})
	})

	describe('Checking balances', () => {
		let transaction, result
		let amount = tokens(1)


		beforeEach(async () => {
			// Approve token
			transaction = await token1.connect(user1).approve(exchange.address, amount)
			result = await transaction.wait()
			// Deposit token
			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()
		})
	
		it('returns user balance', async () => {
			expect(await token1.balanceOf(exchange.address)).to.equal(amount)
		})
	})

	describe('Making Orders', async () => {
		let transaction, result

		let amount = tokens(1)

		describe('Success', async () => {
			beforeEach(async () => {


				// Approve token
				transaction = await token1.connect(user1).approve(exchange.address, amount)
				result = await transaction.wait()
				// Deposit token
				transaction = await exchange.connect(user1).depositToken(token1.address, amount)
				result = await transaction.wait()

				// Make Order
				transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
				result = await transaction.wait()
			})
		
			it('tracks the newly created order', async () => {
				expect(await exchange.orderCount()).to.equal(1)
			})

			it('emits an Order event', async () => {
				const event = result.events[0]
				expect(event.event).to.equal('Order')

				const args = event.args
				expect(args.id).to.equal(1)
				expect(args.user).to.equal(user1.address)
				expect(args.tokenGet).to.equal(token2.address)
				expect(args.amountGet).to.equal(tokens(1))
				expect(args.tokenGive).to.equal(token1.address)
				expect(args.amountGive).to.equal(tokens(1))
				expect(args.timestamp).to.at.least(1)
			})

		})

		describe('failure', async () => {
			it('Rejects orders with no balance', async () => {
        await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
			})
		})
	})

	describe('Orders Actions', async () => {
	    let transaction, result
	    let amount = tokens(1)

	    beforeEach( async () => {
			transaction = await token1.connect(user1).approve(exchange.address, amount)
			result = await transaction.wait()

			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()

			// Give Tokens to user 2
			transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
			result = await transaction.wait()

			transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
			result = await transaction.wait()

			transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
			result = await transaction.wait()

			// make order
			transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
			result = await transaction.wait()
	    })


	    describe('Cancelling orders', async () => {
			describe('Success', async () => {
				beforeEach(async () => {
				  transaction = await exchange.connect(user1).cancelOrder(1)
				  result = await transaction.wait()
				})

				it('updates cancelled orders', async () => {
				  expect(await exchange.orderCancelled(1)).to.be.equal(true)
				})

				it('emits an Order event', async () => {
					const event = result.events[0]
					expect(event.event).to.equal('Cancel')

					const args = event.args
					expect(args.id).to.equal(1)
					expect(args.user).to.equal(user1.address)
					expect(args.tokenGet).to.equal(token2.address)
					expect(args.amountGet).to.equal(tokens(1))
					expect(args.tokenGive).to.equal(token1.address)
					expect(args.amountGive).to.equal(tokens(1))
					expect(args.timestamp).to.at.least(1)
				})
			})  

			describe('Failure', async () => {
				beforeEach(async () => {
					transaction = await token1.connect(user1).approve(exchange.address, amount)
					result = await transaction.wait()

					transaction = await exchange.connect(user1).depositToken(token1.address, amount)
					result = await transaction.wait()

					transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
					result = await transaction.wait()
				})

				it("Rejects invalid order ids", async () => {
					const invalidOrder = 9999
				    await expect(exchange.connect(user1).cancelOrder(invalidOrder)).to.be.reverted
				})

				it("Rejects unauthorized cancelations", async () => {
				    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
				})
			})
		})

		describe('Filling orders', async () => {
			beforeEach(async () => {
				transaction = await exchange.connect(user2).cancelOrder(1)
			  	result = await transaction.wait()
			})

			it('Executes the trande and charge fees', async () => {
				// Token Give Check Balance
				expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(tokens(0))
				expect(await exchange.balanceOf(token1.address,user2.address)).to.equal(tokens(1))
				expect(await exchange.balanceOf(token1.address,feeAccount.address)).to.equal(tokens(0))

				// token Get Check Balance
				expect(await exchange.balanceOf(token2.address,user1.address)).to.equal(tokens(1))
				expect(await exchange.balanceOf(token2.address,user2.address)).to.equal(tokens(0.9))
				expect(await exchange.balanceOf(token2.address,feeAccount.address)).to.equal(tokens(0.1))
			})

		})
    })
})
