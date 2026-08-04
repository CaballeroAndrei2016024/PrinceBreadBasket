import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import ReportsList, { type Report } from "../components/reportslist";

export const revalidate = 5; //5 second revalidation.

async function getReports() {
  const client = await getReportsClient();
  const db = client.db(env.MONGODB_REPORTS_DB || "reports");
  const reportsCollection = db.collection("reports");

  const reports = await reportsCollection.find().toArray();
  return reports.map((report) => ({
    ...report,

    _id: report._id?.toString?.() ?? report._id,

    productId: report.productId ?? "",
    productName: report.productName ?? "",
    productPrice:
      typeof report.productPrice === "number" ? report.productPrice : 0,

    transactionNumber: report.transactionNumber ?? "",

    periodStart: report.periodStart ?? "",
    periodEnd: report.periodEnd ?? "",

    rows: Array.isArray(report.rows) ? report.rows : [],

    total: typeof report.total === "number" ? report.total : 0,

    createdAt:
      report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : report.createdAt,
  })) as Report[];
}

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const reports = await getReports();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Reports
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Reports:
        </p>
      </div>

      <ReportsList reports={reports} />
    </div>
  );
}
