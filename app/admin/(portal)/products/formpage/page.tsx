import React from "react";
import AdminProductRegistrationFormPage from "../components/productform";

export const metadata = {
  title: "Here is the page for making your Products",
  description:
    "This is the page where you make your products in the database..",
};

export default async function AdminProductFormPage() {
  return (
    <div>
      <AdminProductRegistrationFormPage />
    </div>
  );
}
