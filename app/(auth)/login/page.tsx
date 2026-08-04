//Required imports.
import { redirect } from "next/navigation";
import { getSession, login } from "@/lib/libauth";
import Link from "next/link";

// Force this page's server actions to run on Node.js runtime (not Edge)
export const runtime = "nodejs";

//Login page title.
export const metadata = {
  title: "Login to the Prince Bread Program!",
  description:
    "Before you go in, you must first enter your email and password here. Only registered users can login.",
};

export default async function LoginPage() {
  //Get a session first before logging in.
  const session = await getSession();

  if (session) {
    redirect("/"); //Redirect to home page if already logged in.
  }
  return (
    //The actual form to login.
    <section className="bg-prince-yellow/80 px-5 py-[60px]">
      <div className=" border-2 border-prince-red flex min-h-screen flex-col items-center justify-center">
        <form
          action={async (formData) => {
            "use server";
            await login(formData);
            redirect("/");
          }}
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
            Login to Prince Bread App!
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
cursor-crosshair
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
            href="/register"
            className="
block
w-full
box-border
rounded-md
border-2
border--prince-green/50
bg-prince-shadow/50
px-[30px]
py-5
text-center
text-[20px]
text-white
cursor-crosshair
hover:italic
hover:text-prince-orange
hover:font-mono
"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Register
          </Link>
        </form>
      </div>
    </section>
  );
}
