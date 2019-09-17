import { Document, Model, model, Schema } from "mongoose";
import { IAdTask, IAdTaskDocument } from "./AdTask";
import { IUser, IUserDocument } from "./User";

export enum TaskStatus {
  PENDING = "PENDING",
  PAID = "PAID"
}

export interface ICompletedTask {
  task: IAdTaskDocument;
  user: IUserDocument;
  status: TaskStatus;
  data: any;
}

export interface ICompletedTaskDocument extends ICompletedTask, Document {}
export const CompletedTaskSchemaObj = {
  task: {
    type: Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  }
};

export const CompletedTaskSchema = new Schema(CompletedTaskSchemaObj);

export const CompletedTask: Model<ICompletedTaskDocument> = model<
  ICompletedTaskDocument
>("CompletedTask", CompletedTaskSchema);
