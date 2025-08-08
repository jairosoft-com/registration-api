import pino from 'pino';

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure sensitive data redaction paths
const redactPaths = [
  'password',
  '*.password',
  '*.*.password',
  'authorization',
  '*.authorization',
  'headers.authorization',
  'token',
  '*.token',
  'refreshToken',
  '*.refreshToken',
  'apiKey',
  '*.apiKey',
  'secret',
  '*.secret',
];

// Create Pino logger configuration
const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',

  // Redact sensitive information
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },

  // Add base fields to all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
  },

  // Serializers for common objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },

  // Format timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Message key (use 'msg' for compatibility)
  messageKey: 'msg',
};

// Configure pretty printing for development
if (isDevelopment) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error'],
    },
  };
}

// Create the logger instance
const logger = pino(loggerOptions);

// Export child logger function for correlation IDs
export const createChildLogger = (correlationId: string) => {
  return logger.child({ correlationId });
};

// Export the default logger
export default logger;
