import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

const formatZodError = (error: { issues: Array<{ code?: string; message: string }> }) => {
  const hasUnknownFields = error.issues.some((issue) => issue.code === 'unrecognized_keys');
  return {
    status: 400,
    body: {
      success: false,
      error: hasUnknownFields ? 'Unknown fields are not allowed' : 'Validation failed',
      message: hasUnknownFields
        ? 'Unknown fields are not allowed'
        : error.issues.map((issue) => issue.message).join('; '),
      details: error,
    },
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formatted = formatZodError(result.error);
      return res.status(formatted.status).json(formatted.body);
    }

    req.body = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const formatted = formatZodError(result.error);
      return res.status(formatted.status).json(formatted.body);
    }

    req.params = result.data as typeof req.params;
    next();
  };
};
