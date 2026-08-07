import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
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
