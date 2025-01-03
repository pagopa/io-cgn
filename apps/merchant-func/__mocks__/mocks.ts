import { TelemetryClient } from "applicationinsights";

export const telemetryClientMock: TelemetryClient = ({
  trackEvent: jest.fn().mockImplementation(({ name, properties }) => {
    console.info(`Event: ${name}, Props: ${JSON.stringify(properties)}`);
  }),
  trackException: jest.fn().mockImplementation(({ exception, properties }) => {
    console.error(
      `Exception: ${exception}, Props: ${JSON.stringify(properties)}`
    );
  })
} as unknown) as TelemetryClient;
