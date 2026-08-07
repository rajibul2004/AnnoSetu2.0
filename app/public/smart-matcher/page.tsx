import { redirect } from "next/navigation";

export default function SmartMatcherRedirectPage() {
  redirect("/public/food?tab=smart-match");
}
