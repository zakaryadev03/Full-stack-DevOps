const client = require('prom-client');
const register = new client.Registry();

// Enable default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({ register });

// Define a common label for all metrics: the service name
const serviceLabel = { labelNames: ['service'] };

/*
 * -----------------
 * DEFINE METRIC TYPES
 * -----------------
 */

/**
 * 1. COUNTER: http_requests_total
 * A counter is a cumulative metric that represents a single monotonically increasing counter
 * whose value can only increase or be reset to zero on restart.
 *
 * Use Case: Count the total number of HTTP requests.
 */
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'route', 'status_code'],
  registers: [register],
});

/**
 * 2. GAUGE: (Service-specific)
 * A gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
 *
 * Use Case: We will define gauges in the services themselves (e.g., current inventory count,
 * total number of users) but register them here.
 */

/**
 * 3. HISTOGRAM: http_request_duration_seconds
 * A histogram samples observations (usually things like request durations or response sizes)
 * and counts them in configurable buckets. It also provides a sum of all observed values.
 *
 * Use Case: Measure the latency of HTTP requests in predefined buckets (e.g., <10ms, <50ms, <100ms).
 * This is great for calculating Apdex scores and general performance.
 */
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'method', 'route', 'status_code'],
  // Define buckets (in seconds) for response times
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/**
 * 4. SUMMARY: http_request_summary_seconds
 * Similar to a histogram, a summary samples observations. While it also provides a total
 * count of observations and a sum of all observed values, it calculates configurable
 * quantiles over a sliding time window.
 *
 * Use Case: Measure the 50th, 90th, and 99th percentile (p50, p90, p99) for request latency.
 * This is more expensive than a histogram but gives you precise percentiles.
 */
const httpRequestSummaryMicroseconds = new client.Summary({
  name: 'http_request_summary_seconds',
  help: 'Duration of HTTP requests in seconds (summary)',
  labelNames: ['service', 'method', 'route', 'status_code'],
  // Define percentiles to calculate
  percentiles: [0.5, 0.9, 0.99],
  registers: [register],
});

/*
 * -----------------
 * MIDDLEWARE
 * -----------------
 */

/**
 * Creates an Express middleware to record metrics for every request.
 * @param {string} serviceName - The name of the service (e.g., 'order-service')
 */
const createMetricsMiddleware = (serviceName) => {
  return (req, res, next) => {
    // Start timers for histogram and summary
    const endHistogramTimer = httpRequestDurationMicroseconds.startTimer();
    const endSummaryTimer = httpRequestSummaryMicroseconds.startTimer();

    // Fired when the response is finished
    res.on('finish', () => {
      const labels = {
        service: serviceName,
        method: req.method,
        // Use a template for route to avoid high cardinality
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      };

      // Record metrics
      httpRequestsTotal.inc(labels);
      endHistogramTimer(labels);
      endSummaryTimer(labels);
    });

    next();
  };
};

// Export the register and middleware
module.exports = {
  register,
  createMetricsMiddleware,
  // Export service-specific metric constructors
  Gauge: (config) => new client.Gauge({ ...config, registers: [register] }),
  Counter: (config) => new client.Counter({ ...config, registers: [register] }),
};