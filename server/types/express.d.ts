import { User, Session } from '../generated/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
} 