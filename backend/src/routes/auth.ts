import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { signToken } from '../auth/jwt';

export const authRouter = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post('/signup', async (req, res) => {
  const { email, password, role, display_name } = req.body;

  if (!email || !password || !role || !display_name) {
    return res.status(400).json({ error: 'email, password, role, and display_name are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!['buyer', 'merchant'].includes(role)) {
    return res.status(400).json({ error: 'role must be "buyer" or "merchant"' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, display_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, display_name`,
    [email.toLowerCase(), passwordHash, role, display_name]
  );
  const user = result.rows[0];

  if (role === 'merchant') {
    await pool.query('INSERT INTO merchants (user_id, name) VALUES ($1, $2)', [user.id, display_name]);
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];

  // Deliberately identical error for "no such user" and "wrong password" — don't leak which one it was
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, display_name: user.display_name } });
});

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { verifyToken } = await import('../auth/jwt');
    const payload = verifyToken(header.slice(7));
    const result = await pool.query('SELECT id, email, role, display_name FROM users WHERE id = $1', [payload.userId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'User no longer exists' });
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});