const { fromRpcSig, hashPersonalMessage, ecrecover, pubToAddress } = require('ethereumjs-util')

module.exports = {
  verifyDid: (salt, msg, span) => {
    const { v, r, s } = fromRpcSig(msg)
    const msgHash = hashPersonalMessage(Buffer.from(salt))
    return `0x${pubToAddress(ecrecover(msgHash, v, r, s)).toString('hex')}`
  }
}
