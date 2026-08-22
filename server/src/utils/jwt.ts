import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRole } from '../models/User';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'aproxy_jwt_access_secret_fallback_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aproxy_jwt_refresh_secret_fallback_key';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
}

export const generateAccessToken = (payload: TokenUserPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY as any,
  });
};

export const verifyAccessToken = (token: string): TokenUserPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenUserPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};
