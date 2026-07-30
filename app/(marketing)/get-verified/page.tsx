import { redirect } from "next/navigation";

/** Full application form paused pre-launch — waitlist only. */
export default function GetVerifiedPage() {
  redirect("/join-waitlist");
}
