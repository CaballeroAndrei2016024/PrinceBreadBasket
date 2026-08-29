import React from "react";

import AdminSalesLogForm from "../components/logsform";

export const metadata = {
  title: "Here is the page for making your Sales Logs",
  description:
    "This is the page where you make your sales logs in the database..",
};

export default async function LogFormPage() {
  return (
    <div>
      <AdminSalesLogForm />
    </div>
  );
}
