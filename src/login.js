import express from "express";
import { connectDB } from "./db.js";

const router = express.Router();

async function fetch_user(username) {
  const db = await connectDB();
  return db.collection("users").findOne({ username });
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    res.status(400).json({
      ok: false,
      message: "Username and password are required"
    });
    return;
  }

  try {
    const user = await fetch_user(username.trim());

    if (!user || user.password !== password) {
      res.status(401).json({
        ok: false,
        message: "Incorrect username or password"
      });
      return;
    }

    if (!user.enabled) {
      res.status(401).json({
        ok: false,
        message: "This account is disabled"
      });
      return;
    }

    req.session.logged = true;
    req.session.username = user.username;
    req.session.role = user.role;

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    res.json({
      ok: true,
      message: "Login successful",
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({
      ok: false,
      message: "Unable to log in right now"
    });
  }
});

router.get("/me", async (req, res) => {
  if (req.session.logged !== true || !req.session.username) {
    res.status(401).json({ ok: false, message: "Unauthorized" });
    return;
  }

  try {
    const user = await fetch_user(req.session.username);

    if (!user || !user.enabled) {
      res.status(401).json({ ok: false, message: "Unauthorized" });
      return;
    }

    res.json({
      ok: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Unable to load current user:", error);
    res.status(500).json({
      ok: false,
      message: "Unable to load user right now"
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);
      res.status(500).json({ ok: false, message: "Unable to log out" });
      return;
    }

    res.clearCookie("connect.sid");
    res.json({ ok: true, message: "Logged out" });
  });
});

export default router;
