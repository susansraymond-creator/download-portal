import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <RegisterForm />
    </div>
  );
}
