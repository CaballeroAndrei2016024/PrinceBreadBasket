// Layout for the admin module. Also comes with free session validation.

import { redirect } from "next/navigation";
import AdminNavbar from "@/app/admin/components/adminnavbar";
import { getCurrentAdmin } from "@/lib/libauth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdmin();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
