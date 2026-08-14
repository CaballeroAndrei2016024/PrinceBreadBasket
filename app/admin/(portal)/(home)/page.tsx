import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-heading)",
        }}
      >
        Dashboard
      </h1>

      <p
        className="text-muted-foreground"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        Overview of your company&apos;s operation operations.
      </p>

      <div
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        <h2 className="text-lg font-semibold">Admin controls</h2>
        <p className="mt-2 text-sm text-slate-600">
          What users do you want to promote to admin?
        </p>
        <Link
          href="/admin/users"
          className="mt-4 inline-flex items-center rounded-md bg-prince-green px-4 py-2 text-sm font-semibold text-white hover:bg-prince-yellow"
        >
          Manage Users
        </Link>
      </div>
    </div>
  );
};

export default page;
