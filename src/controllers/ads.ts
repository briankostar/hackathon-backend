import boom from "boom";
import { Request, Response } from "express";
import _ from "lodash";
import { USER_ERRORS } from "../miscs/errors";
import { getAds } from "../services/db/ads";
import { IAdRequest } from "../miscs/types";
import { IAd, Ad } from "../models/Ad";
import { Advertiser } from "../models/Advertisers";
import { Advertisers } from "../../data/mock";

export async function handleGetAds(req: Request, res: Response): Promise<void> {
  // TODO. fetch ads & all tasks for each.
  const ads = await getAds();
  for (const ad of ads) {
    // find by object id
  }
  res.json({ status: "success", data: ads });
}

async function saveAd(ad: any): Promise<IAd> {
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
  // TODO. Validation & typing.
  // TODO. get advertiser from cookie/jwt

  const existingObj = await Advertiser.findOne({ name: Advertisers[0].name });

  const ad = await saveAd({ url: payload.url, advertiser: existingObj!._id });
  res.json({ status: "success", data: ad });
}
