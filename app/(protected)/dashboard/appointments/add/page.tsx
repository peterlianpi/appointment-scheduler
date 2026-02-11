import { redirect } from "next/navigation";

export default function AddAppointmentPage() {
  redirect("/dashboard/appointments/new");
}
