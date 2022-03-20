const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const VerificationRequest = require('../model/verificationRequest')
// import VC from '../model/vc'
const { getAccountFromDID, createIssuerIdentity } = require('./did')
const { ecrecover } = require('./ecrecover')

class VCIssuer {
  credentialType
  credentialTemplate
  issuer
  VC

  constructor(
    credentialType,
    credentialTemplate,
  ) {
    this.credentialType = credentialType
    this.credentialTemplate = credentialTemplate
    this.issuer = createIssuerIdentity(process.env.PRIVATE_KEY, process.env.NETWORK_NAME || 'rsk');
    console.log(`Service DID: ${this.issuer.did}`);
  }

  async createRequest({ did, type, subject }) {
    const vr = await VerificationRequest.findOne({ did })
    if (!!vr) {
      return vr.salt
    }
    const verificationRequest = new VerificationRequest({ did, type, subject })
    await verificationRequest.save()
    // TODO return by SMS
    return verificationRequest.salt
  }

  async getRequest(did) {
    const verificationRequest = await this.verificationRequests.findOne({ where: { did, type: this.credentialType } })
    if (!verificationRequest) {
      throw new Error('Request not found')
    }
    return verificationRequest
  }

  verifySignature(did, code, sig) {
    const msg = decorateVerificationCode(code)
    const signer = ecrecover(msg, sig)
    if (getAccountFromDID(did) !== signer.toLowerCase()) {
      throw new Error('Invalid signature')
    }
  }

  async findIssuedVC(did, subject) {
    return this.issuedVCs.findOne({
      where: { did, type: this.credentialType, subject },
      select: ['jwt']
    })
  }

  async createVC(did, subject) {
    const payload = this.credentialTemplate(did, subject)
    return createVerifiableCredentialJwt(payload, this.issuer)
  }

  async saveVC(did, subject, jwt) {
    const newIssuedVC = new IssuedVC(did, this.credentialType, subject, jwt)
    await this.VC.save(newIssuedVC)
  }

  async requestVerification(did, subject) {
    const verificationRequest = await this.createRequest(did, subject)
    return verificationRequest.code
  }

  async verify(did, sig) {
    const verificationRequest = await this.getRequest(did)
    if (verificationRequest.hasExpired()) {
      throw new Error('Request has expired')
    }

    const { code, subject } = verificationRequest

    this.verifySignature(did, code, sig)

    const issuedVC = await this.findIssuedVC(did, subject)
    if (issuedVC) {
      return issuedVC.jwt
    }

    const jwt = await this.createVC(did, subject)
    await this.saveVC(did, subject, jwt)

    return jwt
  }
}

module.exports = { VCIssuer }