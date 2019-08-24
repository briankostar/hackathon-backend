import cors from "cors";
import express from "express";
import { Server } from "http";
import mongoose from "mongoose";
import { setConfig } from "./configs/configs";

const app = express();
const server = new Server(app);

function initExpress() {
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.get("/", (req, res) => {
    res.status(200).end();
  });
}

export async function main() {
  await setConfig();
  initExpress();
}
