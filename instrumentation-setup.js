const {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  BatchSpanProcessor

} = require('@opentelemetry/sdk-trace-base');
const opentelemetry = require('@opentelemetry/api');

const provider = new BasicTracerProvider();

const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()));
provider.register();

// This is what we'll access in all instrumentation code
const tracer = opentelemetry.trace.getTracer(
  'growr-risk-assessor'
);

module.exports = { tracer, provider }