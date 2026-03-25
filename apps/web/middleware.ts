import { verifyAuthToken } from "@evidex/auth";
import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/upload", "/settings", "/admin"];

function addCorsHeaders(res: NextResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGINS || "*";
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function middleware(request: NextRequest) {
  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return addCorsHeaders(new NextResponse(null, { status: 204 }));
  }

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    const res = NextResponse.next();
    return addCorsHeaders(res);
  }

  const token = request.cookies.get("evidex_token")?.value;
  
  const handleUnauthorized = () => {
    if (isApi) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("evidex_token");
      return addCorsHeaders(res);
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const res = NextResponse.redirect(url);
      res.cookies.delete("evidex_token");
      return addCorsHeaders(res);
    }
  };

  if (!token) {
    return handleUnauthorized();
  }

  try {
    const payload = await verifyAuthToken(token);
    if (!payload) throw new Error("Invalid token");
    const res = NextResponse.next();
    return addCorsHeaders(res);
  } catch {
    return handleUnauthorized();
  }
}

export const config = {
  matcher: [
    "/api/:path*", 
    "/dashboard/:path*", 
    "/upload/:path*", 
    "/settings/:path*", 
    "/admin/:path*"
  ]
};
