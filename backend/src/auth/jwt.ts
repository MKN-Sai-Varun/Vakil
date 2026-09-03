import jwt from 'jsonwebtoken';

const JWT_SECRET =process.env.JWT_SECRET as string;

export interface TokenPayload {
  userId: string;
  role: 'buyer' | 'merchant';
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}