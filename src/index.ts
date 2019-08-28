import cors from "cors";
import express from "express";
import { Server } from "http";
import { CONFIG, setConfigs } from "./configs/configs";
import { connectToMongo } from "./services/mongoose";

const app = express();
const server = new Server(app);

function initExpress() {
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.get("/", (req, res) => {
    res.send("Server is up");
  });

  app.listen(CONFIG.PORT, () => {
    console.log("Example app listening on port 3000!");
  });
}

export async function main() {
  await setConfigs();
  await connectToMongo();
  initExpress();
}

main();
