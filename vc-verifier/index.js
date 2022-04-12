const { Resolver } = require('did-resolver')
const { getResolver } = require('ethr-did-resolver')
const { verifyJWT } = require('jesse-did-jwt')
const { parseVerifiableCredential } = require('@growr/vc-json-schemas-parser')

const providerConfig = {
  networks: [
    // { name: 'rsk:testnet', rpcUrl: 'https://localhost:8545', chainId: 31337 },
    { name: 'rsk:testnet', rpcUrl: 'https://did.testnet.rsk.co:4444', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
    { name: 'rsk', rpcUrl: 'https://did.rsk.co:4444', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
  ]
}

const resolver = new Resolver(getResolver(providerConfig))

const verifyVerifiableJwt = (jwt, span, ethSign = true) => {
  // @ts-expect-error: resolver is incorrect type from did-jwt
  return verifyJWT(jwt, { ethSign, resolver })
}

const getAddressFromDid = async (did, span) => {
  const doc = await resolver.resolve(did)
  return doc.publicKey[0].ethereumAddress
}

const parseCredential = (type, payload, span) => {
  return parseVerifiableCredential(type, payload)
}

module.exports = {
  verifyVerifiableJwt,
  parseCredential,
  getAddressFromDid
}
