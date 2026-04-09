import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.helper.js';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    console.log("BODY RECEIVED:", req.body);
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const error = result.error as ZodError;
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      sendError(res, message, 400);
      return;
    }
    // Replace the target with the parsed (coerced & stripped) data
    req[target] = result.data;
    next();
  };