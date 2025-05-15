import { Express, Request } from 'express';

// Extender el tipo Request de Express para incluir el usuario y la sesión
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
      };
      session?: {
        id: string;
        ownerId: string;
        [key: string]: any;
      };
    }
  }
}

export {}; 