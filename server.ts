import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Initialize SQLite database
  const db = new Database("pgs.db");
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      type TEXT NOT NULL,
      rent REAL NOT NULL,
      rating REAL,
      groceryDist REAL,
      hospitalDist REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed initial data if accommodations table is empty
  const count: any = db.prepare("SELECT COUNT(*) as count FROM accommodations").get();
  if (count.count === 0) {
    const insert = db.prepare("INSERT INTO accommodations (name, lat, lon, type, rent, rating, groceryDist, hospitalDist) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("Green Valley PG", 30.3200, 78.0400, "PG", 8500, 4.5, 0.5, 1.2);
    insert.run("Skyline Flats", 30.3100, 78.0200, "Flat", 12000, 4.2, 1.5, 0.8);
    insert.run("Student Haven", 30.3180, 78.0350, "PG", 7000, 3.8, 0.2, 2.5);
    insert.run("Comfort Stay", 30.3250, 78.0450, "PG", 9000, 4.7, 0.8, 0.5);
    console.log("Database seeded with initial accommodation data");
  }
  
  app.use(express.json());

  // Auth Routes
  app.post("/api/signup", (req, res) => {
    const { username, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      stmt.run(username, password);
      res.json({ message: "Signup successful" });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ message: "User already exists" });
      }
      throw err;
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", username });
  });

  // Accommodation Routes
  app.get("/api/accommodations", (req, res) => {
    const accommodations = db.prepare("SELECT * FROM accommodations").all();
    res.json(accommodations);
  });

  app.post("/api/accommodations", (req, res) => {
    const { name, lat, lon, type, rent, rating, groceryDist, hospitalDist } = req.body;
    const stmt = db.prepare("INSERT INTO accommodations (name, lat, lon, type, rent, rating, groceryDist, hospitalDist) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const result = stmt.run(name, lat, lon, type, rent, rating, groceryDist, hospitalDist);
    const newAcc = db.prepare("SELECT * FROM accommodations WHERE id = ?").get(result.lastInsertRowid);
    res.json(newAcc);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
