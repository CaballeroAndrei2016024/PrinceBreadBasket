//Required imports.
import { redirect } from "next/navigation";
import { getCurrentAdmin, loginAdmin } from "@/lib/libauth";
import { countAdmins } from "@/lib/auth";
import Link from "next/link";

// Force this page's server actions to run on Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//Login page title.
export const metadata = {
  title: "Login to the Prince Bread Program as Admin!",
  description:
    "Before you go in, you must first enter your email and password here. Only registered users can login.",
};

export default async function AuthLoginPage() {
  //Get the current admin session if one exists.
  const adminSession = await getCurrentAdmin();
  const adminCount = await countAdmins();

  if (adminSession) {
    redirect("/admin");
  }
  return (
    //The actual form to login.
    <section className="bg-prince-yellow/80 px-5 py-[60px]">
      <div className=" border-2 border-prince-red flex min-h-screen flex-col items-center justify-center">
        <form
          method="post"
          action={loginAdminAction}
          className="flex w-full  max-w-[500px] flex-col items-center gap-5 mb-10"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <h1
            className="text-prince-red/50 text-xl"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Login to the app as Admin!
          </h1>
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
            Login
          </button>
          <Link
            href="/login"
            className="
block
w-full
box-border
rounded-md
border-2
border--prince-green/50
bg-prince-yellow/50
px-[30px]
py-5
text-center
text-[20px]
text-black
hover:italic
hover:text-prince-green
hover:font-mono
"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Login as User
          </Link>
          {adminCount === 0 ? (
            <Link
              href="/admin/setup"
              className="mt-2 block w-full rounded-md border-2 border-prince-shadow/50 bg-prince-blue/50 px-[30px] py-5 text-center text-[20px] text-white hover:italic hover:text-prince-orange hover:font-mono"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              Create First Admin
            </Link>
          ) : null}
        </form>
      </div>
    </section>
  );
}

async function loginAdminAction(formData: FormData) {
  "use server";
  await loginAdmin(formData);
  redirect("/admin");
}
