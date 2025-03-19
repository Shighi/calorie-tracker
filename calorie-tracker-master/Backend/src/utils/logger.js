import winston from 'winston';
import path from 'path';

// Dynamic import for CommonJS module
const { default: DailyRotateFile } = await import('winston-daily-rotate-file');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
});

// File transport for rotating logs
const fileTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Error file transport
const errorTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    consoleTransport,
    fileTransport,
    errorTransport
  ],
  exceptionHandlers: [
    consoleTransport,
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    consoleTransport,
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'rejections.log') 
    })
  ]
});

export default logger;