import React from "react";
import AdminSalesReportForm from "../components/reportsform";

export const metadata = {
  title: "Here is the page for making your Sales Reports",
  description:
    "This is the page where you make your sales reports in the database..",
};

export default async function AdminSalesReportFormPage() {
  return (
    <div>
      <AdminSalesReportForm />
    </div>
  );
}
