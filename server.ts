import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage (simulating the Java repositories)
  const users: any[] = [];
  const accommodations: any[] = [
    { id: 1, name: "Green Valley PG", lat: 30.3200, lon: 78.0400, type: "PG", rent: 8500, rating: 4.5, groceryDist: 0.5, hospitalDist: 1.2 },
    { id: 2, name: "Skyline Flats", lat: 30.3100, lon: 78.0200, type: "Flat", rent: 12000, rating: 4.2, groceryDist: 1.5, hospitalDist: 0.8 },
    { id: 3, name: "Student Haven", lat: 30.3180, lon: 78.0350, type: "PG", rent: 7000, rating: 3.8, groceryDist: 0.2, hospitalDist: 2.5 },
    { id: 4, name: "Comfort Stay", lat: 30.3250, lon: 78.0450, type: "PG", rent: 9000, rating: 4.7, groceryDist: 0.8, hospitalDist: 0.5 },
  ];

  // Auth Routes
  app.post("/api/signup", (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: "User already exists" });
    }
    users.push({ username, password });
    res.json({ message: "Signup successful" });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", username });
  });

  // Accommodation Routes
  app.get("/api/accommodations", (req, res) => {
    res.json(accommodations);
  });

  app.post("/api/accommodations", (req, res) => {
    const newAcc = { id: Date.now(), ...req.body };
    accommodations.push(newAcc);
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
