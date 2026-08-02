import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { ProfileApp } from "@/components/profile/ProfileApp";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect=/profile");

  return <ProfileApp user={{ name: user.name, email: user.email, plan: user.plan }} />;
}
