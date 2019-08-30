import express from "express";
import passport from "passport";
import {
  getForgot,
  getLogin,
  getReset,
  getSignup,
  logout,
  postForgot,
  postLogin,
  postReset,
  postSignup
} from "../controllers/login";

const router = express.Router();

router.get("/login", getLogin);
router.post("/login", postLogin);
router.get("/logout", logout);
router.get("/forgot", getForgot);
router.post("/forgot", postForgot);
router.get("/reset/:token", getReset);
router.post("/reset/:token", postReset);
router.get("/signup", getSignup);
router.post("/signup", postSignup);

export default router;
