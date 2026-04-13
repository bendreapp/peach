"use client";

/**
 * /onboard/[token]
 *
 * Handles two flows:
 * 1. Portal invite flow: token is a 64-char hex string from client_invitations.
 *    Client clicks the invite email, sets a password, and gets access to the portal.
 * 2. Legacy onboarding token flow: token is a UUID from client_onboarding_tokens.
 *    Client self-registers via a shareable link from the therapist.
 *
 * We detect the flow by trying to parse the token as a UUID.
 */

import { use } from "react";
import PortalClaimPage from "./PortalClaimPage";
import LegacyOnboardPage from "./LegacyOnboardPage";

interface OnboardPageProps {
  params: Promise<{ token: string }>;
}

function isUuid(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
}

export default function OnboardPage({ params }: OnboardPageProps) {
  const { token } = use(params);

  if (isUuid(token)) {
    return <LegacyOnboardPage token={token} />;
  }
  return <PortalClaimPage token={token} />;
}
