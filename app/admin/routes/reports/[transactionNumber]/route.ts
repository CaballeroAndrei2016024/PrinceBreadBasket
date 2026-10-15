import { NextResponse } from "next/server";

import { getCurrentSalesReportByTransactionNumber } from "@/lib/business-logic-necessities/sales-reports";

export const runtime = "nodejs";

// Find a report using its transaction number and current Sales Header data.
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      transactionNumber: string;
    }>;
  },
) {
  try {
    const { transactionNumber } = await params;
    const normalizedTransactionNumber = transactionNumber.trim();

    if (!normalizedTransactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction number is required.",
        },
        { status: 400 },
      );
    }

    const report = await getCurrentSalesReportByTransactionNumber(
      normalizedTransactionNumber,
    );

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found or its Sales Header no longer exists.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        report,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch report:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report",
      },
      { status: 500 },
    );
  }
}
