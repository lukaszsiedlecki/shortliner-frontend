import pino from 'pino';

// One JSON object per line on stdout, picked up by Alloy/Loki. No transport on purpose:
// transports run in worker threads and don't play well with the Next.js standalone bundle.
export const logger = pino({
  messageKey: 'message',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({level: label}),
  },
});
