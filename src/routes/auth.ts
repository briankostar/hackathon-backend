import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email", "public_profile"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req: any, res) => {
    res.redirect(req.session.returnTo || "/");
  }
);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets.readonly"
    ],
    // accessType: "offline",
    prompt: "consent"
  })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: any, res) => {
    res.redirect(req.session.returnTo || "/");
  }
);

export default router;
