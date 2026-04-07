import { useWalletStore } from "@/lib/wallet";

/**
 * Oracle simulation — checks all active bets and resolves any that have
 * passed their expiry date.  Resolution is random but weighted by the
 * market probability encoded in the bet's `price` field:
 *
 *   - For a "yes" bet with price 0.62  ->  62 % chance the event happened
 *   - For a "no"  bet with price 0.38  ->  38 % chance the event did NOT happen
 *
 * The oracle interprets `price` as the probability that the bet's *side*
 * is correct, so a roll below `price` means the bettor wins.
 */

export interface OracleResolution {
  betId: string;
  marketTitle: string;
  won: boolean;
  probability: number;
  resolvedAt: string;
  oracleSource: string;
}

/**
 * Check every active bet.  If its `expiresAt` is in the past, resolve it
 * using a weighted coin-flip based on the bet's price (probability).
 *
 * Returns a list of newly resolved bets so the UI can show toasts / logs.
 */
export function checkAndResolveBets(): OracleResolution[] {
  const { bets, resolveBet } = useWalletStore.getState();
  const now = new Date();
  const resolutions: OracleResolution[] = [];

  for (const bet of bets) {
    if (bet.status !== "active") continue;

    const expiry = new Date(bet.expiresAt);
    if (expiry > now) continue; // not yet expired

    // Weighted resolution: `price` represents the probability the chosen
    // side is correct.  For example a "yes" bet bought at 0.62 means the
    // market estimates a 62 % chance of YES.
    const roll = Math.random();
    const won = roll < bet.price;

    const oracleSource = bet.oracleSource ?? "GeoEdge Oracle (simulated)";

    resolveBet(bet.id, won);

    resolutions.push({
      betId: bet.id,
      marketTitle: bet.marketTitle,
      won,
      probability: bet.price,
      resolvedAt: new Date().toISOString(),
      oracleSource,
    });

    if (typeof console !== "undefined") {
      console.log(
        `[Oracle] Resolved ${bet.id} "${bet.marketTitle}" — ` +
          `side=${bet.side}, prob=${(bet.price * 100).toFixed(1)}%, ` +
          `roll=${(roll * 100).toFixed(1)}% => ${won ? "WON" : "LOST"} ` +
          `(source: ${oracleSource})`
      );
    }
  }

  return resolutions;
}

/**
 * Start a polling loop that checks for expired bets every `intervalMs`
 * milliseconds.  Returns a cleanup function to stop the loop.
 *
 * Designed to be called once in a top-level useEffect.
 */
export function startOraclePolling(intervalMs = 30_000): () => void {
  const id = setInterval(() => {
    checkAndResolveBets();
  }, intervalMs);

  // Run once immediately on start
  checkAndResolveBets();

  return () => clearInterval(id);
}
