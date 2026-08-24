import { notFound } from "next/navigation";
import LogDetail from "../components/logsdetails";
import { env } from "@/lib/env";
import { getLogsClient, getReportsClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AdminLogInventoryRow } from "@/app/admin/types";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

//The sales log info as shown by the admin module.
type LogRecord = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;

  beginningRows: AdminLogInventoryRow[];
  additionRows: AdminLogInventoryRow[];
  endingRows: AdminLogInventoryRow[];

  salesPrices: Record<string, number>;

  createdAt?: string | Date;
  updatedAt: string | Date;
};

//To serialize Dates.
function serializeDate(value: string | Date | undefined): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
}

function serializePeriodDate(value: string | Date | undefined): string {
  const serialized = serializeDate(value);

  if (!serialized) {
    return "";
  }

  return serialized.includes("T") ? serialized.split("T")[0] : serialized;
}

//Find a Log by its transactionId.
async function getLogByTransactionNumber(transactionNumber: string) {
  //Client check.
  const client = await getLogsClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_LOGS_DB || "logs");
  const log = (await db
    .collection("logs")
    .findOne({ transactionNumber })) as LogRecord | null;

  if (!log) {
    return null;
  }

  //Find the page indicated by the saleslog variables.
  return {
    ...log,
    _id:
      log._id !== undefined && log._id !== null ? String(log._id) : undefined,

    transactionNumber: log.transactionNumber ?? "",
    salesPrices: log.salesPrices ?? {},

    periodStart: serializePeriodDate(log.periodStart),

    periodEnd: serializePeriodDate(log.periodEnd),

    beginningRows: log.beginningRows ?? [],
    additionRows: log.additionRows ?? [],
    endingRows: log.endingRows ?? [],

    createdAt: serializeDate(log.createdAt),
    updatedAt: serializeDate(log.updatedAt),
  };
}

export default async function LogPage({ params }: PageProps) {
  const { transactionNumber } = await params;
  const log = await getLogByTransactionNumber(transactionNumber.trim());

  if (!log) {
    notFound();
  }

  return <LogDetail log={log} />;
}
