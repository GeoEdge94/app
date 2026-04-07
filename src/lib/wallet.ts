import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "bet_placed"
  | "bet_won"
  | "bet_lost"
  | "bet_refund";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: string; // ISO
  betId?: string;
}

export type BetStatus = "active" | "won" | "lost" | "expired";

export interface WalletBet {
  id: string;
  marketId: string;
  marketTitle: string;
  side: "yes" | "no";
  amount: number;
  price: number; // probability 0-1
  shares: number;
  potentialPayout: number;
  status: BetStatus;
  placedAt: string; // ISO
  expiresAt: string; // ISO
  resolvedAt?: string;
  oracleSource?: string;
}

// ── Store interface ────────────────────────────────────────────────

interface WalletState {
  balance: number;
  transactions: Transaction[];
  bets: WalletBet[];

  // Actions
  placeBet: (
    marketId: string,
    title: string,
    side: "yes" | "no",
    amount: number,
    price: number,
    expiresAt: string,
    oracleSource?: string
  ) => { success: boolean; error?: string; betId?: string };

  resolveBet: (betId: string, won: boolean) => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => { success: boolean; error?: string };

  // Computed helpers
  getActiveBets: () => WalletBet[];
  getResolvedBets: () => WalletBet[];
  getTotalPnL: () => number;
}

// ── Helpers ────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PLATFORM_FEE_RATE = 0.02; // 2 %

// ── Store ──────────────────────────────────────────────────────────

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 10_000,
      transactions: [],
      bets: [],

      // ── placeBet ─────────────────────────────────────────────
      placeBet: (marketId, title, side, amount, price, expiresAt, oracleSource) => {
        const state = get();
        const fee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
        const totalCost = amount + fee;

        if (totalCost > state.balance) {
          return { success: false, error: "Insufficient balance" };
        }
        if (amount <= 0) {
          return { success: false, error: "Amount must be positive" };
        }
        if (price <= 0 || price >= 1) {
          return { success: false, error: "Price must be between 0 and 1" };
        }

        const betId = `BET-${uid()}`;
        const shares = Math.round((amount / price) * 100) / 100;
        const potentialPayout = Math.round(shares * 100) / 100; // each share pays 1 EUR if correct

        const bet: WalletBet = {
          id: betId,
          marketId,
          marketTitle: title,
          side,
          amount,
          price,
          shares,
          potentialPayout,
          status: "active",
          placedAt: new Date().toISOString(),
          expiresAt,
          oracleSource,
        };

        const tx: Transaction = {
          id: `TX-${uid()}`,
          type: "bet_placed",
          amount: -totalCost,
          description: `Bet ${side.toUpperCase()} on "${title}" (${amount} EUR + ${fee} EUR fee)`,
          timestamp: new Date().toISOString(),
          betId,
        };

        set({
          balance: Math.round((state.balance - totalCost) * 100) / 100,
          bets: [bet, ...state.bets],
          transactions: [tx, ...state.transactions],
        });

        return { success: true, betId };
      },

      // ── resolveBet ───────────────────────────────────────────
      resolveBet: (betId, won) => {
        const state = get();
        const betIndex = state.bets.findIndex((b) => b.id === betId);
        if (betIndex === -1) return;

        const bet = state.bets[betIndex];
        if (bet.status !== "active") return;

        const now = new Date().toISOString();
        const updatedBets = [...state.bets];
        updatedBets[betIndex] = {
          ...bet,
          status: won ? "won" : "lost",
          resolvedAt: now,
        };

        let newBalance = state.balance;
        const tx: Transaction = {
          id: `TX-${uid()}`,
          type: won ? "bet_won" : "bet_lost",
          amount: won ? bet.potentialPayout : 0,
          description: won
            ? `Won bet on "${bet.marketTitle}" — +${bet.potentialPayout} EUR`
            : `Lost bet on "${bet.marketTitle}" — ${bet.amount} EUR`,
          timestamp: now,
          betId,
        };

        if (won) {
          newBalance = Math.round((newBalance + bet.potentialPayout) * 100) / 100;
        }

        set({
          balance: newBalance,
          bets: updatedBets,
          transactions: [tx, ...state.transactions],
        });
      },

      // ── deposit ──────────────────────────────────────────────
      deposit: (amount) => {
        if (amount <= 0) return;
        const state = get();

        const tx: Transaction = {
          id: `TX-${uid()}`,
          type: "deposit",
          amount,
          description: `Deposit ${amount} EUR`,
          timestamp: new Date().toISOString(),
        };

        set({
          balance: Math.round((state.balance + amount) * 100) / 100,
          transactions: [tx, ...state.transactions],
        });
      },

      // ── withdraw ─────────────────────────────────────────────
      withdraw: (amount) => {
        const state = get();
        if (amount <= 0) return { success: false, error: "Amount must be positive" };
        if (amount > state.balance) return { success: false, error: "Insufficient balance" };

        const tx: Transaction = {
          id: `TX-${uid()}`,
          type: "withdraw",
          amount: -amount,
          description: `Withdrawal ${amount} EUR`,
          timestamp: new Date().toISOString(),
        };

        set({
          balance: Math.round((state.balance - amount) * 100) / 100,
          transactions: [tx, ...state.transactions],
        });
        return { success: true };
      },

      // ── getActiveBets ────────────────────────────────────────
      getActiveBets: () => get().bets.filter((b) => b.status === "active"),

      // ── getResolvedBets ──────────────────────────────────────
      getResolvedBets: () =>
        get().bets.filter((b) => b.status === "won" || b.status === "lost" || b.status === "expired"),

      // ── getTotalPnL ──────────────────────────────────────────
      getTotalPnL: () => {
        const resolved = get().bets.filter(
          (b) => b.status === "won" || b.status === "lost" || b.status === "expired"
        );
        return resolved.reduce((pnl, bet) => {
          if (bet.status === "won") {
            return pnl + (bet.potentialPayout - bet.amount);
          }
          // lost or expired: the cost was the amount staked
          return pnl - bet.amount;
        }, 0);
      },
    }),
    {
      name: "geoedge-wallet",
    }
  )
);
