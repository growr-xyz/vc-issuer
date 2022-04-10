const FinastraConnection = require('../../bank-api/operations');
// const FinastraConnection = require('../../bank-api/finastra')
const { verifyDid } = require('../../vc-issuer/ecrecover')
const { getAccountFromDID } = require('../../vc-issuer/did')
const CryptoJS = require('crypto-js')

const verificationRequest = require('../../model/verificationRequest');

const { VCIssuer, allowedTypes, finastraTypes } = require('../../vc-issuer')
const issuer = new VCIssuer()

const vcTemplates = require('../../vc-issuer/vc')


const validateDidSignature = (did, salt, message) => {
  return Promise.resolve(true) // comment when debugging backend only
  // const signer = verifyDid(salt, message)
  // if (getAccountFromDID(did) !== signer.toLowerCase()) {
  //   throw new Error('Invalid signature')
  // }
}

const getVC = async (userData, did, type) => {
  if (!allowedTypes.includes(type)) throw new Error('VC type not supported')
  if (type === 'bankVCs') {
    const vcs = finastraTypes.map(async type => getVC(userData, did, type))
    return await Promise.all(vcs)
  }
  return issuer.issueVC(did, userData[type], type, typeTemplateMap[type])
}

const decodePassword = (salt, parameters) => {
  return bytes = CryptoJS.AES.decrypt(parameters, salt).toString(CryptoJS.enc.Utf8);
}

const typeTemplateMap = {
  dateOfBirth: vcTemplates.createDoBCredentialPayload,
  relationshipStatus: vcTemplates.createRelationshipStatusCredentialPayload,
  dependants: vcTemplates.createDependantsCredentialPayload,
  employmentStatus: vcTemplates.createEmploymentStatusCredentialPayload,
  highestEducationAttained: vcTemplates.createHighestEducationAttainedCredentialPayload,
  kycStatus: vcTemplates.createKYCStatusCredentialPayload,
  citizenship: vcTemplates.createCitizenshipCredentialPayload,
  age: vcTemplates.createAgeCredentialPayload,
  averageMonthlyIncome: vcTemplates.createAverageMonthlyIncomeCredentialPayload,
  averageMonthlyRest: vcTemplates.createAverageMonthlyRestCredentialPayload,
  savingPercentage: vcTemplates.createSavingPercentageCredentialPayload,
  bankVCs: getVC,
}

// TODO refactor VC code in the issuer!!!
module.exports = {
  RootQuery: {
    bankVC: async (_, { did, message, type, parameters }) => {
      console.log(`=== Get VC type ${type} requested by ${did}`)
      try {
        const req = await verificationRequest.findOne({ did, type })
        if (!req || Object.entries(req).length === 0) throw new Error('Missing or expired request')
        await validateDidSignature(did, req.salt, message)
        console.log(`* did ${did} validated`)
        const token = decodePassword(req.salt, parameters)
        const finastra = FinastraConnection()
        console.log(`* bank connection successful`)
        await finastra.setToken(token)
        await finastra.getConsumer()
        const accounts = await finastra.getUserAccounts()
        const transferHistory = await finastra.getUserTransferHistory(accounts[0])
        const userData = finastra.getCredentialsForMainAccount(transferHistory)
        console.log(`* user ${did} data received`)
        const vc = getVC(userData, did, req.type)
        console.log(`* vc created ${vc}`)
        return vc
      } catch (error) {
        return error;
      }
    }
  }
}
