const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function validateEmail(email) {
  if (!email || !email.trim()) return "Email is required.";
  const trimmed = email.trim();
  if (trimmed.length > 254) return "Email address is too long.";
  if (!EMAIL_RE.test(trimmed.toLowerCase())) return "Enter a valid email address.";
  return null;
}
