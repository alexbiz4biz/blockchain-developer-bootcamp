import { createSelector } from 'reselect'
import { get, groupBy, reject, maxBy, minBy } from 'lodash'
// Used for DATE TIME FORMATTING
import moment from 'moment'
import { ethers } from 'ethers'

const GREEN = '#25CE8F'
const RED = '#F45353'

const tokens = state => get(state, 'tokens.contracts')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const openOrders = state => {
	const all = allOrders(state)
	const filled = filledOrders(state)
	const cancelled = cancelledOrders(state)

	const openOrders = reject(all, (order) => {
		const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
		const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())
		return(orderFilled || orderCancelled)
	})

	return openOrders
}

const decorateOrder = (order, tokens) => {
	let token0Amount, token1Amount

	// Note: DApp should be considered token0, mETH is considered token1
	// Example: Giving mETH in exchange for DApp
	if (order.tokenGive === tokens[0].address) {
		token0Amount = order.amountGive // The amount of DApp we are giving
		token1Amount = order.amountGet // The amount of mETH we want
	} else {
		token0Amount = order.amountGet // The amount of DApp we want
		token1Amount = order.amountGive // the amount of mETH we are giving
	}

	const precision = 100000
	let tokenPrice = (token0Amount / token1Amount)
	tokenPrice = Math.round(tokenPrice * precision) / precision

	return({
		...order,
		token0Amount: ethers.utils.formatUnits(token0Amount, 'ether'),
		token1Amount: ethers.utils.formatUnits(token1Amount, 'ether'),
		tokenPrice,
		formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D YYYY')
	})
}

 
// *** ORDER BOOK SELECTOR *** ORDER BOOK SELECTOR *** ORDER BOOK SELECTOR 
export const orderBookSelector = createSelector(
	openOrders,
	tokens,
	(orders, tokens) => {

		if ( !tokens[0] || !tokens[1] ) { return } 

		// Filter orders by selected token
		orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address )
		orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address )

		// Decorate Orders
		orders = decorateOrderBookOrders(orders, tokens)
		// Group orders by orderType
		orders = groupBy(orders, 'orderType')
		// Fetch buy Orders
		const buyOrders = get(orders, 'buy', [])
		
		orders = {
			...orders,
			buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
		}

		const sellOrders = get(orders, 'sell', [])

		orders = {
			...orders,
			sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
		}

	return orders
	}
)

const decorateOrderBookOrders = (orders, tokens) => {
	return(
		orders.map((order) => {
			order = decorateOrder(order, tokens)
			order = decorateOrderBookOrder(order, tokens)
			return(order)
		})
	)
}


const decorateOrderBookOrder = (order, tokens) => {
	const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

	return({
		...order,
		orderType,
		orderTypeClass: (orderType === 'buy' ? GREEN : RED),
		orderFillAction: (orderType === 'buy' ? 'sell' : 'buy'), 
	})
}


// *** PRICE CHART *** PRICE CHART *** PRICE CHART 

export const priceChartSelector = createSelector(
	filledOrders,
	tokens,
	(orders, tokens) => {

		if ( !tokens[0] || !tokens[1] ) { return } 

		// Filter orders by selected token
		orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address )
		orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address )

		orders = orders.sort((a,b) => a.timestamp - b.timestamp)

		orders = orders.map((o) => decorateOrder(o, tokens))

		let secondLastOrder, lastOrder
		[secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
		
		const lastPrice = get(lastOrder, 'tokenPrice', 0)

		const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

		return({
			lastPrice,
			lastPriceChage: (lastPrice >= secondLastPrice ? '+' : '-'),
			series: [{
				data: buildGraphData(orders)
			}]
		})
	}
)


const buildGraphData = (orders) => {

	orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())

	const hours = Object.keys(orders)

	const graphData = hours.map((hour) => {
		// Fetch all orders from current hour
		const group = orders[hour]

		// calculate prices: open, high, low, close
		const open = group[0]
		const high = maxBy(group, 'tokenPrice')
		const low = minBy(group, 'tokenPrice')
		const close = group[group.length - 1]

		return ({
			x: new Date(hour),
			y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
		})
	})

	return graphData
}
