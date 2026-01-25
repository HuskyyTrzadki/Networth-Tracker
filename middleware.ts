import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export default async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { supabase } = createClient(request, response);

  // Refresh session cookies when needed (noop for anonymous users).
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
