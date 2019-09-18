import { Ad, IAd } from "../../models/Ad";

export async function getAds(): Promise<IAd[]> {
  return Ad.find({})
    .populate("tasks")
    .select("-_id -__v")
    .lean();
}
