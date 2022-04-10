const { ethers } = require('ethers')
const { VCIssuer } = require('../vc-issuer')
const { verifyVerifiableJwt, parseCredential, getAddressFromDid } = require('../vc-verifier')
const PondABI = require('./abi/Pond.json')
const VerificationRegistryABI = require('./abi/VerificationRegistry.json')

let instance
const VerificationRegistryAddress = process.env.VERIFICATION_REGISTRY_ADDRESS

const GrowrRiskAssesor = () => {
  let provider
  let address
  let signer
  const issuer = new VCIssuer()

  instance = {
    connectNetwork: () => {
      provider = new ethers.providers.JsonRpcProvider(process.env.NODE_HOST) //, { name: 'rsk-testnet', chainId: 31 });
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
      address = wallet.address
      signer = provider.getSigner(address);
      console.log(`=== Growr risk Assesor registred address: ${address}`)

      return { provider, address, signer }
    },

    getCredentials: async (did, vps) => {
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
    },

    verifyCredentials: async (pondAddress, userCredentials) => {

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

      const Pond = new ethers.Contract(pondAddress, PondABI, provider);
      const criteriaNames = await Pond.getCriteriaNames();
      if (!userHasMatchingCredentials(userCredentials, criteriaNames)) { throw new Error('User credentials does not match pond requirements') }
      const userCredentialValues = createUserCredentialValues(userCredentials)
      console.log(`* user credential vales to pass to Pond
          ${JSON.stringify(userCredentialValues, null, 2)}
        `)
      return await Pond.verifyCredentials(userCredentialValues);
    },

    registerVerification: async (did, pondAddress, validity = 60 * 60) => {
      console.log(`=== Granting access to pond ${pondAddress} for user ${did}`)
      const VerificationRegistry = new ethers.Contract(VerificationRegistryAddress, VerificationRegistryABI, provider)
      const didAddress = getAddressFromDid(did)
      const tx = await VerificationRegistry.connect(signer).registerVerification(didAddress, pondAddress, validity);
      return tx.wait();
    }
  }

  return instance

}

module.exports = { GrowrRiskAssesor }
