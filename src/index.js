import express from "express";
const app = express();
const PORT = 8080;


// Serve static files from the "static" folder
app.use(express.static("static"));
// Redirect the root path to the existing Lab 3 home page
app.get("/", (req, res) => {
  res.redirect("/Dashboard.html");
});
app.listen(PORT, () => {
  console.log(`Server is listening on http://127.0.0.1:${PORT}`);
});
