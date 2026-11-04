import express from "express";
import {connectDB} from "./db.js";

const router = express.Router();


async function fetch_user(username) {
  const sql = 'SELECT * FROM users WHERE username = ?';
  const [rows] = await pool.query(sql, [username]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    enabled: row.enabled,
    created_at: row.created_at
  };
}

async function validate_user(username, password) {
  if (!username || !password) {
    return { status: 'not_found' };
  }
  const user = await fetch_user(username);
  if (!user) {
    return { status: 'not_found' };
  }
  if (user.password !== password) {
    return { status: 'wrong_password' };
  }
  if (!user.enabled) {
    return { status: 'disabled', user: user };
  }
  return { status: 'success', user: user };
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await validate_user(username, password);

  if (result.status === 'not_found' || result.status === 'wrong_password') {
    res.status(401).json({
      ok: false,
      message: 'Incorrect username or password'
    });
    return;
  }

  if (result.status === 'disabled') {
    res.status(401).json({
      ok: false,
      message: `User ${result.user.username} is currently disabled`
    });
    return;
  }

  if (result.status === 'success') {
    const user = result.user;

    req.session.logged = true;
    req.session.username = user.username;
    req.session.role = user.role;
return req.session.save((err) => {
      if (err) {
        return res.status(500).json({ ok: false, message: 'Session error' });
      }
      res.json({
        ok: true,
        message: 'Login successful',
        user: {
          username: user.username,
          role: user.role
        }
      });
    });
  }

  res.status(500).json({
    ok: false,
    message: 'Unknown error'
  });
});

router.get('/me', async (req, res) => {
  if (req.session.logged !== true) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  const username = req.session.username;
  const user = await fetch_user(username);

  if (!user || !user.enabled) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    ok: true,
    user: {
      username: user.username,
      role: user.role,
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true,
      message: 'Logged out'
    });
  });
});

export default router;