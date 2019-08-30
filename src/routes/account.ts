import express from "express";
import passport from "passport";
import {
  getAccount,
  getOauthUnlink,
  getVerifyEmail,
  getVerifyEmailToken,
  postDeleteAccount,
  postUpdatePassword,
  postUpdateProfile
} from "../controllers/account";
import { isAuthenticated } from "../services/passport";

const router = express.Router();

router.get("/account/verify", isAuthenticated, getVerifyEmail);
router.get("/account/verify/:token", isAuthenticated, getVerifyEmailToken);
router.get("/account", isAuthenticated, getAccount);
router.post("/account/profile", isAuthenticated, postUpdateProfile);
router.post("/account/password", isAuthenticated, postUpdatePassword);
router.post("/account/delete", isAuthenticated, postDeleteAccount);
router.get("/account/unlink/:provider", isAuthenticated, getOauthUnlink);

export default router;
