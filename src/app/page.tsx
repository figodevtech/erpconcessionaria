import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/utils/permissions";

export default async function Home() {
  const user = await getVerifiedUser();

  if (!user) {
    redirect("/login");
  } else {
    redirect("/dashboard");
  }
}
