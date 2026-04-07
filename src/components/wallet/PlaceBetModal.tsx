"use client";

import { useState, useCallback, useMemo } from "react";
import { useWalletStore } from "@/lib/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  TrendingUp,
  Check,
  AlertTriangle,
  Clock,
  Database,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

// ── Props ──────────────────────────────────────────────────────────

export interface PlaceBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Market identifier */
  marketId: string;
  /** Human-readable market title */
  marketTitle: string;
  /** Current YES probability (0-1) */
  yesPrice: number;
  /** ISO date string — when the market expires */
  expiresAt: string;
  /** Data source used for resolution */
  oracleSource?: string;
}

// ── Constants ──────────────────────────────────────────────────────

const PLATFORM_FEE_RATE = 0.02;
const MIN_BET = 1;

// ── Helpers ────────────────────────────────────────────────────────

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────

export function PlaceBetModal({
  open,
  onOpenChange,
  marketId,
  marketTitle,
  yesPrice,
  expiresAt,
  oracleSource,
}: PlaceBetModalProps) {
  const balance = useWalletStore((s) => s.balance);
  const placeBet = useWalletStore((s) => s.placeBet);

  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState(100);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Derived values
  const price = side === "yes" ? yesPrice : 1 - yesPrice;
  const shares = useMemo(
    () => (price > 0 ? Math.round((amount / price) * 100) / 100 : 0),
    [amount, price]
  );
  const potentialPayout = useMemo(() => Math.round(shares * 100) / 100, [shares]);
  const fee = useMemo(
    () => Math.round(amount * PLATFORM_FEE_RATE * 100) / 100,
    [amount]
  );
  const totalCost = amount + fee;
  const netProfit = potentialPayout - totalCost;
  const maxBet = Math.floor(balance - fee > 0 ? balance / (1 + PLATFORM_FEE_RATE) : 0);
  const canBet = amount >= MIN_BET && totalCost <= balance && price > 0 && price < 1;

  // ── Handlers ───────────────────────────────────────────────────

  const handleAmountChange = useCallback(
    (raw: string) => {
      const n = Math.max(0, Math.min(Number(raw) || 0, maxBet));
      setAmount(n);
      setStatus("idle");
    },
    [maxBet]
  );

  const handleSliderChange = useCallback(
    (v: number | readonly number[]) => {
      const n = Array.isArray(v) ? v[0] : v;
      setAmount(Math.min(n, maxBet));
      setStatus("idle");
    },
    [maxBet]
  );

  const handleConfirm = useCallback(() => {
    const result = placeBet(
      marketId,
      marketTitle,
      side,
      amount,
      price,
      expiresAt,
      oracleSource
    );
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Unknown error");
    }
  }, [placeBet, marketId, marketTitle, side, amount, price, expiresAt, oracleSource]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setAmount(100);
    setSide("yes");
  }, []);

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) {
        // Reset state on close
        setStatus("idle");
        setAmount(100);
        setSide("yes");
        setErrorMsg("");
      }
      onOpenChange(v);
    },
    [onOpenChange]
  );

  // ── Success view ───────────────────────────────────────────────

  if (status === "success") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold">Bet placed successfully!</p>
              <p className="text-sm text-muted-foreground">
                {amount} EUR on {side.toUpperCase()} — potential payout {formatEur(potentialPayout)} EUR
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-sm font-bold text-emerald-600 tabular-nums">
                  {formatEur(potentialPayout)} EUR
                </p>
                <p className="text-[10px] text-muted-foreground">Potential payout</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-sm font-bold tabular-nums">{formatDate(expiresAt)}</p>
                <p className="text-[10px] text-muted-foreground">Expires</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Place another bet
            </Button>
            <Button onClick={() => handleClose(false)} className="flex-1">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main form view ─────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a bet</DialogTitle>
          <DialogDescription className="line-clamp-2">{marketTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Side toggle: YES / NO */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === "yes" ? "default" : "outline"}
              className={
                side === "yes"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                  : "h-10"
              }
              onClick={() => { setSide("yes"); setStatus("idle"); }}
            >
              <ThumbsUp className="h-4 w-4 mr-1.5" />
              YES — {Math.round(yesPrice * 100)}%
            </Button>
            <Button
              variant={side === "no" ? "default" : "outline"}
              className={
                side === "no"
                  ? "bg-red-600 hover:bg-red-700 text-white h-10"
                  : "h-10"
              }
              onClick={() => { setSide("no"); setStatus("idle"); }}
            >
              <ThumbsDown className="h-4 w-4 mr-1.5" />
              NO — {Math.round((1 - yesPrice) * 100)}%
            </Button>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="h-10 text-base font-semibold tabular-nums"
                min={MIN_BET}
                max={maxBet}
              />
              <span className="text-sm text-muted-foreground shrink-0">EUR</span>
            </div>
            <Slider
              value={[amount]}
              onValueChange={handleSliderChange}
              min={MIN_BET}
              max={Math.max(maxBet, MIN_BET)}
              step={10}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Min: {MIN_BET} EUR</span>
              <span>Balance: {formatEur(balance)} EUR</span>
            </div>
          </div>

          <Separator />

          {/* Calculation details */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Side</span>
              <Badge
                variant={side === "yes" ? "default" : "destructive"}
                className="text-[10px]"
              >
                {side.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Price (probability)</span>
              <span className="font-medium tabular-nums">{(price * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-medium tabular-nums">{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Stake</span>
              <span className="font-medium tabular-nums">{formatEur(amount)} EUR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform fee (2%)</span>
              <span className="font-medium text-muted-foreground tabular-nums">
                -{formatEur(fee)} EUR
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total cost</span>
              <span className="font-semibold tabular-nums">{formatEur(totalCost)} EUR</span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm font-semibold">
              <span>Potential payout</span>
              <span className="text-emerald-600 tabular-nums">
                {formatEur(potentialPayout)} EUR
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Net profit if won</span>
              <span
                className={`font-bold tabular-nums ${
                  netProfit >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {netProfit >= 0 ? "+" : ""}
                {formatEur(netProfit)} EUR
              </span>
            </div>
          </div>

          {/* Oracle + expiry info */}
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expires: {formatDate(expiresAt)}</span>
            </div>
            {oracleSource && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span className="truncate">Oracle: {oracleSource}</span>
              </div>
            )}
          </div>

          {/* Insufficient balance warning */}
          {totalCost > balance && amount > 0 && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs">
                Insufficient balance. You need {formatEur(totalCost)} EUR but only have{" "}
                {formatEur(balance)} EUR.
              </p>
            </div>
          )}

          {/* Error from placeBet */}
          {status === "error" && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs">{errorMsg}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canBet}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <TrendingUp className="h-4 w-4" />
            Bet {formatEur(amount)} EUR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
