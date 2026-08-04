import { NextRequest, NextResponse } from "next/server";

// Avoid importing server-only helpers into middleware (Edge runtime).Middleware runs in the Edge runtime and cannot load Node-only modules
export async function middleware(request: NextRequest) {
  // Example: check if session cookie exists and continue. Don't call
  // `updateSession` here because it imports Node-only modules.
  const session = request.cookies.get("session")?.value;
  // Optionally you can short-circuit or rewrite based on session, e.g.:
  // if (!session) return NextResponse.redirect('/login');
  const response = NextResponse.next();
  if (session) {
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    response.cookies.set("session", session, {
      httpOnly: true,
      expires,
    });
  }
  return response;
}
