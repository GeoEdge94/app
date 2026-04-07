# Plan de Developpement Complet — GeoEdge sur Firebase

## Architecture 100% Firebase

```
┌─────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING                      │
│            Next.js 16 (export statique)                  │
│     React 19 + MapLibre GL + shadcn/ui + Tailwind 4      │
│                  geoedge-app.web.app                     │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ FIRESTORE    │ │ AUTH     │ │ STORAGE      │
│              │ │          │ │              │
│ zones/       │ │ Google   │ │ satellite/   │
│ fires/       │ │ Email    │ │  before/     │
│ bets/        │ │ Wallet   │ │  after/      │
│ users/       │ │ Telegram │ │ cadastre/    │
│ config/      │ │          │ │ exports/     │
│ oddsHistory/ │ │          │ │              │
│ firmsRaw/    │ │          │ │              │
│ alerts/      │ │          │ │              │
└──────┬───────┘ └──────────┘ └──────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         CLOUD FUNCTIONS (2nd gen)         │
│                                          │
│ fn-updateOdds     (cron 1h)              │
│   → fetch Open-Meteo → calc FWI → cotes │
│                                          │
│ fn-ingestFirms    (cron 15min)           │
│   → fetch NASA FIRMS CSV → parse →      │
│     detect in zones → update fires/      │
│                                          │
│ fn-resolveZone    (trigger Firestore)    │
│   → fire detected in zone → resolve bets│
│                                          │
│ fn-telegramBot    (webhook HTTP)         │
│   → /zones /odds /bet /portfolio         │
│                                          │
│ fn-fetchSatellite (trigger Firestore)    │
│   → new fire → Copernicus STAC →        │
│     before/after → Cloud Storage         │
└──────────────────────────────────────────┘
```

---

## Sprints

### Sprint 0 — Setup (FAIT)
- [x] Projet Firebase cree (geoedge-app)
- [x] Web app enregistree
- [x] Firestore cree (eur3)
- [x] Auth configure (Google + email)
- [x] Hosting deploye
- [x] Next.js 16 + shadcn + MapLibre
- [x] 6 zones dans Firestore avec geometries
- [x] 10 fires dans Firestore avec GeoPoints
- [x] 1118 feux FIRMS en GeoJSON statique
- [x] Regles Firestore deployees
- [x] Calques : satellite IGN, cadastre IGN, FWI EFFIS

### Sprint 1 — Donnees et couches (EN COURS)
- [x] Parcelles cadastrales reelles (vecteur GeoJSON)
- [ ] Couche cadastre interactive (click parcelle → info)
- [ ] Stocker parcelles dans Firestore ou Cloud Storage
- [ ] Couche feux avec popup details FIRMS
- [ ] Couche FWI EFFIS fonctionnelle
- [ ] Superposition correcte des 5 calques

### Sprint 2 — Auth et profil
- [ ] Firebase Auth : login Google
- [ ] Firebase Auth : login email/password
- [ ] Page profil utilisateur
- [ ] Document users/ cree a l'inscription
- [ ] Liaison wallet (preparation blockchain)
- [ ] Guard routes authentifiees

### Sprint 3 — Systeme de paris
- [ ] BetSlip connecte a Firestore
- [ ] Collection bets/ : CRUD
- [ ] Page Portfolio : liste des paris actifs
- [ ] Calcul gain potentiel temps reel
- [ ] Historique des paris
- [ ] Validation montant min/max

### Sprint 4 — Cloud Functions
- [ ] fn-updateOdds : cron 1h, Open-Meteo → FWI → cotes
- [ ] fn-ingestFirms : cron 15min, FIRMS CSV → Firestore
- [ ] fn-resolveZone : trigger onWrite fires/ → match zones → resolve bets
- [ ] fn-telegramBot : webhook → commandes bot
- [ ] Deploy Cloud Functions

### Sprint 5 — Satellite et preuves
- [ ] fn-fetchSatellite : Copernicus STAC → Cloud Storage
- [ ] Split-view avant/apres sur la carte
- [ ] Overlay perimetres brules EFFIS
- [ ] Timeline incendie

### Sprint 6 — Blockchain
- [ ] Smart contract BettingPool.sol (Polygon)
- [ ] Oracle FIRMS/EFFIS
- [ ] WalletConnect integration
- [ ] Testnet deploy
- [ ] Resolution automatique

### Sprint 7 — Telegram Mini App
- [ ] Bot grammy sur Cloud Functions
- [ ] Commandes /zones /odds /bet /portfolio
- [ ] Mini App (carte interactive dans Telegram)
- [ ] Alertes push zone → critical
- [ ] Deep links partage

### Sprint 8 — Production
- [ ] Performance audit (Lighthouse)
- [ ] PWA offline
- [ ] Dark mode complet
- [ ] SEO / OG images
- [ ] Monitoring Sentry
- [ ] CI/CD GitHub Actions → firebase deploy
