import { createLogger, format, transports } from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
};

//   Writes log from info, warn, error
export const logger = createLogger({
  level: "info",
  format: format.json(),
  //   Outputs to different places w different formats.
  transports: [
    new transports.Console({
      format: format.prettyPrint({ colorize: true })
    }),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "allLogs.log" })
  ]
});
