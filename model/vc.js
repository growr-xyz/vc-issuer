const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const vcSchema = new Schema({
  did: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  jwt: {
    type: String,
  }
});
module.exports = mongoose.model('VC', vcSchema);
