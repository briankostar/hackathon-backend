import mongoose from "mongoose";
import { CONFIG } from "../../configs/configs";
import { logger } from "../logger";

export async function connectToMongo() {
  logger.info("Connecting to mongo");
  await mongoose.connect(CONFIG.DB_URL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
  logger.info("Connected to mongo");
}

export async function disconnectFromMongo() {
  await mongoose.disconnect();
}
