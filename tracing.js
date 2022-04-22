// tracing.js

'use strict'

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
// const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
// const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');

const { AsyncHooksContextManager } = require("@opentelemetry/context-async-hooks");

const api = opentelemetry.api

// const contextManager = new AsyncHooksContextManager();
// contextManager.enable();
// api.context.setGlobalContextManager(contextManager);

const traceExporter = new OTLPTraceExporter();
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: []
});


// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error));

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
