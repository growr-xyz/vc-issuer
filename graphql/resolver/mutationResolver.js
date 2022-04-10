const { VCIssuer } = require('../../vc-issuer')
const { GrowrRiskAssesor } = require('../../risk-assesor')

const issuer = new VCIssuer()


module.exports = {
  RootMutation: {
    requestVerification: async (_, { did, username, type = 'bankVCs' }) => {
      console.log(`=== Request verification type: ${type} by did: ${did}`)
      return issuer.createRequest({ did, type, subject: username })
    },

    verifyVCs: async (_, { did, vps, pondAddress }) => {
      try {
        const riskAssesor = await GrowrRiskAssesor.getInstance()

        console.log(`=== Verify credentials for pond ${pondAddress} started by ${did}`)
        const userCredentials = await riskAssesor.getCredentials(did, vps)
        const verified = await riskAssesor.verifyCredentials(pondAddress, userCredentials)
        if (!verified) {
          throw new Error('User credentials does not match pond criteria')
        }
        await riskAssesor.registerVerification(did, pondAddress)
        console.log(`* access granted`)
        return true
      } catch (e) {
        throw e
      }
    }

  }
}
