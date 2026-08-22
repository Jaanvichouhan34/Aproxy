import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { verifyAccessToken, TokenUserPayload } from '../utils/jwt';
import { UserRole } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: TokenUserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
      code: 'NO_TOKEN',
    });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid access token.',
      code: 'INVALID_TOKEN',
    });
    return;
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User authentication required before authorization.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Invalid request payload',
      });
      return;
    }
  };
};
