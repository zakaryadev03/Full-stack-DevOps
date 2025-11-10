/* tracing.js */
'use strict';

const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
// --- THIS IS THE CORRECT PACKAGE ---
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// 1. Configure the Jaeger Exporter
// By default, this exporter will automatically read the environment variable
// 'OTEL_EXPORTER_JAEGER_ENDPOINT' to find your Jaeger instance.
const exporter = new JaegerExporter();

// 2. Define a "Resource" for your service
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME || 'unknown_service',
});

// 3. Initialize the NodeSDK
const sdk = new NodeSDK({
  resource: resource,
  traceExporter: exporter, // Use the correct JaegerExporter
  instrumentations: [getNodeAutoInstrumentations()],
});

// 4. Start the SDK
try {
  sdk.start();
  console.log(`OpenTelemetry (Jaeger) tracing initialized for service: ${process.env.OTEL_SERVICE_NAME}`);
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