import { cgnOperatorDb } from "../client/sequelize";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { getMaterializedViewRefreshHandler } from "./handler";

// ensure config is correct
getConfigOrThrow();

// init telemetry client
initTelemetryClient();

const materializedViewRefreshHandler = getMaterializedViewRefreshHandler(
  cgnOperatorDb
);

export default materializedViewRefreshHandler;
