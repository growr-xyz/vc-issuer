const BankConnection = require('../../bank-api/operations');

const { verifyDid } = require('../../vc-issuer/ecrecover')
const { getAccountFromDID } = require('../../vc-issuer/did')
const CryptoJS = require('crypto-js')

const verificationRequest = require('../../model/verificationRequest');

const allowedTypes = ['citizenship', 'dateOfBirth', 'relationshipStatus', 'dependants', 'education', 'employmentStatus', 'highestEducationAttained', 'kycStatus', 'bankVCs']

const { VCIssuer } = require('../../vc-issuer')
const issuer = new VCIssuer()

const vcTemplates = require('../../vc-issuer/vc')


const validateDidSignature = (did, salt, message) => {
  return Promise.resolve(true) // comment when debugging backend only
  // const signer = verifyDid(salt, message)
  // if (getAccountFromDID(did) !== signer.toLowerCase()) {
  //   throw new Error('Invalid signature')
  // }
}

const typeTemplateMap = {
  dateOfBirth: vcTemplates.createDoBCredentialPayload,
  relationshipStatus: vcTemplates.createRelationshipStatusCredentialPayload,
  dependants: vcTemplates.createDependantsCredentialPayload,
  employmentStatus: vcTemplates.createEmploymentStatusCredentialPayload,
  highestEducationAttained: vcTemplates.createHighestEducationAttainedCredentialPayload,
  kycStatus: vcTemplates.createKYCStatusCredentialPayload,
  // bankVCs: getAllVCs,
  citizenship: vcTemplates.createCitizenshipCredentialPayload
}

const getVC = async (userData, did, type) => {
  if (!allowedTypes.includes(type)) throw new Error('VC type not supported')
  return issuer.issueVC(did, userData[type], type, typeTemplateMap[type])
}

const decodePassword = (salt, parameters) => {
  return bytes = CryptoJS.AES.decrypt(parameters, salt).toString(CryptoJS.enc.Utf8);;
}
// TODO refactor VC code in the issuer!!!
module.exports = {
  RootQuery: {
    bankVC: async (_, { did, message, type, parameters }) => {
      console.log(`=== Get VC type ${type} requested by ${did}`)
      try {
        // TODO this is a HACK!!! refactor
        if (type === 'citizenship') {
          return getVC({ citizenship: 'SV' }, did, type)
        }
        const req = await verificationRequest.findOne({ did, type })
        if (!req || Object.entries(req).length === 0) throw new Error('Missing or expired request')
        await validateDidSignature(did, req.salt, message)
        console.log(`* did ${did} validated`)
        const password = decodePassword(req.salt, parameters)
        const bankConnection = BankConnection('https://obp-apisandbox.bancohipotecario.com.sv', '51wy4o0kvghivbbgbkmmfgmpb4nlu2x0qpdgagoj')
        console.log(`* bank connection successful`)
        await bankConnection.login(req.subject, password)
        const userData = await bankConnection.getCustomers()
        console.log(`* user ${did} data received`)
        const vc = getVC(userData, did, req.type)
        console.log(`* vc created ${vc}`)
        return vc
      } catch (error) {
        return error;
      }
    },
  },
}
