import initTelemetryClient from "./appinsights.js";

// Must be imported before any module that loads `redis`, so it can be instrumented.
initTelemetryClient();
