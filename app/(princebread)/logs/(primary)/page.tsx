import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { getCurrentSalesLogs } from "@/lib/business-logic-necessities/sales-logs";
import type { Log } from "@/app/(princebread)/types";
import SalesLogList from "../components/logslist";

export const revalidate = 0;

async function getLogs(): Promise<Log[]> {
  return getCurrentSalesLogs();
}

export const metadata = {
  title: "Here is the page for your Sales Logs",
  description: "This is the page where you can see your company's sales logs.",
};

export default async function SalesLogPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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
      </div>

      <SalesLogList logs={logs} />
    </div>
  );
}
