import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { Pool } from "pg";
import Stripe from "stripe";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "development-secret";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const db = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: "30m" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  return next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fitai-api" });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, name } = req.body;
  const user = { id: "usr_demo", email, name, role: "user" };
  res.status(201).json({ user, accessToken: signToken(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email } = req.body;
  const user = { id: "usr_demo", email, name: "FitAI User", role: "user" };
  res.json({ user, accessToken: signToken(user) });
});

app.post("/api/auth/password-recovery", async (req, res) => {
  res.json({ message: `Recovery instructions queued for ${req.body.email}` });
});

app.post("/api/auth/social", async (req, res) => {
  const provider = req.body.provider || "google";
  const user = { id: `usr_${provider}`, email: req.body.email, name: req.body.name, role: "user" };
  res.json({ user, accessToken: signToken(user) });
});

app.get("/api/profile", requireAuth, async (_req, res) => {
  res.json({
    age: 29,
    gender: "male",
    heightCm: 178,
    weightKg: 82,
    goal: "fat_loss_muscle_tone",
    activityLevel: "moderate",
    dietPreference: "high_protein_vegetarian",
    healthConsiderations: ["lower_back_tightness"]
  });
});

app.put("/api/profile", requireAuth, async (req, res) => {
  res.json({ profile: req.body, message: "Profile saved" });
});

app.post("/api/ai/assessment", requireAuth, async (req, res) => {
  res.json({
    readinessScore: 82,
    workoutPlan: {
      split: "4 strength, 2 cardio, 1 recovery",
      sessionMinutes: [38, 45],
      equipment: req.body.equipment || ["dumbbells", "bands", "mat"]
    },
    nutritionPlan: {
      calories: 2180,
      proteinGrams: 140,
      carbsGrams: 180,
      fatGrams: 62,
      hydrationLiters: 3
    },
    safetyNotes: ["Avoid high-impact plyometrics", "Use controlled tempo on squats"]
  });
});

app.get("/api/dashboard", requireAuth, async (_req, res) => {
  res.json({
    caloriesBurned: 684,
    waterLiters: 2.1,
    workoutStreakDays: 18,
    proteinRemainingGrams: 32,
    nextReminder: "18:30",
    recommendation: "Use goblet squats today and cap RPE at 7."
  });
});

app.get("/api/workouts", requireAuth, async (_req, res) => {
  res.json([
    { id: "w_strength", level: "beginner", category: "strength", title: "Full Body Builder", minutes: 42 },
    { id: "w_cardio", level: "beginner", category: "cardio", title: "Zone 2 Endurance", minutes: 35 },
    { id: "w_yoga", level: "beginner", category: "mobility", title: "Lower Back Reset", minutes: 18 }
  ]);
});

app.get("/api/nutrition/today", requireAuth, async (_req, res) => {
  res.json({
    calories: 2180,
    macros: { protein: 140, carbs: 180, fat: 62 },
    hydrationLiters: 3,
    meals: [
      { name: "Greek yogurt bowl", calories: 480, protein: 42 },
      { name: "Paneer quinoa bowl", calories: 620, protein: 44 },
      { name: "Dal, tofu tikka, brown rice", calories: 710, protein: 46 }
    ]
  });
});

app.get("/api/progress", requireAuth, async (_req, res) => {
  res.json({
    weightTrendKg: [86.5, 85.8, 85.1, 84.6, 83.4, 82.7, 81.9],
    bmi: 25.8,
    bodyFatPercent: 21.4,
    completionRate: 0.92,
    achievements: ["18-day workout streak", "5 kg lost", "92% plan adherence"]
  });
});

app.post("/api/chat", requireAuth, async (req, res) => {
  res.json({
    reply: `Based on your profile, I would tailor "${req.body.message}" around your current readiness and health notes.`,
    actions: ["generate_workout", "generate_meal_plan", "set_reminder"]
  });
});

app.get("/api/subscriptions/plans", async (_req, res) => {
  res.json([
    { id: "free", name: "Free", priceInr: 0 },
    { id: "monthly", name: "Monthly Premium", priceInr: 499 },
    { id: "quarterly", name: "Quarterly Premium", priceInr: 1299 },
    { id: "yearly", name: "Yearly Premium", priceInr: 4499 }
  ]);
});

app.post("/api/payments/checkout", requireAuth, async (req, res) => {
  if (!stripe) return res.json({ provider: "mock", checkoutUrl: "https://checkout.example/fitai-demo", plan: req.body.planId });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: req.body.stripePriceId, quantity: 1 }],
    success_url: req.body.successUrl,
    cancel_url: req.body.cancelUrl
  });

  res.json({ provider: "stripe", checkoutUrl: session.url });
});

app.post("/api/notifications/register", requireAuth, async (req, res) => {
  res.status(201).json({ tokenRegistered: Boolean(req.body.fcmToken) });
});

app.get("/api/admin/metrics", requireAuth, requireAdmin, async (_req, res) => {
  res.json({
    users: 12480,
    monthlyRecurringRevenueInr: 1840000,
    aiTokensPerDay: 1800000,
    apiUptime: 0.972
  });
});

app.locals.db = db;

app.listen(port, () => {
  console.log(`FitAI API listening on http://localhost:${port}`);
});
