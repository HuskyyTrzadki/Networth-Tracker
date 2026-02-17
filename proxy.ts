import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { supabase } = createClient(request, response);

  // Refresh session cookies when needed (noop for anonymous users).
  await supabase.auth.getSession();

  return response;
}

export const proxyConfig = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
