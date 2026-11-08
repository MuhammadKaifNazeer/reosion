import { redirect } from "next/navigation";

/** The dashboard is the project listing.
 */
export default function ProjectsPage() {
  redirect("/dashboard");
}
