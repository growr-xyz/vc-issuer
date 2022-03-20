const {
  rskDIDFromPrivateKey,
  rskTestnetDIDFromPrivateKey,
} = require("@rsksmart/rif-id-ethr-did");

module.exports = {
  createIssuerIdentity: (
    privateKey,
    networkName
  ) =>
    networkName === "rsk:testnet"
      ? rskTestnetDIDFromPrivateKey()(privateKey)
      : rskDIDFromPrivateKey()(privateKey),

  getAccountFromDID: (did) =>
    did.split(":").slice(-1)[0].toLowerCase()
}