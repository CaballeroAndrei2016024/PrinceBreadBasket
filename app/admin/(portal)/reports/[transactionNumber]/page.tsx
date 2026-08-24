import { notFound } from "next/navigation";
import ReportDetail from "../components/reportdetails";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

//The report info as shown by the admin module.
type ReportRecord = {
  _id: ObjectId;
  transactionNumber: string;
  productId: string;
  productName: string;
  productPrice: number;
  periodStart: string | Date;
  periodEnd: string | Date;
  total: number;
  rows: {
    id: string;
    date: string;
    qty: number;
    price: number;
  }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

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
    ...report,
    _id:
      typeof report._id === "object" &&
      report._id !== null &&
      "toString" in report._id &&
      typeof report._id.toString === "function"
        ? report._id.toString()
        : String(report._id),

    transactionNumber: report.transactionNumber ?? "",
    productId: report.productId ?? "",
    productName: report.productName ?? "",

    productPrice:
      typeof report.productPrice === "number" ? report.productPrice : 0,

    periodStart:
      report.periodStart instanceof Date
        ? report.periodStart.toISOString().split("T")[0]
        : (report.periodStart ?? ""),

    periodEnd:
      report.periodEnd instanceof Date
        ? report.periodEnd.toISOString().split("T")[0]
        : (report.periodEnd ?? ""),

    createdAt:
      report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : (report.createdAt ?? ""),

    updatedAt:
      report.updatedAt instanceof Date
        ? report.updatedAt.toISOString()
        : (report.updatedAt ?? ""),
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { transactionNumber } = await params;
  const report = await getReportByTransactionNumber(transactionNumber.trim());

  if (!report) {
    notFound();
  }

  return (
    <ReportDetail
      _id={report._id}
      transactionNumber={report.transactionNumber}
      productId={report.productId}
      productName={report.productName}
      productPrice={report.productPrice}
      periodStart={report.periodStart}
      periodEnd={report.periodEnd}
      total={report.total}
      rows={report.rows}
      createdAt={report.createdAt}
      updatedAt={report.updatedAt}
    />
  );
}
