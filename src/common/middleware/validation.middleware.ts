import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // First, try to validate the body as-is (supports schemas expecting req.body shape)
      await schema.parseAsync(req.body);
      return next();
    } catch (_primaryError) {
      try {
        // Fallback: validate using a wrapper object including body/query/params
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        return next();
      } catch (error) {
        next(error);
      }
    }
  };
