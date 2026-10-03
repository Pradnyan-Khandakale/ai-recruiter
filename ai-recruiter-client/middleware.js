import { NextResponse } from "next/server";

export function middleware(request) {
  // TODO: Redirect to /login when a /dashboard route is requested without the
  // TODO: recruitment_token cookie.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
