// import { createLogger, format, transports } from 'winston';

// const { combine, printf, colorize, errors } = format;

// const prodLogger = () => {
//   const logFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`);
//   return createLogger({
//     level: 'debug',
//     format: combine(
//       format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//       // Format the metadata object
//       format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
//     ),
//     defaultMeta: { service: 'user-service' },
//     transports: [
//       new transports.Console({
//         format: format.combine(logFormat),
//       }),
//     ],
//   });
// };

// const devLogger = () => {
//   const logFormat = printf(({ level, message, timestamp, stack }) => {
//     return `${timestamp} ${level}: ${stack || message}`;
//   });

//   return createLogger({
//     level: 'debug',
//     format: combine(
//       colorize(),
//       format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//       errors({ stack: true }),
//       format.splat(),
//       format.json(),
//       logFormat
//     ),
//     transports: [new transports.Console()],
//   });
// };

// const logger = process.env.NODE_ENV === 'development' ? devLogger() : prodLogger();

// export default logger;
