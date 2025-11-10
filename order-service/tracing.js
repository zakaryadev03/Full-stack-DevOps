/* tracing.js */
'use strict';

const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// 1. Configure the OTLP Exporter
// This is the standard OTLP/HTTP exporter.
// It will send traces to the URL specified in the
// OTEL_EXPORTER_OTLP_ENDPOINT environment variable.
const exporter = new OTLPTraceExporter();

// 2. Define a "Resource" for your service
// This groups all traces under a "service.name" in Jaeger
// We get the name from the OTEL_SERVICE_NAME environment variable.
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME || 'unknown_service',
});

// 3. Initialize the NodeSDK
const sdk = new NodeSDK({
  resource: resource,
  traceExporter: exporter,
  // This automatically instruments popular modules (http, express, axios, etc.)
  instrumentations: [getNodeAutoInstrumentations()],
});

// 4. Start the SDK
try {
  sdk.start();
  console.log(`OpenTelemetry tracing initialized for service: ${process.env.OTEL_SERVICE_NAME}`);
} catch (error) {
  console.error('Error initializing OpenTelemetry tracing', error);
}

// 5. Add graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});