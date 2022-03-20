const BankConnection = require('../../bank-api/operations');
const { VCIssuer } = require('../../vc-issuer')

const issuer = new VCIssuer('BANK_VC', 'bankVC')

module.exports = {
  RootMutation: {
    connectBank: async (_, { username, password, wallet }) => {
      console.log('connect bank ================', username);
      const bankConnection = BankConnection('https://obp-apisandbox.bancohipotecario.com.sv', '51wy4o0kvghivbbgbkmmfgmpb4nlu2x0qpdgagoj')
      const response = await bankConnection.login(username, password)
      await bankConnection.getCustomers(wallet)
      return response
    },

    requestVerification: async (_, { did, username, type = 'bankVC' }) => {
      console.log(`request verification type: ${type} by did: ${did}`);
      return issuer.createRequest({ did, type: issuer.credentialType, subject: username })
    }

  }
}