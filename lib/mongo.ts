//MongoDB functionality is here.
import { MongoClient } from "mongodb";
import { loadEnvFile } from "./env";

loadEnvFile();

//To provide lazy runtime access.
let userClientPromise: Promise<MongoClient> | null = null;

function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (!value && required) {
    console.error(`What is wrong with you, ${name}!?!?!?`);
    return undefined;
  }
  return value;
}

export async function getAuthClient() {
  if (!userClientPromise) {
    const uri = getEnv("MONGODB_AUTH_URI");

    console.log("MONGODB_AUTH_URI =", uri);

    if (!uri) {
      throw new Error("MONGODB_AUTH_URI is missing.");
    }

    const client = new MongoClient(uri);

    try {
      await client.connect();
      console.log("Successfully connected to MongoDB.");
      userClientPromise = Promise.resolve(client);
    } catch (err) {
      console.error("MongoDB connection failed:", err);
      throw err;
    }
  }

  return userClientPromise;
}
