import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";

type JwtPayload = Record<string, unknown>;

// Ensure this module and its server actions run on Node.js (not the Edge runtime)
export const runtime = "nodejs";

const key = new TextEncoder().encode(env.AUTH_SECRET);
const isSecureCookie =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_DISABLE_SECURE_COOKIES !== "true";

// Encrypts the payload into a JWT token.
export async function encrypt(payload: JwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

//Decrypts the token into a payload.
export async function decrypt(input: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as JwtPayload;
}

//The primary login function.
export async function login(formData: FormData) {
  //This function logins a user.
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  //Validation on the server.
  if (!email || !password) throw new Error("Are you kidding me?");
  const { verifyUser } = await import("./auth");
  const user = await verifyUser(email, password);
  if (!user) throw new Error("Please stop. Just, no...");
  //Verify login session
  const sessionUser = {
    email: user.email,
    name: user.username ?? user.email.split("@")[0],
    role: user.role ?? "user",
  };
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  const session = await encrypt({
    user: sessionUser,
    expires,
  });
  const cookieStore = await cookies();
  const commonOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie,
    path: "/",
  };

  cookieStore.set({
    name: "session",
    value: session,
    expires,
    ...commonOptions,
  });

  cookieStore.set({
    name: "admin_session",
    value: "",
    expires: new Date(0),
    ...commonOptions,
  });
}

//The admin section for the login.
export async function loginAdmin(formData: FormData) {
  //Verification for admin sesisons.
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const { verifyUser } = await import("./auth");
  const user = await verifyUser(email, password);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (user.role !== "admin") {
    throw new Error("This account is not authorized for the admin portal.");
  }

  const sessionUser = {
    email: user.email,
    name: user.username ?? user.email.split("@")[0],
    role: "admin" as const,
  };

  const expires = new Date(Date.now() + 60 * 60 * 1000);

  const session = await encrypt({
    user: sessionUser,
    expires,
  });

  const adminSession = await encrypt({
    user: sessionUser,
    type: "admin",
    expires,
  });

  const cookieStore = await cookies();
  const commonOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie,
    path: "/",
  };

  cookieStore.set({
    name: "session",
    value: session,
    expires,
    ...commonOptions,
  });

  cookieStore.set({
    name: "admin_session",
    value: adminSession,
    expires,
    ...commonOptions,
  });
}

export async function register(formData: FormData) {
  //This function registers a user.
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  //Validation on the server.
  if (!email || !password) throw new Error("Are you kidding me?");
  //Registering attempts to login:
  try {
    const { registerUser } = await import("./auth");
    const created = await registerUser({
      email,
      password,
      username: formData.get("username")?.toString().trim() ?? undefined,
    });
    //Create the session
    const user = {
      email: created.email,
      name: created.username ?? created.email.split("@")[0],
      role: created.role ?? "user",
    };
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const session = await encrypt({ user, expires });
    (await cookies()).set({
      name: "session",
      value: session,
      httpOnly: true,
      expires,
      sameSite: "lax",
      secure: isSecureCookie,
      path: "/",
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000 /*mongo duplicate key*/
    )
      throw new Error(
        "You obviously had that email. Why don't you log-in instead?",
      );
    throw err;
  }
}

export async function logout() {
  //Server components should be able to use this function.
  "use server";
  // Destroy both session cookies so no stale session remains.
  const cookieStore = await cookies();

  const commonOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie,
    path: "/",
  };

  cookieStore.set({
    name: "session",
    value: "",
    expires: new Date(0),
    maxAge: 0,
    ...commonOptions,
  });

  cookieStore.set({
    name: "admin_session",
    value: "",
    expires: new Date(0),
    maxAge: 0,
    ...commonOptions,
  });
}

export async function getSession(name = "session") {
  //Sessions last for exactly 1 hour.
  const session = (await cookies()).get(name)?.value;
  if (!session) return null;

  //Enforce that 1-hour lifetime.
  try {
    const parsed = await decrypt(session);

    if (
      parsed.expires &&
      new Date(parsed.expires as string | number | Date) < new Date()
    ) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("Invalid session:", err);
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  //Get both sessions.
  const session = request.cookies.get("session")?.value;
  const adminSession = request.cookies.get("admin_session")?.value;

  if (!session && !adminSession) return NextResponse.next();

  const res = NextResponse.next();

  //Configure cookie options.
  const commonOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie,
    path: "/",
  };

  //Main session updater.
  if (session) {
    try {
      const parsed = await decrypt(session);

      if (
        !parsed.expires ||
        new Date(parsed.expires as string | number | Date) >= new Date()
      ) {
        parsed.expires = new Date(Date.now() + 60 * 60 * 1000);

        const refreshedSession = await encrypt(parsed);

        res.cookies.set({
          name: "session",
          value: refreshedSession,
          expires: parsed.expires as Date,
          ...commonOptions,
        });
      }
    } catch (err) {
      console.error("Invalid session token:", err);
    }
  }

  //Auth Session updater
  if (adminSession) {
    try {
      const parsed = await decrypt(adminSession);

      if (
        parsed.expires &&
        new Date(parsed.expires as string | number | Date) < new Date()
      ) {
        return res;
      }

      if (
        parsed.type !== "admin" ||
        !parsed.user ||
        (parsed.user as { role?: string }).role !== "admin"
      ) {
        return res;
      }

      parsed.expires = new Date(Date.now() + 60 * 60 * 1000);

      const refreshedAdminSession = await encrypt(parsed);

      res.cookies.set({
        name: "admin_session",
        value: refreshedAdminSession,
        expires: parsed.expires as Date,
        ...commonOptions,
      });
    } catch (err) {
      console.error("Invalid admin session token:", err);
    }
  }

  return res;
}

export async function getCurrentUser() {
  //Grab user session cookie.
  const session = await getSession("session");
  if (!session || !session.user) return null;
  return session.user as {
    email: string;
    name: string;
    role: "user" | "admin";
  };
}

//Verify Admin's session cookie.
export async function getCurrentAdmin() {
  const session = await getSession("session");
  if (session?.user && (session.user as { role?: string }).role === "admin") {
    return session.user as {
      email: string;
      name: string;
      role: "admin";
    };
  }

  const adminSession = await getSession("admin_session");
  if (!adminSession?.user) return null;
  if (adminSession.type !== "admin") return null;
  if ((adminSession.user as { role?: string }).role !== "admin") return null;
  return adminSession.user as {
    email: string;
    name: string;
    role: "admin";
  };
}
