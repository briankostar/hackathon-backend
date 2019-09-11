import { Document, Model, model, Schema } from "mongoose";
import { IAdvertiser } from "./Advertisers";

export interface IAd {
  url: string;
  advertiser: IAdvertiser;
}

export interface IAdDocument extends IAd, Document {}
export const AdSchemaObj = {
  url: {
    type: String,
    required: true
  },
  advertiser: {
    type: Schema.Types.ObjectId,
    required: true
  }
};

export const AdSchema = new Schema(AdSchemaObj);

export const Ad: Model<IAdDocument> = model<IAdDocument>("Ad", AdSchema);
