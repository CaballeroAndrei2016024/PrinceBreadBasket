//Required imports.
import { redirect } from "next/navigation";
import { getSession, register } from "@/lib/libauth";
import Link from "next/link";

// Force this page's server actions to run on Node.js runtime (not Edge)
export const runtime = "nodejs";

//Login page title.
export const metadata = {
  title: "Register to the Prince Bread Program!",
  description:
    "Before you go in, you must first enter your email, username, birthdate and password here.",
};

export default async function RegisterPage() {
  //Get a session first before registering.

  const session = await getSession();

  if (session) {
    redirect("/"); //Redirect to home page if already registered in.
  }

  return (
    //The actual form to register.
    <section className="bg-prince-green/80  px-5 py-[60px]">
      <div className=" border-2 border-prince-red flex min-h-screen flex-col items-center justify-center">
        <form
          action={async (formData) => {
            "use server";
            await register(formData);
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
            Register to the app!
          </h1>
          <input
            name="username"
            className="w-full rounded-md bg-white border-2 border-prince-yellow/50 px-[30px] py-5"
            type="text"
            placeholder="Username"
            required
          />

          <input
            name="email"
            className="w-full rounded-md bg-white border-2 border-prince-yellow/50 px-[30px] py-5"
            type="email"
            placeholder="Email"
            required
          />

          <input
            name="password"
            className="w-full rounded-md bg-white border-2 border-prince-yellow/50 px-[30px] py-5"
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
border--prince-green/50
bg-prince-shadow/50
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
            Register
          </button>
          <Link
            href="/login"
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
          </Link>
        </form>
      </div>
    </section>
  );
}
