import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure the log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom log format for Markdown
const markdownTableFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `| **Level** | **Timestamp**              | **Message**                  |\n|-----------|------------------------------|------------------------------|\n| ${level.toUpperCase()} | ${timestamp} | ${message} |\n\n`;
  });
  

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    markdownTableFormat // Use custom markdown format
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'app.md') }) // Log to a markdown file
  ],
});

// If in development, log to the console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
