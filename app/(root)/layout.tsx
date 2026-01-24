import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = true ||await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="">
     
    
      {children}
    </div>
  );
};

export default Layout;
