import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/libauth";
import Link from "next/link";
import { getAllUsers } from "@/lib/auth";
import UserList from "./components/userlist";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Admin Users",
  description: "Promote Users to Admin.",
};

type Props = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    redirect("/admin/login");
  }

  const { success, error } = (await searchParams) ?? {};
  const users = await getAllUsers();
  const params = (await searchParams) ?? {};
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-3">
        <h1
          className="text-3xl font-semibold"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Admin user management
        </h1>
        <p
          className="max-w-2xl text-sm leading-6 text-slate-600"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Only existing registered users may be promoted to admin. This page is
          visible only to current admins.
        </p>
      </div>

      {success ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          User was successfully promoted to admin.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {params.success ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          {params.success}
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {params.error}
        </div>
      ) : null}

      <UserList users={users} currentUserEmail={currentAdmin.email} />

      <div
        className="mt-6 text-sm text-slate-500"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        <p>Want to see current admin tools? Go back to the admin dashboard.</p>
        <Link
          href="/admin"
          className="mt-3 inline-block text-prince-green underline"
        >
          Admin dashboard
        </Link>
      </div>
    </section>
  );
}

async function promoteUser(formData: FormData) {
  "use server";

  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!email) {
    redirect("/admin/users?error=Email+is+required");
  }

  const { promoteUserToAdmin } = await import("@/lib/auth");

  try {
    await promoteUserToAdmin(email);
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Unable to promote the user.";

    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/users?success=1");
}
