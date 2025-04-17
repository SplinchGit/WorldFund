// api/login.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';
import argon2 from 'argon2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body (Vercel may give you a string)
  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { username, password } = body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { name: username }, // ✅ this works with non-unique fields
    });
    

    if (!user || !user.passwordHash) {
      // user not found or no password set
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify the submitted password against the hash
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success — return public user data (omit the hash)
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
