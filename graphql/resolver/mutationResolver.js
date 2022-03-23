const { VCIssuer } = require('../../vc-issuer')
const issuer = new VCIssuer()

module.exports = {
  RootMutation: {
    requestVerification: async (_, { did, username, type = 'bankVCs' }) => {
      console.log(`request verification type: ${type} by did: ${did}`);
      return issuer.createRequest({ did, type, subject: username })
    }

  }
}