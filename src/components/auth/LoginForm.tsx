"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Layers, Mail, Lock, User, Loader2, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@geoedge.app");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register, error, clearError } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    if (mode === "login") {
      await login(email, password);
    } else {
      await register(email, password, name);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">
              Geo<span className="text-primary">Edge</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Paris geospatiaux sur les risques naturels</p>
        </div>

        <Card>
          <CardContent className="p-5">
            {/* Tabs */}
            <div className="flex mb-4">
              <button
                onClick={() => { setMode("login"); clearError(); }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${mode === "login" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                Connexion
              </button>
              <button
                onClick={() => { setMode("register"); clearError(); }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${mode === "register" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                Inscription
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Nom d'affichage"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-2.5 bg-destructive/10 rounded-lg text-destructive text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Se connecter" : "Creer un compte"}
              </Button>
            </form>

            <Separator className="my-4" />

            {/* Demo hint */}
            <div className="text-center space-y-1">
              <p className="text-[11px] text-muted-foreground">Compte demo :</p>
              <p className="text-xs font-mono bg-muted/50 rounded px-2 py-1">demo@geoedge.app / demo1234</p>
              <p className="text-[10px] text-muted-foreground">10 000 EUR de solde initial</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
