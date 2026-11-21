declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
