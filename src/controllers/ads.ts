import boom from "boom";
import { Request, Response } from "express";
import _ from "lodash";
import { USER_ERRORS } from "../miscs/errors";
import { getAds } from "../services/db/ads";
import { IAdRequest } from "../miscs/types";
import { IAd, Ad } from "../models/Ad";

export async function handleGetAds(req: Request, res: Response): Promise<void> {
  const ads = await getAds();
  res.json({ status: "success", data: ads });
}

async function saveAd(ad: IAdRequest): Promise<IAd> {
  const newAd = new Ad(ad);
  const savedAd = await newAd.save();
  const returnObj = savedAd.toObject({ versionKey: false });
  delete returnObj._id;
  return returnObj;
}

export async function handleCreateAd(
  req: Request,
  res: Response
): Promise<void> {
  const payload: IAdRequest = req.body;
  // have to get advertiser Id

  //   const requestValidation = validateILeagueEditRequest(payload);
  //   if (requestValidation !== "OK") {
  //     throw boom.badRequest(
  //       `${requestValidation.toUpperCase()}_UNDEFINED_OR_MALFORMED`
  //     );
  //   }
  //   const exist = await doesLeagueExist(payload.leagueId);
  //   if (exist) {
  //     throw boom.badRequest(USER_ERRORS.LEAGUES.LEAGUE_EXISTS);
  //   }
  const ad = await saveAd(payload);
  res.json({ status: "success", data: ad });
}
