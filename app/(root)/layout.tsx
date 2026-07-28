import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  
  // Skip auth check if USE_AI_PROVIDER is bedrock (dev mode)
  const isDevMode = process.env.USE_AI_PROVIDER === 'bedrock' || process.env.NEXT_PUBLIC_USE_AI_PROVIDER === 'bedrock';
  
  if (!isUserAuthenticated && !isDevMode) redirect("/sign-in");

  return (
    <div className="">
     
    
      {children}
    </div>
  );
};

export default Layout;
