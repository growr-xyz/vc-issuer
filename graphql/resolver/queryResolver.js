// const RSKConnect = require('../../web3-api/operations')
const BankConnection = require('../../bank-api/operations');

const { verifyDid } = require('../../vc-issuer/ecrecover')
const { getAccountFromDID } = require('../../vc-issuer/did')
const CryptoJS = require('crypto-js')

const verificationRequest = require('../../model/verificationRequest');

const allowedTypes = ['dateOfBirth', 'relationshipStatus', 'dependants', 'education', 'employmentStatus', 'highestEducationAttained', 'kycStatus', 'bankVCs']

const { VCIssuer } = require('../../vc-issuer')
const issuer = new VCIssuer()

const vcTemplates = require('../../vc-issuer/vc')


const validateDidSignature = (did, salt, message) => {
  return Promise.resolve(true)
  // TODO un-comment when we have front-end
  const signer = verifyDid(salt, message)
  if (getAccountFromDID(did) !== signer.toLowerCase()) {
    throw new Error('Invalid signature')
  }
}

const getAllVCs = (userData, did) => {

}

const typeTemplateMap = {
  dateOfBirth: vcTemplates.createDoBCredentialPayload,
  relationshipStatus: vcTemplates.createRelationshipStatusCredentialPayload,
  dependants: vcTemplates.createDependantsCredentialPayload,
  employmentStatus: vcTemplates.createEmploymentStatusCredentialPayload,
  highestEducationAttained: vcTemplates.createHighestEducationAttainedCredentialPayload,
  kycStatus: vcTemplates.createKYCStatusCredentialPayload,
  bankVCs: getAllVCs,
}

const userDataTypeMap = {
  dateOfBirth: 'dateOfBirth',
  relationshipStatus: 'relationshipStatus',
  dependants: 'dependants',
  employmentStatus: 'employmentStatus',
  highestEducationAttained: 'highestEducationAttained',
  kycStatus: 'kycStatus'
}

const getVC = async (userData, did, type) => {
  if (!allowedTypes.includes(type)) throw new Error('VC type not supported')
  return issuer.issueVC(did, userData[type], type, typeTemplateMap[type])
}

const decodePassword = (salt, parameters) => {
  return bytes = CryptoJS.AES.decrypt(parameters, salt).toString(CryptoJS.enc.Utf8);;
}

module.exports = {
  RootQuery: {
    bankVC: async (_, { did, message, type, parameters }) => {
      try {
        const req = await verificationRequest.findOne({ did, type })
        if (Object.entries(req).length === 0) throw new Error('Missing or expired request')
        await validateDidSignature(did, req.salt, message)
        const password = decodePassword(req.salt, parameters)
        const bankConnection = BankConnection('https://obp-apisandbox.bancohipotecario.com.sv', '51wy4o0kvghivbbgbkmmfgmpb4nlu2x0qpdgagoj')
        await bankConnection.login(req.subject, password)
        const userData = await bankConnection.getCustomers()
        return getVC(userData, did, req.type)
      } catch (error) {
        return error;
      }
    },
  },
}
