import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret";
const encoder = new TextEncoder();

const protectedRoutes = ["/dashboard", "/forms", "/submissions", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET));
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/submissions/:path*", "/admin/:path*"]
};
