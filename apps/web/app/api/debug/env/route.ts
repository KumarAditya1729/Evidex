import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      REDIS_URL: process.env.REDIS_URL ? "configured" : "missing",
      REDIS_URL_VALUE: process.env.REDIS_URL?.substring(0, 20) + "...",
      DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
      JWT_SECRET: process.env.JWT_SECRET ? "configured" : "missing"
    }
  });
}
