const { ethers } = require('ethers');
const LandingPoolAbi = require('../growr-on-chain-smart-contracts/build/contracts/LendingPool.json').abi
const LandingPoolAddress = process.env.LANDING_POOL_ADDRESS
const userModel = require('../model/user')

let instance

// TODO MAKE IT WORK WITH VERIFICATION REGISTRY
// getLandingPool should go and become add verification
  
const RSKConnect = (host, key) => {
  const apiHost = host
  const apiKey = key
  let provider
  let LandingPool

  instance = {
    connectNetwork: async () => {
      provider = new ethers.providers.JsonRpcProvider('https://public-node.testnet.rsk.co', { name: 'rsk-testnet', chainId: 31 });
      LandingPool = new ethers.Contract(LandingPoolAddress.toLowerCase(), LandingPoolAbi, provider)
      return true
    },

    getLandingPool: async (wallet) => {
      const pools = await LandingPool.getPools()
      const landingPools = []
      pools.forEach(p => {
        const { poolId, minScore, maxScore, apr, maxAmount, riskType } = p
        const pool = Object.assign({ poolId, minScore, maxScore, apr, maxAmount, riskType })
        let decoded = {}
        Object.entries(pool).forEach(([k, v]) => {
          decoded[k] = v.toString()
        })
        landingPools.push(decoded)
      })
      const user = await userModel.findOne({ wallet })
      for (const pool of landingPools) {
        const score = Number.parseInt(user.score)
        const minScore = Number.parseInt(pool.minScore)
        const maxScore = Number.parseInt(pool.maxScore)
        if (score <= maxScore && score > (minScore - 1)) {
          return pool
        }
      }
      return false
    },
    checkBallanceMain: async () => {
      return
    },
  }

  return instance

}

module.exports = RSKConnect
