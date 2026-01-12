import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function GET(request: Request) {
  clearAuthCookie();
  return NextResponse.redirect(new URL("/login", request.url));
}
