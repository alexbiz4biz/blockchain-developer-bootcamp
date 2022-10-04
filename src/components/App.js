import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import config from '../config.json'

import { 
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents
} from '../store/interactions'

import Navbar from './Navbar'
import Markets from './Markets'
import Balance from './Balance'
import Order from './Order'
import OrderBook from './OrderBook'

function App() {

  const dispatch = useDispatch()

  const loadBlockchainData = async () => {

    const provider = loadProvider(dispatch)

    // Fetch Chain ID
    const chainId = await loadNetwork(provider, dispatch)

    // reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    window.ethereum.on('accountsChanged', () => {
      console.log('Account changed')
      loadAccount(provider, dispatch)
    })

    // Token Smart Contract
    const DApp = config[chainId].DApp
    const mETH = config[chainId].mETH
    await loadTokens(provider, [DApp.address, mETH.address], dispatch)

    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    loadAllOrders(provider, exchange, dispatch)
    
    subscribeToEvents(exchange, dispatch)

  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Order />

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          <OrderBook />

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
