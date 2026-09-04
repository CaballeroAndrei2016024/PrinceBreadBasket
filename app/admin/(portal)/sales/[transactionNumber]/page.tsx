import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import SalesHeaderDetail from "../components/salesdetails";
import { env } from "@/lib/env";
import { getReportsClient, getSalesClient } from "@/lib/mongodb";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

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

type SalesHeaderRecord = {
  _id: ObjectId;
  transactionNumber: string;
  customerCode: string;
  date: string | Date;

  reportId: string;

  productId: string;
  productName: string;
  productPrice: number;

  reportTransaction: string;
  periodStart: string | Date;
  periodEnd: string | Date;

  rows: {
    id: string;
    date: string;
    qty: number;
    price: number;
  }[];

  total: number;

  createdAt?: string | Date;
  updatedAt?: string | Date;
};

//Fetch the reports available for the sales header to use.
async function getReports() {
  //Client check.
  const client = await getReportsClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_REPORTS_DB || "reports");
  const reports = (await db
    .collection("reports")
    .find({})
    .toArray()) as ReportRecord[];

  //Find the list of reports.
  return reports.map((report) => ({
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
  }));
}

//Find a sales Header by its transactionId.
async function getSalesHeaderByTransactionNumber(transactionNumber: string) {
  const client = await getSalesClient();
  const db = client.db(env.MONGODB_SALES_DB || "sales");
  const sales = (await db
    .collection("sales")
    .findOne({ transactionNumber })) as SalesHeaderRecord | null;

  if (!sales) {
    return null;
  }

  //Find the page indicated by the sales header variables.
  return {
    _id:
      typeof sales._id === "object" &&
      sales._id !== null &&
      "toString" in sales._id &&
      typeof sales._id.toString === "function"
        ? sales._id.toString()
        : String(sales._id),

    transactionNumber: sales.transactionNumber ?? "",
    customerCode: sales.customerCode ?? "",

    date:
      sales.date instanceof Date
        ? sales.date.toISOString().split("T")[0]
        : (sales.date ?? ""),

    reportId: sales.reportId ?? "",
    reportTransaction: sales.reportTransaction ?? "",

    productId: sales.productId ?? "",
    productName: sales.productName ?? "",

    productPrice:
      typeof sales.productPrice === "number" ? sales.productPrice : 0,

    periodStart:
      sales.periodStart instanceof Date
        ? sales.periodStart.toISOString().split("T")[0]
        : (sales.periodStart ?? ""),

    periodEnd:
      sales.periodEnd instanceof Date
        ? sales.periodEnd.toISOString().split("T")[0]
        : (sales.periodEnd ?? ""),

    rows: Array.isArray(sales.rows) ? sales.rows : [],

    total: typeof sales.total === "number" ? sales.total : 0,

    createdAt:
      sales.createdAt instanceof Date
        ? sales.createdAt.toISOString()
        : (sales.createdAt ?? ""),

    updatedAt:
      sales.updatedAt instanceof Date
        ? sales.updatedAt.toISOString()
        : (sales.updatedAt ?? ""),
  };
}

export default async function SalesHeaderPage({ params }: PageProps) {
  const { transactionNumber } = await params;
  const sales = await getSalesHeaderByTransactionNumber(
    transactionNumber.trim(),
  );

  if (!sales) {
    notFound();
  }

  const reports = await getReports();

  const report = reports.find(
    (availableReport) => availableReport._id === sales.reportId,
  );

  if (!report) {
    notFound();
  }
  return <SalesHeaderDetail sales={sales} report={report} reports={reports} />;
}
