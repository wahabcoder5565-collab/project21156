/**
 * Password rules for sign-up and password reset.
 *
 * Follows NIST SP 800-63B in spirit: length is the main defence, so there are
 * no composition rules (no "must contain a symbol"), just a length window, a
 * blocklist of the passwords people actually choose, and a hard cap at 72 bytes
 * because bcrypt silently truncates beyond that.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX_BYTES = 72;

/** Minimum entropy characters: a-z, A-Z, 0-9. */
const ENTROPY_RE = /[a-z]/i;

const COMMON = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "12345678",
  "123456789",
  "1234567890",
  "12345678901",
  "qwertyuiop",
  "qwerty12345",
  "letmein123",
  "iloveyou12",
  "welcome123",
  "admin12345",
  "football12",
  "baseball12",
  "sunshine12",
  "princess12",
  "dragon1234",
  "monkey1234",
  "trustno123",
  "starwars12",
  "passw0rd12",
  "polls2024",
  "youpulse1",
  "youpulse12",
  "youyoupulse",
]);

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }

  const bytes = new TextEncoder().encode(password).length;
  if (bytes > PASSWORD_MAX_BYTES) {
    // bcrypt truncates here, so two different passwords could collide.
    return `Use at most ${PASSWORD_MAX_BYTES} characters.`;
  }

  const lowered = password.toLowerCase();
  if (COMMON.has(lowered)) {
    return "That password is too common. Pick something less predictable.";
  }

  // Reject long runs of one repeated character, e.g. "aaaaaaaaaaaa".
  if (new Set(lowered).size < 3) {
    return "That password is too repetitive.";
  }

  if (!ENTROPY_RE.test(password)) {
    return "Include at least one letter.";
  }

  return null;
}
