import { redirect } from "next/navigation";
import { countAdmins, createFirstAdmin } from "@/lib/auth";
import { getCurrentAdmin } from "@/lib/libauth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create First Admin",
  description: "Create the first admin account if none exists.",
};

export default async function SetupPage() {
  const adminSession = await getCurrentAdmin();
  const adminCount = await countAdmins();

  if (adminSession) {
    redirect("/admin");
  }

  if (adminCount > 0) {
    redirect("/admin/login");
  }

  return (
    <section className="bg-prince-yellow/80 px-5 py-[60px]">
      <div className="border-2 border-prince-red flex min-h-screen flex-col items-center justify-center">
        <form
          action={createAdmin}
          className="flex w-full max-w-[500px] flex-col items-center gap-5 mb-10"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          {/*Main section for admin login*/}
          <h1
            className="text-prince-red/50 text-xl"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Create the first admin account
          </h1>
          <input
            name="username"
            className="w-full bg-white rounded-md border-2 border-prince-yellow/50 px-[30px] py-5"
            type="text"
            placeholder="Username"
            required
          />
          <input
            name="email"
            className="w-full bg-white rounded-md border-2 border-prince-yellow/50 px-[30px] py-5"
            type="email"
            placeholder="Email"
            required
          />
          <input
            name="password"
            className="w-full bg-white rounded-md border-2 border-prince-yellow/50 px-[30px] py-5"
            type="password"
            placeholder="Password"
            required
            minLength={8}
          />
          <button
            type="submit"
            className="block w-full box-border rounded-md border-2 border-prince-shadow/50 bg-prince-green/50 px-[30px] py-5 text-center text-[20px] text-black cursor-crosshair hover:italic hover:text-prince-orange hover:font-mono"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Create first admin
          </button>
          <Link
            href="/admin/login"
            className="block w-full box-border rounded-md border-2 border--prince-green/50 bg-prince-yellow/50 px-[30px] py-5 text-center text-[20px] text-black cursor-crosshair hover:italic hover:text-prince-green hover:font-mono"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Back to admin login
          </Link>
        </form>
      </div>
    </section>
  );
}

async function createAdmin(formData: FormData) {
  "use server";

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const username = formData.get("username")?.toString().trim() || undefined;

  try {
    await createFirstAdmin({
      email,
      password,
      username,
    });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Unable to create admin.";

    redirect(`/admin/login?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/login");
}
