import React from "react";
import AdminSalesHeaderForm from "../components/salesform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export default async function AdminSalesFormPage() {
  return (
    <div>
      <AdminSalesHeaderForm />
    </div>
  );
}
