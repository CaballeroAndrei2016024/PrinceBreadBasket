import fs from "fs";
import path from "path";

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadEnvFile() {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), "princebreadbasket"),
    path.resolve(process.cwd(), "..", "princebreadbasket"),
  ];

  for (const baseDir of candidates) {
    const envLocalPath = path.join(baseDir, ".env.local");
    if (fs.existsSync(envLocalPath)) {
      parseEnvFile(envLocalPath);
      return;
    }
  }

  for (const baseDir of candidates) {
    const envPath = path.join(baseDir, ".env");
    if (fs.existsSync(envPath)) {
      parseEnvFile(envPath);
      return;
    }
  }
}

loadEnvFile();

//Configure secret key for admin verification.
const secretKey = process.env.AUTH_SECRET;

if (!secretKey) {
  throw new Error("No secret key? Really?");
}

//Environmental variables for MongoDB and authentication.
export const env = {
  AUTH_SECRET: secretKey,
  MONGODB_AUTH_URI: process.env.MONGODB_AUTH_URI,
  MONGODB_AUTH_DB: process.env.MONGODB_AUTH_DB,
  MONGODB_PRODUCTS_URI: process.env.MONGODB_PRODUCTS_URI,
  MONGODB_PRODUCTS_DB: process.env.MONGODB_PRODUCTS_DB,
  MONGODB_REPORTS_URI: process.env.MONGODB_REPORTS_URI,
  MONGODB_REPORTS_DB: process.env.MONGODB_REPORTS_DB,
  MONGODB_SALES_URI: process.env.MONGODB_SALES_URI,
  MONGODB_SALES_DB: process.env.MONGODB_SALES_DB,
  MONGODB_LOGS_URI: process.env.MONGODB_LOGS_URI,
  MONGODB_LOGS_DB: process.env.MONGODB_LOGS_DB,
  MONGODB_BUSINESS_URI: process.env.MONGODB_BZ_SETTINGS_URI,
  MONGODB_BUSINESS_DB: process.env.MONGODB_BZ_SETTINGS_DB,
};
