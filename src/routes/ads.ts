import express from "express";
import {
  handleCreateAd,
  handleGetAds
  // handleGetAd,
  // handleDeleteAd,
  // handleEditAd,
} from "../controllers/ads";

const adRouter = express.Router();

adRouter.post("/", handleCreateAd);
adRouter.get("/", handleGetAds);

export { adRouter };
