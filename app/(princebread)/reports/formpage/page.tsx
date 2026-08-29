import React from "react";
import SalesReportForm from "../components/reportsform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export const metadata = {
  title: "Here is the page for making your Sales Reports",
  description:
    "This is the page where you make your sales reports in the database..",
};
export default async function ReportsFormPage() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div>
      <SalesReportForm />
    </div>
  );
}
