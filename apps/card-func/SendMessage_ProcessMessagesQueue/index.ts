import { ServicesAPIClient } from "../clients/services";
import { MessagesAPIClient } from "../clients/services-messages";
import initTelemetryClient from "../utils/appinsights";
import { GetProfile, SendMessage } from "../utils/notifications";
import { handler } from "./handler";

initTelemetryClient();

const index = handler(
  GetProfile(ServicesAPIClient),
  SendMessage(MessagesAPIClient),
);

export default index;
