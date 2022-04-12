const { ethers } = require('ethers')
const { verifyVerifiableJwt, parseCredential, getAddressFromDid } = require('../vc-verifier')
const PondABI = require('./abi/Pond.json')
const VerificationRegistryABI = require('./abi/VerificationRegistry.json')

const VerificationRegistryAddress = process.env.VERIFICATION_REGISTRY_ADDRESS


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

  static async getInstance(span) {
    if (!this.instance) {
      this.instance = new GrowrRiskAssesor({ uri: process.env.NODE_HOST, options: { name: 'rsk-testnet', chainId: 31 } })
      this.instance.connectNetwork()
    }
    return this.instance
  }

  async connectNetwork(span) {
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
    return this
  }

  async getCredentials(did, vps, span) {
    console.log(`=== Get credentials from presentation for did ${did}`)
    const vpsDecodePromises = []
    vps.forEach(vp => vpsDecodePromises.push(verifyVerifiableJwt(vp)))
    const verified = await Promise.all(vpsDecodePromises).catch(e => { throw e })
    console.log('* presentation valid')
    const vcValues = verified.map(v => v.payload.vp.verifiableCredential)
    const vcsDecodePromises = []
    vcValues.forEach(vc => vcsDecodePromises.push(verifyVerifiableJwt(vc[0], false)))
    const credentials = await Promise.all(vcsDecodePromises).catch(e => { throw e })
    console.log('* credentials validated')
    const parsedCredentials = credentials.map(cr => {
      // if (cr.payload.iss !== issuer.issuer.did) throw new Error('Issuer unknown')
      // if (cr.payload.subject !== did) throw new Error('DID and VC subject do not match')
      return parseCredential(cr.payload.vc.type[1], cr.payload.vc)
    })
    console.log(`* credentials parsed
      ${JSON.stringify(parsedCredentials, null, 2)}
    `)
    return parsedCredentials
  }

  async verifyCredentials(pondAddress, userCredentials, span) {

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
    const criteriaNames = await Pond.getCriteriaNames();
    if (!userHasMatchingCredentials(userCredentials, criteriaNames)) { throw new Error('User credentials does not match pond requirements') }
    const userCredentialValues = createUserCredentialValues(userCredentials)
    console.log(`* user credential vales to pass to Pond
        ${JSON.stringify(userCredentialValues, null, 2)}
      `)
    return await Pond.verifyCredentials(userCredentialValues);
  }

  async registerVerification(did, pondAddress, span, validity = 60 * 60) {
    console.log(`=== Granting access to pond ${pondAddress} for user ${did}`)
    const VerificationRegistry = new ethers.Contract(VerificationRegistryAddress, VerificationRegistryABI, this.provider)
    const didAddress = await getAddressFromDid(did)
    try {
      const tx = await VerificationRegistry.connect(this.wallet).registerVerification(didAddress, pondAddress, validity);
      return tx.wait();
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

module.exports = { GrowrRiskAssesor }
