import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/upload", "/settings", "/admin", "/evidence"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get("evidex_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/upload/:path*", "/settings/:path*", "/admin/:path*", "/evidence/:path*"]
};
