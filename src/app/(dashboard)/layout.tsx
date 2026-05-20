import type { ReactNode } from "react";
import { auth } from "@/lib/auth/config";
import { getImpersonationState } from "@/lib/auth/impersonation";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  let impersonation = null;
  if (session?.user.role === "SUPER_ADMIN") {
    impersonation = await getImpersonationState();
    // Validate that the cookie belongs to this admin
    if (impersonation && impersonation.superAdminId !== session.user.id) {
      impersonation = null;
    }
  }

  return (
    <>
      {impersonation && (
        <>
          <ImpersonationBanner
            actingAs={impersonation.actingAs}
            superAdminEmail={session!.user.email}
          />
          {/* Spacer so the fixed banner doesn't cover page content */}
          <div className="h-10" />
        </>
      )}
      {children}
    </>
  );
}
