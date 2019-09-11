import { Document, Model, model, Schema } from "mongoose";

export interface IAdvertiser {
  name: string;
  balance: number;
}

export interface IAdvertiserDocument extends IAdvertiser, Document {}
export const AdvertiserSchemaObj = {
  name: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  }
};

export const AdvertiserSchema = new Schema(AdvertiserSchemaObj);

export const Advertiser: Model<IAdvertiserDocument> = model<
  IAdvertiserDocument
>("Advertiser", AdvertiserSchema);
