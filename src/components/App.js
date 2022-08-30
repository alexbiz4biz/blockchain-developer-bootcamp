import { useEffect } from 'react'
import { ethers } from 'ethers'
import TOKEN_ABI from '../abis/Token.json'
import '../App.css';
import config from '../config.json';


function App() {

  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({method: "eth_requestAccounts"})
    console.log(accounts[0])

    // Connect ethers to blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const { chainId } = await provider.getNetwork()
    console.log("chainId: ", chainId)
    console.log("config: ", config)
    console.log("config[chainId]: ", config[chainId])


    // Token Smart Contract
    const token = await new ethers.Contract( config[chainId].DApp.address , TOKEN_ABI , provider )
    console.log("DApp address: ", token.address)
    const symbol = await  token.symbol()
    console.log("DApp symbol: ", symbol)

  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      {/* Navbar */}

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
