export function validateClaimOwnership({
  orderUserId,
  orderEmail,
  claimantUserId,
  claimantEmail,
  isNewAccount,
}: {
  orderUserId: string | null;
  orderEmail?: string | null;
  claimantUserId?: string | null;
  claimantEmail: string;
  isNewAccount: boolean;
}): {
  allowed: boolean;
  reason?: "already_claimed" | "already_claimed_by_other" | "email_mismatch";
} {
  const cleanClaimantEmail = claimantEmail.trim().toLowerCase();
  const cleanOrderEmail = orderEmail?.trim().toLowerCase();

  if (cleanOrderEmail && cleanOrderEmail !== cleanClaimantEmail) {
    return { allowed: false, reason: "email_mismatch" };
  }

  if (isNewAccount && orderUserId) {
    return { allowed: false, reason: "already_claimed" };
  }

  if (
    !isNewAccount &&
    orderUserId &&
    claimantUserId &&
    orderUserId !== claimantUserId
  ) {
    return { allowed: false, reason: "already_claimed_by_other" };
  }

  return { allowed: true };
}
