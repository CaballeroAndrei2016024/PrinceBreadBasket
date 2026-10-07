import { NextResponse } from "next/server";
import { getCurrentSalesLogById } from "@/lib/business-logic-necessities/sales-logs";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Log ID is required.",
        },
        { status: 400 },
      );
    }

    const log = await getCurrentSalesLogById(id);

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Log not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, log }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch sales log:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales log.",
      },
      { status: 500 },
    );
  }
}
