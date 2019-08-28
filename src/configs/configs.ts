import { logger } from "../services/logger";

class Config {
  public ENVIRONMENT: string;
  public PORT: number;
  public BASE_URL: string;
  public DB_URL: string;
  public GOOGLE_ID: string;
  public GOOGLE_SECRET: string;
  public FACEBOOK_ID: string;
  public FACEBOOK_SECRET: string;

  constructor() {
    this.ENVIRONMENT = setConfig("ENVIRONMENT");
    this.PORT = setNumberConfig("PORT");
    this.BASE_URL = setConfig("BASE_URL");
    this.DB_URL = setConfig("DB_URL");
    this.GOOGLE_ID = setConfig("GOOGLE_ID");
    this.GOOGLE_SECRET = setConfig("GOOGLE_SECRET");
    this.FACEBOOK_ID = setConfig("FACEBOOK_ID");
    this.FACEBOOK_SECRET = setConfig("FACEBOOK_SECRET");
  }
}

function setConfig(key: string): string {
  if (process.env[key] !== undefined) {
    return process.env[key] as string;
  } else {
    throw new Error(`Config ${key} is undefined!`);
  }
}

function setNumberConfig(key: string): number {
  return parseInt(setConfig(key), 10);
}

function setSyncConfigs() {
  CONFIG = new Config();
}

async function setAsyncConfigs() {}

export let CONFIG: Config;

export async function setConfigs() {
  setSyncConfigs();
  await setAsyncConfigs();
  logger.info(CONFIG);
}
