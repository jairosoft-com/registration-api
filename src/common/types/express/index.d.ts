import { Logger } from 'pino';

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
    };
    logger?: Logger;
    requestId: string;
    startTime: number;
  }
}
