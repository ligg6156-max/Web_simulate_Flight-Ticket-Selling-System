import "dotenv/config";
import express from "express";
import session from "express-session";
import { connectDB } from "./db.js";
import loginRouter from "./login.js";

const app = express();
const PORT = 8080;


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", loginRouter);
app.use(express.static("static"));

app.get("/", (req, res) => {
  res.redirect("/Dashboard.html");
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is listening on http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});
