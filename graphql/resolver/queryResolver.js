const FinastraConnection = require('../../bank-api/operations');
// const FinastraConnection = require('../../bank-api/finastra')
const { verifyDid } = require('../../vc-issuer/ecrecover')
const { getAccountFromDID } = require('../../vc-issuer/did')
const CryptoJS = require('crypto-js')

const verificationRequest = require('../../model/verificationRequest');

const { VCIssuer, allowedTypes, finastraTypes } = require('../../vc-issuer')
const issuer = new VCIssuer()

const vcTemplates = require('../../vc-issuer/vc')

const { tracer, startChildSpan } = require('../../instrumentation-setup')

const validateDidSignature = (did, salt, message, span) => {
  return Promise.resolve(true) // comment when debugging backend only

  // const signer = verifyDid(salt, message)
  // if (getAccountFromDID(did) !== signer.toLowerCase()) {
  //   throw new Error('Invalid signature')
  // }
}

const getVC = async (userData, did, type, parentSpan) => {
  const span = startChildSpan('getVC', parentSpan)
  span.setAttribute('type', type)
  if (!allowedTypes.includes(type)) throw new Error('VC type not supported')
  if (type === 'bankVCs') {
    const vcs = finastraTypes.map(async type => getVC(userData, did, type, span))
    const all = Promise.all(vcs)
    span.end()
    return all
  }
  const res = issuer.issueVC(did, userData[type], type, typeTemplateMap[type], span)
  span.end()
  return res
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
  hasKYC: vcTemplates.createHasKYCCredentialPayload,
  citizenship: vcTemplates.createCitizenshipCredentialPayload,
  age: vcTemplates.createAgeCredentialPayload,
  avgMonthlyIncome: vcTemplates.createAvgMonthlyIncomeCredentialPayload,
  avgMonthlyRest: vcTemplates.createAvgMonthlyRestCredentialPayload,
  savingPercent: vcTemplates.createSavingPercentCredentialPayload,
  bankVCs: getVC,
}

// TODO refactor VC code in the issuer!!!
module.exports = {
  RootQuery: {
    bankVC: async (_, { did, message, type, parameters }) => {
      const parentSpan = tracer.startSpan('bankVC')
      console.log(`=== Get VC type ${type} requested by ${did}`)
      parentSpan.setAttribute('type', type)
      parentSpan.setAttribute('did', did)
      try {
        const req = await verificationRequest.findOne({ did, type })
        if (!req || Object.entries(req).length === 0) throw new Error('Missing or expired request')
        await validateDidSignature(did, req.salt, message, parentSpan)
        console.log(`* did ${did} validated`)
        parentSpan.addEvent('decodePassword_start')
        const token = decodePassword(req.salt, parameters)
        parentSpan.addEvent('decodePassword_end')
        parentSpan.addEvent('Finastra_data_start')
        const finastra = FinastraConnection()
        console.log(`* bank connection successful`)
        await finastra.setToken(token)
        await finastra.getConsumer()
        const accounts = await finastra.getUserAccounts()
        const transferHistory = await finastra.getUserTransferHistory(accounts[0])
        const userData = finastra.getCredentialsForMainAccount(transferHistory)
        console.log(`* user ${did} data received`)
        parentSpan.addEvent('Finastra_data_start')
        const vc = getVC(userData, did, req.type, parentSpan)
        console.log(`* vc created ${vc}`)
        parentSpan.end()
        return vc
      } catch (error) {
        parentSpan.end()
        return error;
      }
    }
  }
}
