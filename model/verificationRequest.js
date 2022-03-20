const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CryptoJS = require('crypto-js')
const verificationRequestSchema = new Schema({
  did: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true
  },
  salt: {
    type: String
  },
  subject: {
    type: String,
    required: true
  },
// set expiration date in env
  createdAt: { type: Date, expires: '10m', default: Date.now }
});



verificationRequestSchema.pre('save', function (next) {
  if (!this.created) this.salt = CryptoJS.lib.WordArray.random(256 / 8)
  next();
})
module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
