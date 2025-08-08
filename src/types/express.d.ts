import { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      logger?: Logger;
      requestId: string;
      startTime: number;
    }
  }
}

export {};
