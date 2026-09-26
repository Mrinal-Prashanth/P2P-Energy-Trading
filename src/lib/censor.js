// Lightweight profanity filter for buyer-seller chat.
const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "piss", "slut", "whore",
  "cunt", "dickhead", "wanker", "twat", "bollocks", "arsehole", "motherfucker",
];

const PATTERN = new RegExp(`\\b(${BAD_WORDS.join("|")})\\b`, "gi");

export function censorText(text) {
  if (!text) return text;
  return String(text).replace(PATTERN, (match) => "*".repeat(match.length));
}

export function containsProfanity(text) {
  return PATTERN.test(String(text || ""));
}