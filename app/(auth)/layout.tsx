import { ReactNode } from "react";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  // Don't redirect - let MacAuthFlow handle the routing
  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;
