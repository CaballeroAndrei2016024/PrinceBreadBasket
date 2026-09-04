"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

type CustomerImage = {
  fileName?: string;
  mimeType?: string;
  size?: number;
  data?: string;
};

export type AdminCustomer = {
  _id: string;
  customerCode: string;
  customerName: string;
  birthDate: string;
  address: string;
  phoneNumber?: string;
  customerImage?: CustomerImage;
  createdAt?: string;
};

type CustomerListProps = {
  customers: AdminCustomer[];
};

const AdminCustomersList = ({ customers }: CustomerListProps) => {
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Customers
        </h2>
        <span className="text-sm text-slate-700">
          {customers.length} item(s)
        </span>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-slate-700">
          No customers have been saved yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {customers.map((customer) => {
            const imageData = customer.customerImage?.data;
            const imageSrc = imageData
              ? `data:${customer.customerImage?.mimeType || "image/png"};base64,${imageData}`
              : null;

            return (
              <Link
                href={`/admin/customers/${customer.customerCode}`}
                key={customer.customerCode}
                className="rounded-lg border border-prince-yellow bg-white p-4 shadow-sm"
              >
                {customer.customerCode && (
                  <div className="mb-2 text-xs text-slate-500">
                    ID: {customer.customerCode}
                  </div>
                )}
                {imageSrc ? (
                  <Image
                    width={200}
                    height={200}
                    src={imageSrc}
                    alt={customer.customerName}
                    className="mb-3 h-40 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">
                    No image available
                  </div>
                )}

                <h3 className="text-lg font-semibold text-prince-shadow/50">
                  {customer.customerName}
                </h3>
                <p className="mt-1 text-sm text-slate-700">
                  Address: {customer.address}
                </p>
                <p className="text-sm text-slate-700">
                  Birthdate: {customer.birthDate}
                </p>
              </Link>
            );
          })}
        </div>
      )}
      <Link
        href="/admin/customers/formpage"
        className="
block
w-full
box-border
rounded-md
border-2
border-prince-shadow/50
bg-prince-green/50
px-[30px]
py-5
text-center
text-[20px]
text-black
hover:italic
hover:text-prince-orange
hover:font-mono
"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        Create New Customer
      </Link>
    </div>
  );
};

export default AdminCustomersList;
