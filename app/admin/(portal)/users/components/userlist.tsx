import { User } from "@/app/admin/types";
import React from "react";

type UserListProps = {
  users: User[];
  currentUserEmail: string;
};

const UserList = ({ users, currentUserEmail }: UserListProps) => {
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-6 flex flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          App Users
        </h2>

        <span className="text-sm text-slate-700">{users.length} user(s)</span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-slate-700">
          No users have been registered yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user) => {
            const isCurrentUser = user.email === currentUserEmail;

            return (
              <div
                key={user._id}
                className="rounded-lg border border-prince-yellow bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-prince-shadow/50">
                      {user.username || "Unnamed user"}
                    </h3>

                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-prince-red/10 text-prince-red"
                        : "bg-prince-green/10 text-prince-green"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.role === "user" ? (
                    <form action={promoteUser}>
                      <input type="hidden" name="email" value={user.email} />

                      <button
                        type="submit"
                        className="rounded-md bg-prince-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-prince-yellow"
                      >
                        Promote to admin
                      </button>
                    </form>
                  ) : isCurrentUser ? (
                    <span className="text-sm text-slate-500">
                      You cannot demote yourself.
                    </span>
                  ) : (
                    <form action={demoteUser}>
                      <input type="hidden" name="email" value={user.email} />

                      <button
                        type="submit"
                        className="rounded-md bg-prince-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-prince-orange"
                      >
                        Demote to user
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

async function promoteUser(formData: FormData) {
  "use server";

  const { getCurrentAdmin } = await import("@/lib/libauth");
  const { promoteUserToAdmin } = await import("@/lib/auth");
  const { redirect } = await import("next/navigation");

  //Find the current admin user. Only allow that admin to access the functionalities.
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect("/admin/login");
    return;
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!email) {
    redirect("/admin/users?error=Email+is+required");
  }

  try {
    await promoteUserToAdmin(email);
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Unable to promote the user.";

    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/users?success=User+promoted+to+admin");
}

async function demoteUser(formData: FormData) {
  "use server";

  const { getCurrentAdmin } = await import("@/lib/libauth");
  const { demoteUserFromAdmin } = await import("@/lib/auth");
  const { redirect } = await import("next/navigation");

  //Find the current admin user. Only allow that admin to access the functionalities.
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect("/admin/login");
    return;
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!email) {
    redirect("/admin/users?error=Email+is+required");
    return;
  }

  if (email === currentAdmin.email) {
    redirect("/admin/users?error=You+cannot+demote+yourself");
    return;
  }

  try {
    await demoteUserFromAdmin(email);
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Unable to demote the user.";

    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
    return;
  }

  redirect("/admin/users?success=User+demoted+to+user");
}

export default UserList;
