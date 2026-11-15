import express from "express";
import { connectToDatabase, getTickets, getUsers } from './db.js';
import { login } from './login.js';
const app = express();
const PORT = 8080;

async function startServer() {
  try {
    await connectToDatabase();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static("static"));

    // Redirect root path to Dashboard.html
    app.get("/", (req, res) => {
      res.redirect("/Dashboard.html");
    });

    // 2. API route to fetch data from ticket
    app.get('/api/ticket', async (req, res) => {
      try {
        const tickets = await getTickets();
        res.status(200).json(tickets);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
      }
    });

    app.post('/api/login', login);

    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        res.status(400).json({ success: false, message: 'Invalid request data.' });
        return;
      }

      next(err);
    });

    // 3. API route to fetch data from user
    app.get('/api/user', async (req, res) => {
      try {
        const users = await getUsers();
        res.status(200).json(users);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
      }
    });

    // 3. Start the server only after the DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server is listening on http://127.0.0.1:${PORT}`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();