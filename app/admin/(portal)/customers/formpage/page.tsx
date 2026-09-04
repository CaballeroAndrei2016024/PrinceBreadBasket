import React from "react";
import AdminCustomersRegistrationFormPage from "../components/customersform";

export const metadata = {
  title: "Here is the page for making your Customers",
  description:
    "This is the page where you make your customers in the database..",
};

export default async function AdminProductFormPage() {
  return (
    <div>
      <AdminCustomersRegistrationFormPage />
    </div>
  );
}
