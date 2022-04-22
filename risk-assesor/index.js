const { ethers } = require('ethers')
const { verifyVerifiableJwt, parseCredential, getAddressFromDid } = require('../vc-verifier')
const PondABI = require('./abi/Pond.json')
const VerificationRegistryABI = require('./abi/VerificationRegistry.json')

const VerificationRegistryAddress = process.env.VERIFICATION_REGISTRY_ADDRESS
const { startChildSpan } = require('../instrumentation-setup')


class GrowrRiskAssesor {
  riskAssesor
  provider
  address
  signer
  network
  instance
  wallet

  constructor(network) {
    this.network = network
  }

  static async getInstance() {
    if (!this.instance) {
      this.instance = new GrowrRiskAssesor({ uri: process.env.NODE_HOST, options: { name: 'rsk-testnet', chainId: 31 } })
      this.instance.connectNetwork()
    }
    return this.instance
  }

  async connectNetwork(parentSpan) {
    const span = startChildSpan('connectNetwork', parentSpan)
    this.provider = new ethers.providers.JsonRpcProvider(this.network.uri, this.network.options);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
    this.address = this.wallet.address
    console.log(`=== Growr risk Assesor registred address: ${this.address}`)
    const balance = await this.wallet.getBalance()
    const chainId = await this.wallet.getChainId()
    console.log(`
    === RISK ASSESOR
      * balance: ${balance}
      * chainId: ${chainId}
    `)
    span.end()
    return this
  }

  async getCredentials(did, vps, parentSpan) {
    const span = startChildSpan('getCredentials', parentSpan)
    console.log(`=== Get credentials from presentation for did ${did}`)
    const vpsDecodePromises = []
    const childSpan1 = startChildSpan('Verify_presentation_promise', span)
    vps.forEach(vp => vpsDecodePromises.push(verifyVerifiableJwt(vp)))
    const verified = await Promise.all(vpsDecodePromises).catch(e => { throw e })
    childSpan1.end()
    console.log('* presentation valid')
    const childSpan2 = startChildSpan('Verify_credentials_promise', span)
    const vcValues = verified.map(v => v.payload.vp.verifiableCredential)
    const vcsDecodePromises = []
    vcValues.forEach(vc => vcsDecodePromises.push(verifyVerifiableJwt(vc[0], false)))
    const credentials = await Promise.all(vcsDecodePromises).catch(e => {
      throw e
    })
    childSpan2.end()
    console.log('* credentials validated')

    const childSpan3 = startChildSpan('Parse_credentials', span)
    const parsedCredentials = credentials.map(cr => {
      // if (cr.payload.iss !== issuer.issuer.did) throw new Error('Issuer unknown')
      // if (cr.payload.subject !== did) throw new Error('DID and VC subject do not match')
      return parseCredential(cr.payload.vc.type[1], cr.payload.vc)
    })
    console.log(`* credentials parsed
      ${JSON.stringify(parsedCredentials, null, 2)}
    `)
    childSpan3.end()
    span.end()
    return parsedCredentials
  }

  async verifyCredentials(pondAddress, userCredentials, parentSpan) {
    const span = startChildSpan('verifyCredentials', parentSpan)

    console.log(` === Start verifing presented credentials for pond ${pondAddress}`)

    const decapitalizeFirstLetter = (text) => {
      return text && text[0].toLowerCase() + text.slice(1) || text
    }

    const userHasMatchingCredentials = (userCredentials, pondCredentials) => {
      console.log('* check if presented credential types match the pond criteria names')
      const userCredentialTypes = userCredentials.map(credential => decapitalizeFirstLetter(Object.keys(credential)))
      if (pondCredentials.every(criteria => userCredentialTypes.includes(criteria))) return true
      return false
    }

    const createUserCredentialValues = (userCredentials) => {
      const names = []
      const contents = []
      for (const i in userCredentials) {
        const localNames = []
        localNames.push(...Object.keys(userCredentials[i]))
        for (const j of localNames) {
          names.push(decapitalizeFirstLetter(j))
          contents.push(userCredentials[i][j].text)
        }
      }
      return { names, contents }
    }

    const Pond = new ethers.Contract(pondAddress, PondABI, this.provider);

    const childSpan1 = startChildSpan('get_criteriaNames', span)
    span.addEvent('get_criteriaNames_start')
    const criteriaNames = await Pond.getCriteriaNames();
    childSpan1.end()
    if (!userHasMatchingCredentials(userCredentials, criteriaNames)) {
      span.end()
      throw new Error('User credentials does not match pond requirements')
    }

    const childSpan2 = startChildSpan('pond_verify_credentials', span)

    const userCredentialValues = createUserCredentialValues(userCredentials)
    console.log(`* user credential vales to pass to Pond
        ${JSON.stringify(userCredentialValues, null, 2)}
      `)
    const result = await Pond.verifyCredentials(userCredentialValues);
    childSpan2.end()
    span.end()
    return result
  }

  async registerVerification(did, pondAddress, parentSpan, validity = 60 * 60) {

    const span = startChildSpan('registerVerification', parentSpan)

    console.log(`=== Granting access to pond ${pondAddress} for user ${did}`)
    const VerificationRegistry = new ethers.Contract(VerificationRegistryAddress, VerificationRegistryABI, this.provider)
    const didAddress = await getAddressFromDid(did)
    try {
      const tx = await VerificationRegistry.connect(this.wallet).registerVerification(didAddress, pondAddress, validity);
      span.addEvent(`got tx :: ${(new Date()).toISOString()}`)
      span.end()
      return tx.wait();
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

module.exports = { GrowrRiskAssesor }
