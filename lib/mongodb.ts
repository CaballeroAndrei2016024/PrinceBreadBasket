// MongoDB functionality is here.
import { MongoClient } from "mongodb";
import { loadEnvFile } from "./env";

loadEnvFile();

// To provide lazy runtime access.
let productClientPromise: Promise<MongoClient> | null = null;
let reportsClientPromise: Promise<MongoClient> | null = null;
let salesClientPromise: Promise<MongoClient> | null = null;
let logsClientPromise: Promise<MongoClient> | null = null;
let customerClientPromise: Promise<MongoClient> | null = null;

function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (!value && required) {
    console.error(`Missing environment variable: ${name}`);
    return undefined;
  }
  return value;
}

async function connectClient(uri: string, label: string): Promise<MongoClient> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error(`MongoDB connection failed for ${label}:`, error);
    throw new Error(
      `MongoDB connection failed for ${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function getProductClient() {
  if (!productClientPromise) {
    const uri = getEnv("MONGODB_PRODUCTS_URI");
    if (!uri) {
      throw new Error("MONGODB_PRODUCTS_URI is missing.");
    }
    productClientPromise = connectClient(uri, "products");
  }

  return productClientPromise;
}

export async function getReportsClient() {
  if (!reportsClientPromise) {
    const uri = getEnv("MONGODB_REPORTS_URI");
    if (!uri) {
      throw new Error("MONGODB_REPORTS_URI is missing.");
    }
    reportsClientPromise = connectClient(uri, "reports");
  }

  return reportsClientPromise;
}

export async function getSalesClient() {
  if (!salesClientPromise) {
    const uri = getEnv("MONGODB_SALES_URI");
    if (!uri) {
      throw new Error("MONGODB_SALES_URI is missing.");
    }
    salesClientPromise = connectClient(uri, "sales");
  }

  return salesClientPromise;
}

export async function getLogsClient() {
  if (!logsClientPromise) {
    const uri = getEnv("MONGODB_LOGS_URI");
    if (!uri) {
      throw new Error("MONGODB_LOGS_URI is missing.");
    }
    logsClientPromise = connectClient(uri, "logs");
  }

  return logsClientPromise;
}

export async function getCustomerClient() {
  if (!customerClientPromise) {
    const uri = getEnv("MONGODB_CUSTOMERS_URI");
    if (!uri) {
      throw new Error("MONGODB_CUSTOMERS_URI is missing.");
    }
    customerClientPromise = connectClient(uri, "customers");
  }

  return customerClientPromise;
}
