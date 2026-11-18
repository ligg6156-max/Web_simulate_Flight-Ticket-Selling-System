import express from "express";
import session from 'express-session';
import { connectToDatabase, getTickets, getUsers, getSeatState, addOccupiedSeat, createOrder } from './db.js';
import { login } from './login.js';
import { register } from './Register.js';
const app = express();
const PORT = 8080;

async function startServer() {
  try {
    await connectToDatabase();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(session({
      secret: process.env.SESSION_SECRET || 'skyblue-development-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax' }
    }));
    app.use(express.static("static"));

    function requireLogin(req, res, next) {
      if (!req.session.user) {
        res.status(401).json({ success: false, message: 'Please log in before booking.' });
        return;
      }
      next();
    }

    app.get('/api/session', (req, res) => {
      res.status(200).json({
        authenticated: Boolean(req.session.user),
        user: req.session.user || null
      });
    });

    app.post('/api/logout', (req, res) => {
      if (!req.session.user) {
        res.status(200).json({ success: true, message: 'Already logged out.' });
        return;
      }

      req.session.destroy(err => {
        if (err) {
          res.status(500).json({ success: false, message: 'Unable to log out.' });
          return;
        }

        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
      });
    });

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

    app.get('/api/seat', requireLogin, async (req, res) => {
      const flightsNo = typeof req.query.flights_No === 'string'
        ? req.query.flights_No.trim()
        : '';

      if (!flightsNo) {
        res.status(400).json({ error: 'flights_No is required.' });
        return;
      }

      try {
        const seatState = await getSeatState(flightsNo);

        if (!seatState) {
          res.status(404).json({ error: `No seat state found for flight ${flightsNo}.` });
          return;
        }

        res.status(200).json(seatState);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch seat state', details: err.message });
      }
    });

    app.post('/api/seat', requireLogin, async (req, res) => {
      const flightsNo = typeof req.body?.flights_No === 'string'
        ? req.body.flights_No.trim()
        : '';
      const seatId = typeof req.body?.seat === 'string'
        ? req.body.seat.trim().toUpperCase()
        : '';

      if (!flightsNo || !seatId) {
        res.status(400).json({ error: 'flights_No and seat are required.' });
        return;
      }

      try {
        const seatState = await addOccupiedSeat(flightsNo, seatId);

        if (!seatState) {
          res.status(404).json({ error: `No seat state found for flight ${flightsNo}.` });
          return;
        }

        res.status(200).json(seatState);
      } catch (err) {
        res.status(500).json({ error: 'Failed to update seat state', details: err.message });
      }
    });

    app.post('/api/order', requireLogin, async (req, res) => {
      const requiredFields = [
        'bookingReference',
        'flights_No',
        'seat',
        'buyerName',
        'buyerEmail',
        'departure',
        'destination',
        'price'
      ];

      const missingField = requiredFields.find(field =>
        req.body?.[field] === undefined || req.body?.[field] === null || req.body?.[field] === ''
      );

      if (missingField) {
        res.status(400).json({ error: `${missingField} is required.` });
        return;
      }

      try {
        const order = await createOrder({
          bookingReference: String(req.body.bookingReference),
          username: req.session.user.username,
          buyerName: String(req.body.buyerName).trim(),
          buyerEmail: String(req.body.buyerEmail).trim(),
          flights_No: String(req.body.flights_No),
          seat: String(req.body.seat).toUpperCase(),
          departure: String(req.body.departure),
          destination: String(req.body.destination),
          departureTime: req.body.departureTime || null,
          seats_type: req.body.seats_type || null,
          price: Number(req.body.price),
          status: 'paid',
          paidAt: new Date()
        });

        res.status(201).json(order);
      } catch (err) {
        res.status(500).json({ error: 'Failed to create order', details: err.message });
      }
    });

    app.post('/api/login', login);
    app.post('/api/register', register);

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