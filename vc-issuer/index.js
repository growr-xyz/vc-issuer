const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const VerificationRequest = require('../model/verificationRequest')
const VC = require('../model/vc')
const { getAccountFromDID, createIssuerIdentity } = require('./did')
const { ecrecover } = require('./ecrecover')

class VCIssuer {
  issuer

  constructor() {
    if (!!VCIssuer.instance) {
      return VCIssuer.instance
    }
    VCIssuer.instance = this
    this.issuer = createIssuerIdentity(process.env.PRIVATE_KEY, process.env.NETWORK_NAME || 'rsk');
    console.log(`Service DID: ${this.issuer.did}`);
    return this
  }

  async createRequest({ did, type, subject }) {
    const vr = await VerificationRequest.findOne({ did, type })
    if (!!vr) {
      return vr.salt
    }
    const verificationRequest = new VerificationRequest({ did, type, subject })
    await verificationRequest.save()
    // TODO return by SMS or email as in the RSK issuer
    return verificationRequest.salt
  }

  verifySignature(did, code, sig) {
    const msg = decorateVerificationCode(code)
    const signer = ecrecover(msg, sig)
    if (getAccountFromDID(did) !== signer.toLowerCase()) {
      throw new Error('Invalid signature')
    }
  }

  async createVC(did, subject, template) {
    const payload = template(did, subject)
    return createVerifiableCredentialJwt(payload, this.issuer)
  }




  // async requestVerification(did, subject) {
  //   const verificationRequest = await this.createRequest(did, subject)
  //   return verificationRequest.code
  // }

  // async verify(did, sig) {
  //   const verificationRequest = await this.getRequest(did)
  //   if (verificationRequest.hasExpired()) {
  //     throw new Error('Request has expired')
  //   }

  //   const { code, subject } = verificationRequest

  //   this.verifySignature(did, code, sig)

  //   const issuedVC = await this.findIssuedVC(did, subject)
  //   if (issuedVC) {
  //     return issuedVC.jwt
  //   }

  //   const jwt = await this.createVC(did, subject)
  //   await this.saveVC(did, subject, jwt)

  //   return jwt
  // }

  async issueVC(did, subject, type, template) {
    const vc = await VC.findOne({ did, subject })
    if (vc) return vc.jwt
    const jwt = await this.createVC(did, subject, template)
    await VC.create({ did, subject, type, jwt })
    return jwt
  }
}

module.exports = { VCIssuer }

// dateOfBirth
// relationshipStatus
// dependants
// education
// employmentStatus
// highestEducationAttained
// kycStatus