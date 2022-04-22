const { VCIssuer } = require('../../vc-issuer')
const { GrowrRiskAssesor } = require('../../risk-assesor')

const issuer = new VCIssuer()

const { context, trace, propagation, ROOT_CONTEXT } = require('@opentelemetry/api')

const { tracer,  } = require('../../instrumentation-setup')
const { setSpan } = require('@opentelemetry/api/build/src/trace/context-utils')

module.exports = {
  RootMutation: {
    requestVerification: async (_, { did, username, type = 'bankVCs' }) => {
      const parentSpan = tracer.startSpan("requestVerification")
      parentSpan.setAttribute('type', type)
      console.log(`=== Request verification type: ${type} by did: ${did}`)
      const response = await issuer.createRequest({ did, type, subject: username }, parentSpan)  //, spanCtx) //, context.active(), spanCtx)
      parentSpan.end()
      return response
    },

    verifyVCs: async (_, { did, vps, pondAddress }) => {
      try {
        const parentSpan = tracer.startSpan('verifyVCs')
        parentSpan.setAttribute('did', did)

        const riskAssesor = await GrowrRiskAssesor.getInstance(parentSpan)

        console.log(`=== Verify credentials for pond ${pondAddress} started by ${did}`)
        const userCredentials = await riskAssesor.getCredentials(did, vps, parentSpan)
        const verified = await riskAssesor.verifyCredentials(pondAddress, userCredentials, parentSpan)
        if (!verified) {
          throw new Error('User credentials does not match pond criteria')
        }
        await riskAssesor.registerVerification(did, pondAddress, parentSpan)
        parentSpan.end()
        console.log(`* access granted`)
        return true
      } catch (e) {
        throw e
      }
    }

  }
}
