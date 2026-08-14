import React from "react";
import SalesReportForm from "../components/reportsform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

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
