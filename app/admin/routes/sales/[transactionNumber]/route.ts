import { NextResponse } from "next/server";
import { getCurrentSalesHeaderByTransactionNumber } from "@/lib/business-logic-necessities/sales-headers";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionNumber: string }> },
) {
  try {
    const { transactionNumber } = await params;
    const trimmedTransactionNumber = transactionNumber.trim();

    if (!trimmedTransactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction number is required.",
        },
        { status: 400 },
      );
    }

    const sales = await getCurrentSalesHeaderByTransactionNumber(
      trimmedTransactionNumber,
    );

    if (!sales) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        sales,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch sales header:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales header.",
      },
      { status: 500 },
    );
  }
}
