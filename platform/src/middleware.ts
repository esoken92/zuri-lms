import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Resolves the tenant subdomain from the request host.
 * orgname.zuri.com  -> "orgname"
 * zuri.com / www / app / admin -> null (platform shell)
 */
function getSubdomain(req: NextRequest): string | null {
  const host = (req.headers.get("host") || "").split(":")[0];
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "zuri.local:3000").split(":")[0];

  if (!host || host === root || host === `www.${root}`) return null;
  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(`.${root}`.length));
    if (["www", "app", "admin", "api"].includes(sub)) return null;
    return sub || null;
  }
  // localhost / IP access without subdomain
  return null;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const subdomain = getSubdomain(req);

  // Make the tenant slug available to server components / route handlers.
  const requestHeaders = new Headers(req.headers);
  if (subdomain) requestHeaders.set("x-org-slug", subdomain);

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else + API
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
