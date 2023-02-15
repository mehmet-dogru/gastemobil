const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "news-service" },
  transports: [
    new winston.transports.File({ filename: "v1/src/logs/news/error.log", level: "error" }),
    new winston.transports.File({ filename: "v1/src/logs/news/info.log", level: "info" }),
    new winston.transports.File({ filename: "v1/src/logs/news/combined.log" }),
  ],
});

module.exports = logger;