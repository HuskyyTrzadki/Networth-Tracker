import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const { supabase } = createClient(request, response);

  // Refresh session cookies when needed (noop for anonymous users).
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
