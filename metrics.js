/* monitoring.js */
'use strict';

const { MeterProvider, ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics-base');

const meter = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
}).getMeter('risk-assessment-metrics');