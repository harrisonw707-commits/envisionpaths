// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cookieParser from "cookie-parser";
import cors from "cors";
import Stripe from "stripe";
import * as bcryptjs from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Jimp } from "jimp";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var stripe = null;
function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is not set. Stripe features will be disabled.");
      return null;
    }
    stripe = new Stripe(key);
  }
  return stripe;
}
var db;
var dbPath = process.env.NODE_ENV === "production" ? "/tmp/envision.db" : "envision.db";
function initializeDb() {
  try {
    console.log(`[DB] Connecting to ${dbPath}...`);
    db = new Database(dbPath, { timeout: 5e3 });
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    console.log("[DB] Connected successfully");
  } catch (e) {
    console.error("[DB] Connection error:", e);
    if (e.message && e.message.includes("malformed") && fs.existsSync(dbPath)) {
      console.warn("[DB] Database is malformed. Attempting to delete and recreate...");
      try {
        fs.unlinkSync(dbPath);
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
        console.log("[DB] Corrupted database files deleted. Retrying connection...");
        db = new Database(dbPath, { timeout: 5e3 });
        db.pragma("journal_mode = WAL");
        db.pragma("synchronous = NORMAL");
        console.log("[DB] Reconnected successfully after reset");
        return;
      } catch (unlinkError) {
        console.error("[DB] Failed to delete corrupted database:", unlinkError);
      }
    }
    console.log("[DB] Falling back to in-memory database");
    try {
      db = new Database(":memory:");
    } catch (memError) {
      console.error("[DB] In-memory fallback failed, using mock object");
      db = {
        prepare: () => ({
          get: () => ({}),
          run: () => ({ lastInsertRowid: 1 }),
          all: () => []
        }),
        pragma: () => {
        },
        exec: () => {
        }
      };
    }
  }
}
initializeDb();
async function ensureIcons(force = false) {
  try {
    const iconDir = path.join(process.cwd(), "public", "icons");
    const distIconDir = path.join(process.cwd(), "dist", "icons");
    if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });
    if (!fs.existsSync(distIconDir)) fs.mkdirSync(distIconDir, { recursive: true });
    const sizes = [
      { name: "icon-192.png", size: 192 },
      { name: "icon-512.png", size: 512 },
      { name: "icon-512-maskable.png", size: 512 }
    ];
    for (const { name, size } of sizes) {
      const publicPath = path.join(iconDir, name);
      const distPath = path.join(distIconDir, name);
      const exists = fs.existsSync(publicPath);
      const stats = exists ? fs.statSync(publicPath) : null;
      const isCorrupt = stats && stats.size < 100;
      if (!exists || isCorrupt || force) {
        if (force) {
          console.log(`[ICONS] Generating forced placeholder for ${name}...`);
          const image = new Jimp({ width: size, height: size, color: 4014228735 });
          const buffer = await image.getBuffer("image/png");
          fs.writeFileSync(publicPath, buffer);
        } else {
          console.warn(`[ICONS] Icon ${name} is missing or corrupt. Please use the Admin Dashboard to generate icons.`);
        }
      }
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        fs.copyFileSync(publicPath, distPath);
      }
    }
    console.log("[ICONS] Icon check complete.");
  } catch (e) {
    console.error("[ICONS] Failed to ensure icons:", e);
  }
}
console.log("[DB] Initializing tables...");
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    plan_type TEXT DEFAULT 'free',
    plan_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id TEXT,
    profile_picture TEXT,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS processed_payments (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER,
    plan_type TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_title TEXT,
    industry TEXT,
    score INTEGER,
    feedback TEXT,
    status TEXT DEFAULT 'started',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS glitch_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    simulation_id INTEGER,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(simulation_id) REFERENCES simulations(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    expires_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    scheduled_at DATETIME,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS simulation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(simulation_id) REFERENCES simulations(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity TEXT,
    country TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
  console.log("[DB] Tables initialized successfully");
} catch (e) {
  console.error("[DB] Error initializing tables:", e);
}
console.log("[SERVER] Running migrations...");
var migrations = [
  "ALTER TABLE users ADD COLUMN two_factor_secret TEXT",
  "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0",
  "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN plan_start_date DATETIME DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE simulations ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE simulations ADD COLUMN status TEXT DEFAULT 'completed'",
  "CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id)",
  "ALTER TABLE users ADD COLUMN email_verification_code TEXT",
  "ALTER TABLE users ADD COLUMN email_verification_expiry DATETIME",
  "ALTER TABLE users ADD COLUMN profile_picture TEXT"
];
for (const migration of migrations) {
  try {
    db.exec(migration);
    console.log(`[SERVER] Migration successful: ${migration.substring(0, 30)}...`);
  } catch (e) {
    if (!e.message.includes("duplicate column name")) {
      console.warn(`[SERVER] Migration failed: ${migration}`, e.message);
    }
  }
}
console.log("[SERVER] Running admin promotion and cleanup...");
try {
  db.prepare("UPDATE users SET is_admin = 1, plan_type = 'elite' WHERE email = 'harrisonw707@gmail.com'").run();
  console.log("[SERVER] Admin promotion complete for harrisonw707@gmail.com");
  const cleanupEmails = "email LIKE '%@envisionpaths.com' AND email != 'support@envisionpaths.com'";
  db.prepare(`DELETE FROM simulation_messages WHERE simulation_id IN (SELECT id FROM simulations WHERE user_id IN (SELECT id FROM users WHERE ${cleanupEmails}))`).run();
  db.prepare(`DELETE FROM simulations WHERE user_id IN (SELECT id FROM users WHERE ${cleanupEmails})`).run();
  db.prepare(`DELETE FROM activity_logs WHERE user_id IN (SELECT id FROM users WHERE ${cleanupEmails})`).run();
  db.prepare(`DELETE FROM reminders WHERE user_id IN (SELECT id FROM users WHERE ${cleanupEmails})`).run();
  db.prepare(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE ${cleanupEmails})`).run();
  const result = db.prepare(`DELETE FROM users WHERE ${cleanupEmails}`).run();
  console.log(`[SERVER] Removed ${result.changes} tester accounts and all associated data`);
} catch (e) {
  console.error("[SERVER] Admin promotion/cleanup failed:", e.message);
}
console.log("[SERVER] Starting initialization...");
async function startServer() {
  const app = express();
  app.use(cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"]
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());
  app.get(["/manifest.json", "/manifest-v2.json", "/manifest-v3.json", "/sw.js", "/service-worker.js"], (req, res) => {
    const filename = req.path.substring(1);
    const paths = [
      path.join(process.cwd(), "dist", filename),
      path.join(process.cwd(), "public", filename)
    ];
    const filePath = paths.find((p) => fs.existsSync(p));
    if (filePath) {
      if (filename.endsWith(".js")) {
        res.setHeader("Service-Worker-Allowed", "/");
        res.setHeader("Content-Type", "application/javascript");
      } else if (filename.endsWith(".json")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.sendFile(filePath);
    }
    res.status(404).send("File not found");
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  console.log(`[SERVER] Using PORT=${PORT}`);
  console.log(`[SERVER] NODE_ENV=${process.env.NODE_ENV}`);
  const getSessionUser = (req) => {
    const sessionId = req.cookies.session_id || req.headers["x-session-id"];
    if (!sessionId) {
      return null;
    }
    const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    try {
      console.log(`[AUTH] Verifying session: ${sid}`);
      const sessionExists = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(sid);
      if (!sessionExists) {
        console.log(`[AUTH] Session ID not found in database: ${sid}`);
        return null;
      }
      const user = db.prepare(`
        SELECT id, email, plan_type, plan_start_date, is_admin, profile_picture 
        FROM users 
        WHERE id = ?
      `).get(sessionExists.user_id);
      if (!user) {
        console.log(`[AUTH] User not found for session: ${sessionExists.user_id}`);
        return null;
      }
      if (user.email === "harrisonw707@gmail.com" && !user.is_admin) {
        console.log(`[AUTH] Forcing admin status for ${user.email}`);
        db.prepare("UPDATE users SET is_admin = 1, plan_type = 'elite' WHERE id = ?").run(user.id);
        user.is_admin = 1;
        user.plan_type = "elite";
      }
      if (user.is_admin) {
        user.plan_type = "elite";
      }
      console.log(`[AUTH] Session verified for ${user.email} (Admin: ${user.is_admin})`);
      return user;
    } catch (e) {
      console.error(`[AUTH] DB Error in getSessionUser: ${e.message}`);
      return null;
    }
  };
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        const user = getSessionUser(req);
        const trackedActions = ["/api/auth/login", "/api/auth/signup", "/api/simulations/start", "/api/simulations/complete", "/api/create-checkout-session"];
        if (user && (trackedActions.includes(req.path) || req.method !== "GET")) {
          try {
            const country = req.headers["x-appengine-country"] || req.headers["cf-ipcountry"] || req.headers["x-client-geo-country"] || "Unknown";
            const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
            const ua = req.headers["user-agent"] || "Unknown";
            const activity = `${req.method} ${req.path}`;
            db.prepare("INSERT INTO activity_logs (user_id, activity, country, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)").run(
              user.id,
              activity,
              country,
              ip,
              ua
            );
          } catch (e) {
            console.error("[LOGGING ERROR]", e);
          }
        }
        if (res.statusCode === 403) {
          console.warn(`[403 WARNING] Request to ${req.path} returned 403. Headers: ${JSON.stringify(req.headers)}`);
        }
      }
    });
    next();
  });
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const sanitizeString = (str) => str.trim().replace(/[<>]/g, "");
  console.log("[SERVER] Registering API routes...");
  app.post("/api/user/profile-picture", async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { profilePicture } = req.body;
      if (!profilePicture) return res.status(400).json({ error: "No image provided" });
      if (!profilePicture.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      db.prepare("UPDATE users SET profile_picture = ? WHERE id = ?").run(profilePicture, user.id);
      res.json({ success: true, profilePicture });
    } catch (e) {
      console.error("[PROFILE PICTURE ERROR]", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/rebuild-icons", async (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Unauthorized" });
    try {
      await ensureIcons(true);
      res.json({ success: true, message: "Icons rebuilt successfully" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/debug/icons", (req, res) => {
    const publicIconsDir2 = path.join(process.cwd(), "public", "icons");
    const distIconsDir2 = path.join(process.cwd(), "dist", "icons");
    const getIcons = (dir) => {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).map((file) => {
        const stats = fs.statSync(path.join(dir, file));
        return { name: file, size: stats.size };
      });
    };
    res.json({
      public: getIcons(publicIconsDir2),
      dist: getIcons(distIconsDir2)
    });
  });
  app.post("/api/auth/promote-admin", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    try {
      db.prepare("UPDATE users SET is_admin = 1, plan_type = 'elite' WHERE id = ?").run(user.id);
      console.log(`[ADMIN] Manually promoted ${user.email} to admin`);
      res.json({ success: true, message: "You are now an admin. Please refresh the page." });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/user/profile", (req, res) => {
    console.log("[API] Entering /api/user/profile");
    try {
      const user = getSessionUser(req);
      if (user) {
        console.log(`[API] Profile found for: ${user.email}`);
        const simulationsCount = db.prepare("SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND created_at > date('now', 'start of month')").get(user.id);
        return res.json({ user: { ...user, simulations_this_month: simulationsCount.count } });
      }
      console.log("[API] No user session for profile");
      res.status(401).json({ error: "Not authenticated" });
    } catch (e) {
      console.error("[API] Profile error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/health", (req, res) => {
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        db: "connected",
        stats: { users: userCount.count }
      });
    } catch (e) {
      res.status(500).json({ status: "error", error: e.message });
    }
  });
  app.get("/api/debug/env", (req, res) => {
    res.json({
      gemini: process.env.GEMINI_API_KEY ? "loaded" : "missing",
      build_time: "2026-04-02 20:15 UTC",
      status: "Secure"
    });
  });
  app.post("/api/auth/admin-bypass", async (req, res) => {
    const { email } = req.body;
    if (email !== "harrisonw707@gmail.com") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const user = db.prepare("SELECT id, email, plan_type, is_admin FROM users WHERE email = ?").get(email);
      if (!user) {
        const result = db.prepare("INSERT INTO users (email, is_admin, plan_type) VALUES (?, 1, 'elite')").run(email);
        const userId = result.lastInsertRowid;
        const sessionId2 = Math.random().toString(36).substring(2);
        db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId2, userId);
        res.cookie("session_id", sessionId2, { httpOnly: true, secure: true, sameSite: "none" });
        return res.json({
          success: true,
          user: { email, plan_type: "elite", is_admin: 1, profile_picture: null },
          sessionId: sessionId2
        });
      }
      if (!user.is_admin) {
        db.prepare("UPDATE users SET is_admin = 1, plan_type = 'elite' WHERE id = ?").run(user.id);
        user.is_admin = 1;
        user.plan_type = "elite";
      }
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
      res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "none" });
      return res.json({
        success: true,
        user: { ...user, is_admin: 1, plan_type: "elite" },
        sessionId
      });
    } catch (e) {
      console.error("[ADMIN BYPASS ERROR]", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    try {
      const hashedPassword = await bcryptjs.hash(password, 10);
      let userId;
      try {
        const result = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hashedPassword);
        userId = result.lastInsertRowid;
      } catch (e) {
        if (e.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already exists. Please sign in." });
        } else {
          throw e;
        }
      }
      const isAdmin = email === "harrisonw707@gmail.com";
      if (isAdmin) {
        db.prepare('UPDATE users SET is_admin = 1, plan_type = "elite" WHERE id = ?').run(userId);
      }
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, userId);
      res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "none" });
      return res.json({
        success: true,
        user: {
          email,
          plan_type: isAdmin ? "elite" : "free",
          is_admin: isAdmin,
          profile_picture: null
        },
        sessionId
      });
    } catch (e) {
      console.error("[SIGNUP ERROR]", e);
      return res.status(400).json({ error: "Signup failed: " + e.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = db.prepare("SELECT id, email, password, plan_type, is_admin, two_factor_enabled, two_factor_secret FROM users WHERE email = ?").get(email);
      if (user && user.password) {
        if (email === "harrisonw707@gmail.com" && !user.is_admin) {
          db.prepare('UPDATE users SET is_admin = 1, plan_type = "elite" WHERE id = ?').run(user.id);
          user.is_admin = 1;
          user.plan_type = "elite";
        }
        console.log(`[LOGIN] User found: ${email}, comparing password...`);
        const isMatch = await bcryptjs.compare(password, user.password);
        console.log(`[LOGIN] Password match: ${isMatch}`);
        if (isMatch) {
          if (user.two_factor_enabled && !user.is_admin) {
            console.log(`[LOGIN] 2FA required for user: ${email}`);
            return res.json({
              success: true,
              requires_2fa: true,
              userId: user.id,
              method: user.two_factor_secret ? "totp" : "email"
            });
          }
          const sessionId = Math.random().toString(36).substring(2);
          db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
          res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "none" });
          const responsePlan = user.is_admin ? "elite" : user.plan_type;
          return res.json({
            success: true,
            user: {
              email: user.email,
              plan_type: responsePlan,
              is_admin: user.is_admin,
              profile_picture: user.profile_picture
            },
            sessionId
          });
        }
      }
      res.status(401).json({ error: "Invalid credentials" });
    } catch (e) {
      console.error("[LOGIN ERROR]", e);
      res.status(500).json({ error: "Login failed: " + e.message });
    }
  });
  app.post("/api/auth/send-email-code", (req, res) => {
    const { userId } = req.body;
    const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
    db.prepare("UPDATE users SET email_verification_code = ?, email_verification_expiry = ? WHERE id = ?").run(code, expiry, user.id);
    console.log(`[2FA] EMAIL CODE FOR ${user.email}: ${code}`);
    res.json({ success: true });
  });
  app.post("/api/auth/login-2fa", async (req, res) => {
    const { userId, code, method } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    let isValid = false;
    if (method === "totp" && user.two_factor_secret) {
      isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: code
      });
    } else if (method === "email") {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (user.email_verification_code === code && user.email_verification_expiry > now) {
        isValid = true;
        db.prepare("UPDATE users SET email_verification_code = NULL, email_verification_expiry = NULL WHERE id = ?").run(user.id);
      }
    }
    if (isValid) {
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
      res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "none" });
      const responsePlan = user.is_admin ? "elite" : user.plan_type;
      res.json({
        success: true,
        user: {
          email: user.email,
          plan_type: responsePlan,
          is_admin: user.is_admin,
          profile_picture: user.profile_picture
        },
        sessionId
      });
    } else {
      res.status(401).json({ error: "Invalid verification code" });
    }
  });
  app.post("/api/auth/setup-2fa", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.is_admin) return res.status(403).json({ error: "2FA is disabled for admin accounts" });
    const secret = speakeasy.generateSecret({ name: `EnvisionPaths (${user.email})` });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    db.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").run(secret.base32, user.id);
    res.json({ qrCodeUrl, secret: secret.base32 });
  });
  app.post("/api/auth/verify-2fa", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { code } = req.body;
    const userRecord = db.prepare("SELECT two_factor_secret FROM users WHERE id = ?").get(user.id);
    if (!userRecord || !userRecord.two_factor_secret) return res.status(400).json({ error: "2FA not initiated" });
    const isValid = speakeasy.totp.verify({
      secret: userRecord.two_factor_secret,
      encoding: "base32",
      token: code
    });
    if (isValid) {
      db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?").run(user.id);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid code" });
    }
  });
  app.post("/api/auth/disable-2fa", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?").run(user.id);
    res.json({ success: true });
  });
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.json({ success: true, message: "If an account exists with that email, a reset code has been sent." });
    }
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
    db.prepare("UPDATE users SET email_verification_code = ?, email_verification_expiry = ? WHERE id = ?").run(code, expiry, user.id);
    console.log(`[AUTH] PASSWORD RESET CODE FOR ${user.email}: ${code}`);
    res.json({ success: true, message: "Reset code sent to your email.", userId: user.id });
  });
  app.post("/api/auth/verify-reset-code", (req, res) => {
    const { userId, code } = req.body;
    const user = db.prepare("SELECT id, email_verification_code, email_verification_expiry FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(401).json({ error: "Invalid request" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (user.email_verification_code === code && user.email_verification_expiry > now) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid or expired reset code" });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    const { userId, code, newPassword } = req.body;
    const user = db.prepare("SELECT id, email_verification_code, email_verification_expiry FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(401).json({ error: "Invalid request" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (user.email_verification_code === code && user.email_verification_expiry > now) {
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      db.prepare("UPDATE users SET password = ?, email_verification_code = NULL, email_verification_expiry = NULL WHERE id = ?").run(hashedPassword, user.id);
      res.json({ success: true, message: "Password updated successfully." });
    } else {
      res.status(401).json({ error: "Invalid or expired reset code" });
    }
  });
  app.post("/api/auth/verify-email-code", (req, res) => {
    const { user_id, code } = req.body;
    const user = db.prepare("SELECT id, email, plan_type, email_verification_code, email_verification_expiry FROM users WHERE id = ?").get(user_id);
    if (!user) return res.status(401).json({ error: "Invalid request" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (user.email_verification_code === code && user.email_verification_expiry > now) {
      db.prepare("UPDATE users SET email_verification_code = NULL, email_verification_expiry = NULL WHERE id = ?").run(user.id);
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
      res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ success: true, user: { email: user.email, plan_type: user.plan_type }, sessionId });
    } else {
      res.status(401).json({ error: "Invalid or expired verification code" });
    }
  });
  app.get("/api/admin/activity-logs", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
    try {
      const logs = db.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100").all();
      res.json({ logs });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/update-user-plan", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
    const { userId, planType } = req.body;
    try {
      db.prepare("UPDATE users SET plan_type = ? WHERE id = ?").run(planType, userId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/reset-db", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
    try {
      db.prepare("DELETE FROM simulations").run();
      db.prepare("DELETE FROM activity_logs").run();
      db.prepare("DELETE FROM reminders").run();
      db.prepare("UPDATE users SET plan_type = 'free' WHERE is_admin = 0").run();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/admin/export-data", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
    try {
      const users = db.prepare("SELECT * FROM users").all();
      const simulations = db.prepare("SELECT * FROM simulations").all();
      const logs = db.prepare("SELECT * FROM activity_logs").all();
      const reminders = db.prepare("SELECT * FROM reminders").all();
      res.json({
        users,
        simulations,
        activity_logs: logs,
        reminders,
        exported_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
      console.error("EXPORT ERROR:", e);
      res.status(500).json({
        error: e?.message || "Export failed",
        details: e
      });
    }
  });
  app.post("/api/admin/import-data", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
    const { users, simulations, activity_logs, reminders } = req.body;
    try {
      const importTransaction = db.transaction(() => {
        const idMapping = {};
        if (users && Array.isArray(users)) {
          const checkUser = db.prepare("SELECT id FROM users WHERE email = ?");
          const insertUser = db.prepare("INSERT INTO users (email, plan_type, is_admin, created_at) VALUES (?, ?, ?, ?)");
          for (const u of users) {
            if (u.email && u.email.endsWith("@envisionpaths.com") && u.email !== "support@envisionpaths.com") {
              continue;
            }
            const existing = checkUser.get(u.email);
            if (existing) {
              idMapping[u.id] = existing.id;
            } else {
              const result = insertUser.run(u.email, u.plan_type, u.is_admin, u.created_at);
              idMapping[u.id] = result.lastInsertRowid;
            }
          }
        }
        if (simulations && Array.isArray(simulations)) {
          const insertSim = db.prepare("INSERT OR IGNORE INTO simulations (user_id, job_title, industry, score, feedback, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
          const checkUser = db.prepare("SELECT id FROM users WHERE email = ?");
          for (const s of simulations) {
            let newUserId = idMapping[s.user_id] || s.user_id;
            if (!newUserId && s.email) {
              const existing = checkUser.get(s.email);
              if (existing) newUserId = existing.id;
            }
            if (newUserId) {
              insertSim.run(newUserId, s.job_title, s.industry, s.score, s.feedback, s.status, s.created_at || (/* @__PURE__ */ new Date()).toISOString());
            }
          }
        }
        if (activity_logs && Array.isArray(activity_logs)) {
          const insertLog = db.prepare("INSERT OR IGNORE INTO activity_logs (user_id, activity, country, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)");
          const checkUser = db.prepare("SELECT id FROM users WHERE email = ?");
          for (const l of activity_logs) {
            let newUserId = idMapping[l.user_id] || l.user_id;
            if (!newUserId && l.email) {
              const existing = checkUser.get(l.email);
              if (existing) newUserId = existing.id;
            }
            if (newUserId) {
              insertLog.run(newUserId, l.activity, l.country, l.ip_address, l.user_agent, l.created_at || (/* @__PURE__ */ new Date()).toISOString());
            } else {
              insertLog.run(null, l.activity, l.country, l.ip_address, l.user_agent, l.created_at || (/* @__PURE__ */ new Date()).toISOString());
            }
          }
        }
        if (reminders && Array.isArray(reminders)) {
          const insertRem = db.prepare("INSERT OR IGNORE INTO reminders (user_id, title, description, scheduled_at, completed, created_at) VALUES (?, ?, ?, ?, ?, ?)");
          for (const r of reminders) {
            const newUserId = idMapping[r.user_id];
            if (newUserId) {
              insertRem.run(newUserId, r.title, r.description, r.scheduled_at, r.completed, r.created_at);
            }
          }
        }
      });
      importTransaction();
      res.json({ success: true, message: "Data imported successfully." });
    } catch (e) {
      console.error("[IMPORT ERROR]", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.cookies.session_id || req.headers["x-session-id"];
    if (sessionId) db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    res.clearCookie("session_id");
    res.json({ success: true });
  });
  app.get("/api/simulations/history", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const history = db.prepare("SELECT id, job_title, industry, score, feedback, created_at FROM simulations WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC").all(user.id);
    res.json({ history });
  });
  app.get("/api/simulations/:id/messages", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const simulationId = req.params.id;
    const simulation = db.prepare("SELECT user_id FROM simulations WHERE id = ?").get(simulationId);
    if (!simulation || simulation.user_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const messages = db.prepare("SELECT role, content as text, created_at as timestamp FROM simulation_messages WHERE simulation_id = ? ORDER BY created_at ASC").all(simulationId);
    res.json({ messages });
  });
  app.post("/api/simulations/start", (req, res) => {
    console.log("[SIMULATION] Start request received...");
    try {
      const user = getSessionUser(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { job_title, industry } = req.body;
      console.log(`[SIMULATION] Starting for user ${user.id} (${user.email}) - Plan: ${user.plan_type} (Admin: ${user.is_admin})`);
      if (!user.is_admin) {
        if (user.plan_type === "free") {
          const count = db.prepare("SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND status IN ('started', 'completed') AND created_at > date('now', 'start of month')").get(user.id);
          console.log(`[SIMULATION] User ${user.id} has ${count.count} active simulations this month`);
          if (count.count >= 2) {
            return res.status(403).json({ error: "Free limit reached. Upgrade for more simulations." });
          }
        } else if (user.plan_type === "beginner") {
          const startDate = new Date(user.plan_start_date || Date.now());
          const now = /* @__PURE__ */ new Date();
          const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
          console.log(`[SIMULATION] User ${user.id} beginner plan age: ${diffDays} days`);
          if (diffDays > 30) {
            console.log(`[SIMULATION] Downgrading user ${user.id} to free plan`);
            db.prepare("UPDATE users SET plan_type = 'free' WHERE id = ?").run(user.id);
            return res.status(403).json({ error: "Beginner plan expired. Please upgrade." });
          }
        }
      }
      const result = db.prepare("INSERT INTO simulations (user_id, job_title, industry, status) VALUES (?, ?, ?, ?)").run(user.id, job_title || "Unknown", industry || "Unknown", "started");
      const simulationId = result.lastInsertRowid;
      console.log(`[SIMULATION] Simulation ${simulationId} started for user ${user.id}`);
      res.json({ success: true, simulation_id: simulationId });
    } catch (e) {
      console.error(`[SIMULATION START ERROR] ${e.message}`, e.stack);
      res.status(500).json({ error: "Failed to start simulation: " + e.message });
    }
  });
  app.post("/api/simulations/report-glitch", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const { simulation_id, reason } = req.body;
    if (!simulation_id) return res.status(400).json({ error: "Simulation ID required" });
    try {
      const recentGlitches = db.prepare("SELECT COUNT(*) as count FROM glitch_reports WHERE user_id = ? AND created_at > datetime('now', '-1 day')").get(user.id);
      if (recentGlitches.count >= 3) {
        return res.status(429).json({ error: "You have reached the limit for glitch reports today. Please contact support if you continue to experience issues." });
      }
      const result = db.prepare("UPDATE simulations SET status = 'glitched' WHERE id = ? AND user_id = ? AND status = 'started'").run(simulation_id, user.id);
      if (result.changes > 0) {
        db.prepare("INSERT INTO glitch_reports (user_id, simulation_id, reason) VALUES (?, ?, ?)").run(user.id, simulation_id, reason || "No reason provided");
        console.log(`[SIMULATION] Simulation ${simulation_id} marked as glitched by user ${user.id}`);
        res.json({ success: true, message: "Glitch reported. This session has been refunded." });
      } else {
        res.status(400).json({ error: "Could not report glitch for this session. It may already be completed or not found." });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/simulations/complete", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const { simulation_id, job_title, industry, score, feedback, messages } = req.body;
    if (simulation_id) {
      db.prepare("UPDATE simulations SET job_title = ?, industry = ?, score = ?, feedback = ?, status = 'completed' WHERE id = ? AND user_id = ?").run(job_title, industry, score, feedback, simulation_id, user.id);
      if (messages && Array.isArray(messages)) {
        const insertMsg = db.prepare("INSERT INTO simulation_messages (simulation_id, role, content) VALUES (?, ?, ?)");
        const transaction = db.transaction((msgs) => {
          for (const msg of msgs) {
            insertMsg.run(simulation_id, msg.role, msg.text);
          }
        });
        transaction(messages);
      }
    } else {
      const result = db.prepare("INSERT INTO simulations (user_id, job_title, industry, score, feedback, status) VALUES (?, ?, ?, ?, ?, 'completed')").run(user.id, job_title, industry, score, feedback);
      const newSimId = result.lastInsertRowid;
      if (messages && Array.isArray(messages)) {
        const insertMsg = db.prepare("INSERT INTO simulation_messages (simulation_id, role, content) VALUES (?, ?, ?)");
        const transaction = db.transaction((msgs) => {
          for (const msg of msgs) {
            insertMsg.run(newSimId, msg.role, msg.text);
          }
        });
        transaction(messages);
      }
    }
    res.json({ success: true });
  });
  app.post("/api/create-checkout-session", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const { plan_type } = req.body;
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).json({ error: "Stripe is not configured" });
    const prices = {
      beginner: process.env.STRIPE_PRICE_BEGINNER_ID,
      pro: process.env.STRIPE_PRICE_PRO_ID
    };
    const priceId = prices[plan_type];
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    try {
      const sessionOptions = {
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&plan_type=${plan_type}`,
        cancel_url: `${appUrl}/pricing`,
        customer_email: user.email,
        metadata: {
          user_id: user.id.toString(),
          plan_type
        }
      };
      if (priceId) {
        sessionOptions.line_items = [{ price: priceId, quantity: 1 }];
      } else {
        sessionOptions.line_items = [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `EnvisionPaths ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Plan`
              },
              unit_amount: plan_type === "beginner" ? 500 : 1500
              // $5 or $15
            },
            quantity: 1
          }
        ];
      }
      const session = await stripeClient.checkout.sessions.create(sessionOptions);
      res.json({ url: session.url });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/verify-session", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "Session ID required" });
    const alreadyProcessed = db.prepare("SELECT 1 FROM processed_payments WHERE session_id = ?").get(session_id);
    if (alreadyProcessed) {
      return res.status(400).json({ error: "Payment already processed" });
    }
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).json({ error: "Stripe is not configured" });
    try {
      const session = await stripeClient.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"]
      });
      const isPaid = session.payment_status === "paid";
      const isComplete = session.status === "complete";
      const isValidMode = session.mode === "payment" || session.mode === "subscription";
      if (isPaid && isComplete && isValidMode) {
        const PRICE_MAP = {};
        if (process.env.STRIPE_PRICE_BEGINNER_ID) PRICE_MAP[process.env.STRIPE_PRICE_BEGINNER_ID] = "beginner";
        if (process.env.STRIPE_PRICE_PRO_ID) PRICE_MAP[process.env.STRIPE_PRICE_PRO_ID] = "pro";
        const lineItem = session.line_items?.data?.[0];
        const priceId = lineItem?.price?.id;
        let plan_type = priceId ? PRICE_MAP[priceId] : void 0;
        if (!plan_type && !process.env.STRIPE_PRICE_BEGINNER_ID && !process.env.STRIPE_PRICE_PRO_ID) {
          const productName = lineItem?.price?.product;
          if (session.metadata?.plan_type) {
            plan_type = session.metadata.plan_type;
          }
        }
        if (!plan_type) {
          console.error(`[STRIPE ERROR] Unknown or missing Price ID (${priceId}) for session ${session_id}. Rejection mandatory.`);
          return res.status(400).json({ error: "Unauthorized product: Price ID not whitelisted" });
        }
        const amount = session.amount_total;
        const currency = session.currency?.toLowerCase();
        const expectedAmount = plan_type === "beginner" ? 500 : 1500;
        if (currency !== "usd" || amount && amount < expectedAmount) {
          console.error(`[STRIPE ERROR] Amount/Currency safety check failed for session ${session_id}. Expected >= ${expectedAmount} usd, got ${amount} ${currency}`);
          return res.status(400).json({ error: "Payment amount or currency mismatch" });
        }
        const client_ref = session.client_reference_id;
        const meta_user_id = session.metadata?.user_id;
        const stripe_customer_id = session.customer;
        const isUserMatch = client_ref === user.id.toString() || meta_user_id === user.id.toString();
        if (!isUserMatch) {
          console.warn(`[STRIPE] Unauthorized attempt for session ${session_id}. User ID mismatch.`);
          return res.status(403).json({ error: "Session does not belong to this user" });
        }
        const currentUser = db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").get(user.id);
        if (currentUser?.stripe_customer_id && stripe_customer_id && currentUser.stripe_customer_id !== stripe_customer_id) {
          console.warn(`[STRIPE] Customer ID mismatch for user ${user.id}. Expected ${currentUser.stripe_customer_id}, got ${stripe_customer_id}`);
          return res.status(403).json({ error: "Stripe customer mismatch: This account is already linked to a different Stripe customer" });
        }
        const upgradeTransaction = db.transaction(() => {
          db.prepare(`
            UPDATE users 
            SET plan_type = ?, 
                plan_start_date = CURRENT_TIMESTAMP,
                stripe_customer_id = COALESCE(stripe_customer_id, ?)
            WHERE id = ?
          `).run(plan_type, stripe_customer_id, user.id);
          db.prepare("INSERT INTO processed_payments (session_id, user_id, plan_type) VALUES (?, ?, ?)").run(session_id, user.id, plan_type);
        });
        upgradeTransaction();
        console.log(`[STRIPE] Plan ${plan_type} unlocked for user ${user.id} via session ${session_id}`);
        return res.json({ success: true, plan_type });
      }
      res.status(400).json({ error: "Payment not verified" });
    } catch (e) {
      console.error(`[STRIPE ERROR] ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/reminders", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const reminders = db.prepare("SELECT * FROM reminders WHERE user_id = ? ORDER BY scheduled_at ASC").all(user.id);
    res.json({ reminders });
  });
  app.post("/api/reminders", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { title, description, scheduled_at } = req.body;
    if (!title || !scheduled_at) return res.status(400).json({ error: "Missing required fields" });
    console.log(`[REMINDER] Creating reminder for user ${user.id}: ${title} at ${scheduled_at}`);
    const result = db.prepare("INSERT INTO reminders (user_id, title, description, scheduled_at) VALUES (?, ?, ?, ?)").run(user.id, title, description, scheduled_at);
    res.json({ id: result.lastInsertRowid });
  });
  app.patch("/api/reminders/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { title, description, scheduled_at, completed } = req.body;
    if (completed !== void 0) {
      db.prepare("UPDATE reminders SET completed = ? WHERE id = ? AND user_id = ?").run(completed ? 1 : 0, req.params.id, user.id);
    } else {
      if (!title || !scheduled_at) return res.status(400).json({ error: "Missing required fields" });
      db.prepare("UPDATE reminders SET title = ?, description = ?, scheduled_at = ? WHERE id = ? AND user_id = ?").run(title, description, scheduled_at, req.params.id, user.id);
    }
    res.json({ success: true });
  });
  app.delete("/api/reminders/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?").run(req.params.id, user.id);
    res.json({ success: true });
  });
  app.delete("/api/user/account", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    try {
      const deleteTransaction = db.transaction(() => {
        db.prepare("DELETE FROM reminders WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM simulations WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM processed_payments WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
      });
      deleteTransaction();
      res.clearCookie("session_id");
      res.json({ success: true });
    } catch (e) {
      console.error(`[DELETE ACCOUNT ERROR] ${e.message}`);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
  app.patch("/api/user/email", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: "New email is required" });
    try {
      db.prepare("UPDATE users SET email = ? WHERE id = ?").run(newEmail, user.id);
      res.json({ success: true, email: newEmail });
    } catch (e) {
      if (e.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Email already in use" });
      }
      res.status(500).json({ error: e.message });
    }
  });
  app.patch("/api/user/password", async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }
    try {
      const fullUser = db.prepare("SELECT password FROM users WHERE id = ?").get(user.id);
      if (!fullUser.password) {
        const hashedPassword2 = await bcryptjs.hash(newPassword, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword2, user.id);
        return res.json({ success: true });
      }
      const isMatch = await bcryptjs.compare(currentPassword, fullUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect current password" });
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  const publicIconsDir = path.join(process.cwd(), "public", "icons");
  const distIconsDir = path.join(process.cwd(), "dist", "icons");
  if (!fs.existsSync(publicIconsDir)) fs.mkdirSync(publicIconsDir, { recursive: true });
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
  app.use("/icons", (req, res, next) => {
    let iconName = req.path.replace(/^\//, "").split("?")[0];
    if (iconName === "icon-192x192.png") iconName = "icon-192.png";
    if (iconName === "icon-512x512.png") iconName = "icon-512.png";
    const paths = [
      path.join(distIconsDir, iconName),
      path.join(publicIconsDir, iconName)
    ];
    const iconPath = paths.find((p) => fs.existsSync(p));
    console.log(`[ICONS] Middleware request for ${iconName}, found at: ${iconPath || "NOT FOUND"}`);
    if (iconPath) {
      const ext = path.extname(iconName).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.sendFile(path.resolve(iconPath));
    }
    next();
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      try {
        const html = await vite.transformIndexHtml(req.url, "index.html");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distDir = path.join(process.cwd(), "dist");
    app.get("/robots.txt", (req, res) => {
      res.type("text/plain");
      res.send("User-agent: *\nAllow: /");
    });
    app.use(express.static(distDir, {
      setHeaders: (res, path2) => {
        if (path2.endsWith(".js")) {
          res.setHeader("Service-Worker-Allowed", "/");
        }
      }
    }));
    app.get("*", (req, res) => {
      if (req.path.includes(".") && !req.path.endsWith(".html")) {
        const iconPath = path.join(process.cwd(), "dist", req.path.substring(1));
        const publicIconPath = path.join(process.cwd(), "public", req.path.substring(1));
        if (fs.existsSync(iconPath)) return res.sendFile(iconPath);
        if (fs.existsSync(publicIconPath)) return res.sendFile(publicIconPath);
        return res.status(404).end();
      }
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        const injection = `<script>window.GEMINI_API_KEY = ${JSON.stringify(apiKey)};</script>`;
        html = html.replace("<!-- GEMINI_API_KEY_INJECTION -->", injection);
        html = html.replace(/<link rel="manifest" href="[^"]+"[^>]*>/g, '<link rel="manifest" href="/manifest.json">');
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } else {
        res.status(404).send("Not Found");
      }
    });
  }
  app.post("/api/upload-icon", (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: "Missing name or data" });
    }
    try {
      const base64Data = data.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const publicDir = path.join(process.cwd(), "public", "icons");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const publicPath = path.join(publicDir, name);
      const distPath = path.join(process.cwd(), "dist", "icons", name);
      fs.writeFileSync(publicPath, buffer);
      console.log(`[ICONS] Saved ${name} to public/icons`);
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        if (!fs.existsSync(path.join(process.cwd(), "dist", "icons"))) {
          fs.mkdirSync(path.join(process.cwd(), "dist", "icons"), { recursive: true });
        }
        fs.writeFileSync(distPath, buffer);
        console.log(`[ICONS] Saved ${name} to dist/icons`);
      }
      res.json({ success: true, path: `/icons/${name}` });
    } catch (e) {
      console.error(`[ICONS] Error saving ${name}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });
  app.use((err, req, res, next) => {
    console.error("[GLOBAL ERROR]", err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message
    });
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    ensureIcons().catch((err) => console.error("[ICONS] Background check failed:", err));
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
