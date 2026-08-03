import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/apps",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

// Routes that should redirect to desktop if already authenticated
const authRoutes = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // The signed token is fully verified by server layouts/actions.
  const authToken = request.cookies.get("smarty_session")?.value;
  const isAuthenticated = !!authToken;

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // If trying to access protected route without authentication
  if (!isPublicRoute && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated user tries to access auth routes, redirect to desktop
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/desktop", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*).*)",
  ],
};
