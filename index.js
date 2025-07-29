const express = require("express");
require("dotenv").config();
const app = express();

console.log("🔧 Starting server setup...");
console.log("Loaded ENV variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("PORT:", process.env.PORT);

// Add test route
app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

// Final startup
const port = process.env.PORT;
if (!port) {
  console.error("❌ PORT not defined");
  process.exit(1);
}

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
