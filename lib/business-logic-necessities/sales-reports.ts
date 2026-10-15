//Make the report reflect what the sales header currently says.

import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import {
  getCurrentSalesHeaders,
  type CurrentSalesHeader,
} from "@/lib/business-logic-necessities/sales-headers";

export type CurrentSalesReport = CurrentSalesHeader & {
  _id: string;
  periodStart: string;
  periodEnd: string;
  createdAt?: string;
  updatedAt?: string;
};

function serializeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value ?? "");
}

function serializeTimestamp(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : undefined;
}

async function resolveSalesReports(salesReports: Record<string, unknown>[]) {
  if (salesReports.length === 0) {
    return [];
  }

  const salesHeaders = await getCurrentSalesHeaders();
  const salesHeadersByNumber = new Map(
    salesHeaders.map((salesHeader) => [
      salesHeader.transactionNumber,
      salesHeader,
    ]),
  );

  return salesReports.flatMap((report) => {
    const transactionNumber = String(report.transactionNumber ?? "").trim();
    const salesHeader = salesHeadersByNumber.get(transactionNumber);

    if (!salesHeader) {
      return [];
    }

    return [
      {
        ...salesHeader,
        _id: String(report._id ?? ""),
        periodStart: serializeDate(report.periodStart),
        periodEnd: serializeDate(report.periodEnd),
        createdAt: serializeTimestamp(report.createdAt),
        updatedAt: serializeTimestamp(report.updatedAt),
      },
    ];
  });
}

export async function getCurrentSalesReports(): Promise<CurrentSalesReport[]> {
  const reportsClient = await getReportsClient();
  const reportsDb = reportsClient.db(env.MONGODB_REPORTS_DB || "reports");
  const salesRecords = await reportsDb.collection("reports").find({}).toArray();

  return resolveSalesReports(salesRecords);
}

export async function getCurrentSalesReportByTransactionNumber(
  transactionNumber: string,
): Promise<CurrentSalesReport | null> {
  const reportsClient = await getReportsClient();
  const reportsDb = reportsClient.db(env.MONGODB_REPORTS_DB || "reports");
  const salesReport = await reportsDb.collection("reports").findOne({
    transactionNumber: transactionNumber.trim(),
  });

  if (!salesReport) {
    return null;
  }

  const [resolvedSalesReport] = await resolveSalesReports([salesReport]);
  return resolvedSalesReport ?? null;
}
