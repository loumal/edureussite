import { api } from "@/lib/trpc/server";
import { LandingContent } from "@/components/landing/landing-content";

export default async function LandingPage() {
  const featureFlags = await api.auth.getPublicFeatureFlags();

  return (
    <LandingContent
      multiProvince={featureFlags.multiProvince}
      provincesActives={featureFlags.provincesActives}
    />
  );
}
