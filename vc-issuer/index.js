const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const VerificationRequest = require('../model/verificationRequest')
const VC = require('../model/vc')
const { createIssuerIdentity } = require('./did')
const { ecrecover } = require('./ecrecover')
const { wrapSpanContext } = require('@opentelemetry/api/build/src/trace/spancontext-utils')

const allowedTypes = ['citizenship', 'dateOfBirth', 'relationshipStatus', 'dependants', 'education', 'employmentStatus', 'highestEducationAttained', 'kycStatus', 'hasKYC', 'bankVCs', 'age', 'avgMonthlyIncome', 'avgMonthlyRest', 'savingPercent']

const finastraTypes = ['age', 'hasKYC', 'citizenship', 'avgMonthlyIncome', 'avgMonthlyRest', 'savingPercent']
const { context, setSpan } = require('@opentelemetry/api')
const { getRPCMetadata, RPCType } = require('@opentelemetry/core');

const { tracer } = require('../instrumentation-setup')
class VCIssuer {
  issuer

  constructor() {
    if (!!VCIssuer.instance) {
      return VCIssuer.instance
    }
    VCIssuer.instance = this
    this.issuer = createIssuerIdentity(process.env.PRIVATE_KEY, process.env.NETWORK_NAME || 'rsk:testnet');
    console.log(`Service DID: ${this.issuer.did}`);
    return this
  }

  async createRequest(span, { did, type, subject }) {

    console.log(` === Create request for VC type ${type} by did ${did} `)
    const vr = await VerificationRequest.findOne({ did, type })
    if (!!vr) {
      return vr.salt
    }
    const verificationRequest = new VerificationRequest({ did, type, subject })
    await verificationRequest.save()
    // TODO return by SMS or email as in the RSK issuer
    console.log(`* VC request created`)
    span.end()
    return verificationRequest.salt
  }

  // verifySignature(did, code, sig) {
  //   const msg = decorateVerificationCode(code)
  //   const signer = ecrecover(msg, sig)
  //   if (getAccountFromDID(did) !== signer.toLowerCase()) {
  //     throw new Error('Invalid signature')
  //   }
  // }

  async createVC(did, subject, template, span) {
    console.log(`* create VC from data and template`)
    const payload = template(did, subject)
    return createVerifiableCredentialJwt(payload, this.issuer)
  }

  async issueVC(did, subject, type, template, span) {
    const vc = await VC.findOne({ did, subject })
    if (vc) return vc.jwt
    const jwt = await this.createVC(did, subject, template)
    await VC.create({ did, subject, type, jwt })
    return jwt
  }
}

module.exports = { VCIssuer, allowedTypes, finastraTypes }
