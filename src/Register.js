import { createUser } from './db.js';

export async function register(req, res) {
  const { username, password, confirmPassword, role } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string' ||
      typeof confirmPassword !== 'string' || typeof role !== 'string' ||
      !username.trim() || !password || !confirmPassword || !role.trim()) {
    res.status(400).json({ success: false, message: 'All fields are required.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Passwords do not match.' });
    return;
  }

  if (!['user', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role.' });
    return;
  }

  try {
    const created = await createUser(username.trim(), password, role);

    if (!created) {
      res.status(409).json({ success: false, message: 'Username already exists.' });
      return;
    }

    res.status(201).json({ success: true, message: 'Registration successful.' });
  } catch (err) {
    console.error('User registration failed:', err);
    res.status(500).json({ success: false, message: 'Unable to register user.' });
  }
}