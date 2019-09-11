import { Document, Model, model, Schema } from "mongoose";
import { IAd } from "./Ad";

export interface IAdTask {
  title: string;
  description: string;
  ad: IAd;
  url: string;
  amount: number;
}

export interface IAdTaskDocument extends IAdTask, Document {}
export const AdTaskSchemaObj = {
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  ad: {
    type: Schema.Types.ObjectId,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
};

export const AdTaskSchema = new Schema(AdTaskSchemaObj);

export const AdTask: Model<IAdTaskDocument> = model<IAdTaskDocument>(
  "AdTask",
  AdTaskSchema
);
