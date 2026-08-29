import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getLogsClient } from "@/lib/mongodb";
import AdminSalesLogList from "../components/logslist";
import { AdminSalesLog } from "@/app/admin/types";

export const revalidate = 5; //5 second revalidation.

async function getLogs() {
  const client = await getLogsClient();
  // Client check.
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }
  const db = client.db(env.MONGODB_LOGS_DB || "logs");
  const logsCollection = db.collection("logs");

  const logs = await logsCollection.find().toArray();

  return logs.map((log) => ({
    ...log,
    _id: log._id?.toString?.() ?? log._id,

    transactionNumber: log.transactionNumber ?? "",

    periodStart: log.periodStart ?? "",
    periodEnd: log.periodEnd ?? "",

    beginningRows: Array.isArray(log.beginningRows) ? log.beginningRows : [],
    additionRows: Array.isArray(log.additionRows) ? log.additionRows : [],
    endingRows: Array.isArray(log.endingRows) ? log.endingRows : [],

    salesPrices:
      typeof log.salesPrices === "object" && log.salesPrices !== null
        ? log.salesPrices
        : {},

    createdAt:
      log.createdAt instanceof Date
        ? log.createdAt.toISOString()
        : log.createdAt,
  })) as AdminSalesLog[];
}

export const metadata = {
  title: "Here is the page for your Sales Logs",
  description:
    "This is the page where you can see your company's sales logs. You can also choose to edit or delete them.",
};

export default async function SalesLogPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  const logs = await getLogs();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Logs
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Sales Logs:
        </p>
        <AdminSalesLogList logs={logs} />
      </div>
    </div>
  );
}
