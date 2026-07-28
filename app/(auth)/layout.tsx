import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  
  // Skip auth redirect if USE_AI_PROVIDER is bedrock (dev mode)
  const isDevMode = process.env.USE_AI_PROVIDER === 'bedrock' || process.env.NEXT_PUBLIC_USE_AI_PROVIDER === 'bedrock';
  
  if (isUserAuthenticated && !isDevMode) redirect("/");

  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;
