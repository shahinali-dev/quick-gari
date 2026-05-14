// utils/parseExpiry.ts
export function parseExpiryToMs(expiry: string): number {
  const unit = expiry.slice(-1); // "d", "h", "m", "s"
  const value = parseInt(expiry.slice(0, -1)); // "1", "7" etc

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      throw new Error(`Unknown expiry format: ${expiry}`);
  }
}
