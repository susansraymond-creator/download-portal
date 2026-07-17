import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
