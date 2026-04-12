import { Router } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import {
  getUserByEmail,
  createUser,
  upsertOtp,
  verifyAndConsumeOtp,
  getOtpCreatedAt,
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  getUserById,
} from "../store.js";
import { sendOtpEmail } from "../services/email.js";
import { requireAuth } from "../middleware/auth.js";
import { randomInt } from "crypto";

const router = Router();

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.body?.email ?? ipKeyGenerator(req)).toLowerCase(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please request a new code." },
});

const REFRESH_COOKIE = "tg_refresh";
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

router.post("/request-otp", async (req, res) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const lastSent = await getOtpCreatedAt(email);
    if (lastSent && Date.now() - lastSent.getTime() < 60 * 1000) {
      return res.status(429).json({ error: "Please wait before requesting another code" });
    }

    const otp = String(randomInt(100000, 1000000));
    await upsertOtp(email, otp);
    await sendOtpEmail(email, otp);

    res.json({ message: "Code sent" });
  } catch (err) {
    console.error("[auth] request-otp error:", err);
    res.status(500).json({ error: "Failed to send code" });
  }
});

router.post("/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    const otp = String(req.body?.otp ?? "").trim();

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const valid = await verifyAndConsumeOtp(email, otp);
    if (!valid) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    let user = await getUserByEmail(email);
    if (!user) user = await createUser(email);

    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({ accessToken, user });
  } catch (err) {
    console.error("[auth] verify-otp error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const record = await getRefreshToken(token);
    if (!record || new Date() > new Date(record.expires_at)) {
      res.clearCookie(REFRESH_COOKIE, { path: "/", secure: IS_PROD, sameSite: IS_PROD ? "none" : "strict" });
      return res.status(401).json({ error: "Session expired" });
    }

    const user = await getUserById(record.user_id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    await deleteRefreshToken(token);
    const newRefreshToken = await createRefreshToken(user.id);
    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTS);

    const accessToken = signAccessToken(user.id);
    res.json({ accessToken, user });
  } catch (err) {
    console.error("[auth] refresh error:", err);
    res.status(500).json({ error: "Refresh failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await deleteRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE, { path: "/", secure: IS_PROD, sameSite: IS_PROD ? "none" : "strict" });
    res.status(204).send();
  } catch (err) {
    console.error("[auth] logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
