const {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  BatchSpanProcessor

} = require('@opentelemetry/sdk-trace-base');
// const opentelemetry = require('@opentelemetry/api');

const provider = new BasicTracerProvider();
const { context, trace } = require('@opentelemetry/api')

const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()));
provider.register();

// This is what we'll access in all instrumentation code
const tracer = trace.getTracer(
  'growr-risk-assessor'
);

const startChildSpan = (type, parent, options = undefined) => {
  const ctx = trace.setSpan(
    context.active(),
    parent
  );

  const span = tracer.startSpan(type, options, ctx);
  return span
}

module.exports = { tracer, startChildSpan }