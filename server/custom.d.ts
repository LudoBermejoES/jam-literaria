import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      name: string;
      [key: string]: any;
    };
    session?: {
      id: string;
      ownerId: string;
      [key: string]: any;
    };
  }
} 