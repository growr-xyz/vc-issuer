// const userModel = require('../../model/user');
// const walletModel = require('../../model/verificationRequest');
// const goalModel = require('../../model/goal');
// const loanModel = require('../../model/loan');
// const RSKConnect = require('../../web3-api/operations')
const BankConnection = require('../../bank-api/operations');

const { verifyDid } = require('../../vc-issuer/ecrecover')
const { getAccountFromDID } = require('../../vc-issuer/did')
const CryptoJS = require('crypto-js')

const verificationRequest = require('../../model/verificationRequest');

const validateDidSignature = (did, salt, message) => {
  return Promise.resolve(true)
  // TODO un-comment when we have front-end
  const signer = verifyDid(salt, message)
  if (getAccountFromDID(did) !== signer.toLowerCase()) {
    throw new Error('Invalid signature')
  }
}

const decodePassword = (salt, parameters) => {
  return bytes = CryptoJS.AES.decrypt(parameters, salt).toString(CryptoJS.enc.Utf8);;
}

module.exports = {
  RootQuery: {
    bankVC: async (_, { did, message, parameters }) => {
      try {
        const req = await verificationRequest.findOne({ did })
        // verify expiration date - not implemented yet
        await validateDidSignature(did, req.salt, message)
        const password = decodePassword(req.salt, parameters)
        const bankConnection = BankConnection('https://obp-apisandbox.bancohipotecario.com.sv', '51wy4o0kvghivbbgbkmmfgmpb4nlu2x0qpdgagoj')
        const response = await bankConnection.login(req.subject, password)
        await bankConnection.getCustomers()
        return "great success"
      } catch (error) {
        return error;
      }
    },
  },

  // getFinHealthVCs

}
