import { NextRequest } from "next/server";
import { updateSession } from "@/lib/libauth";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Run middleware on all routes EXCEPT static assets and API internals
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
