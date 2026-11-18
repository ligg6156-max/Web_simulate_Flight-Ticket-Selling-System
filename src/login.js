import { verifyUser } from './db.js';

export async function login(req, res) {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password) {
    res.status(400).json({ success: false, message: 'Username and password are required.' });
    return;
  }

  try {
    const user = await verifyUser(username.trim(), password);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
      return;
    }

    req.session.user = {
      id: String(user._id),
      username: user.username
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: req.session.user
    });
  } catch (err) {
    console.error('Login verification failed:', err);
    res.status(500).json({ success: false, message: 'Unable to verify login.' });
  }
}