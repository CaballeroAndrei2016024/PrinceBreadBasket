import { notFound } from "next/navigation";
import ReportDetail from "../components/reportdetails";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AdminTransactionRow } from "@/app/admin/types";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

//The report info as shown by the admin module.
type ReportRecord = {
  _id: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  rows: AdminTransactionRow[];
  createdAt?: string;
  updatedAt?: string;
};

//Serialize dates.

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

//Find a report by its transactionId.
async function getReportByTransactionNumber(transactionNumber: string) {
  //Client check.
  const client = await getReportsClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_REPORTS_DB || "reports");
  const report = (await db
    .collection("reports")
    .findOne({ transactionNumber })) as ReportRecord | null;

  if (!report) {
    return null;
  }

  //Find the page indicated by the report variables.
  return {
    _id: report._id.toString(),
    transactionNumber: report.transactionNumber,
    periodStart: serializePeriodDate(report.periodStart),
    periodEnd: serializePeriodDate(report.periodEnd),
    rows: Array.isArray(report.rows) ? report.rows : [],
    total: typeof report.total === "number" ? report.total : 0,
    createdAt: serializeDate(report.createdAt),
    updatedAt: serializeDate(report.updatedAt),
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { transactionNumber } = await params;
  const report = await getReportByTransactionNumber(transactionNumber.trim());

  if (!report) {
    notFound();
  }

  return <ReportDetail report={report} />;
}
