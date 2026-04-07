/**
 * GeoEdge — Firestore Seed Script
 *
 * Populates all collections with real data:
 * - zones: 6 betting zones with GeoJSON polygons
 * - fires: top 20 fire events (clustered from FIRMS)
 * - config: app configuration
 * - oddsHistory: initial odds entries per zone
 * - firmsRaw: metadata of last FIRMS import
 *
 * Run: npx tsx scripts/seed-firestore.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, GeoPoint, Timestamp, FieldValue } from "firebase-admin/firestore";

// Init with default credentials (use firebase login first)
initializeApp({ projectId: "geoedge-app" });
const db = getFirestore();

// ─── ZONES ───
const zones = [
  {
    id: "ZONE-VAR-001",
    name: "Massif des Maures",
    department: "Var (83)",
    departmentCode: "83",
    vegetation: "foret_mixte",
    riskLevel: "critical",
    status: "active",
    currentOdds7d: 1.8,
    currentOdds30d: 1.3,
    currentOddsSeason: 1.1,
    fireProbability7d: 0.55,
    fireProbability30d: 0.89,
    totalPool: 28400,
    activeBets: 92,
    fwiIndex: 95,
    meteo: { temp: 22.3, humidity: 35, wind: 22, precipitation: 0 },
    centroid: new GeoPoint(43.36, 6.49),
    geometry: {
      type: "Polygon",
      coordinates: [[[6.40,43.30],[6.58,43.30],[6.58,43.42],[6.40,43.42],[6.40,43.30]]],
    },
    bbox: { minLon: 6.4, minLat: 43.3, maxLon: 6.58, maxLat: 43.42 },
  },
  {
    id: "ZONE-GIR-001",
    name: "Foret des Landes",
    department: "Gironde (33)",
    departmentCode: "33",
    vegetation: "pinede",
    riskLevel: "critical",
    status: "active",
    currentOdds7d: 1.5,
    currentOdds30d: 1.2,
    currentOddsSeason: 1.05,
    fireProbability7d: 0.48,
    fireProbability30d: 0.85,
    totalPool: 42100,
    activeBets: 128,
    fwiIndex: 88,
    meteo: { temp: 24.5, humidity: 30, wind: 25, precipitation: 0 },
    centroid: new GeoPoint(44.585, -1.125),
    geometry: {
      type: "Polygon",
      coordinates: [[[-1.20,44.52],[-1.05,44.52],[-1.05,44.65],[-1.20,44.65],[-1.20,44.52]]],
    },
    bbox: { minLon: -1.2, minLat: 44.52, maxLon: -1.05, maxLat: 44.65 },
  },
  {
    id: "ZONE-MRS-001",
    name: "Calanques — Marseille",
    department: "Bouches-du-Rhone (13)",
    departmentCode: "13",
    vegetation: "garrigue",
    riskLevel: "high",
    status: "active",
    currentOdds7d: 2.4,
    currentOdds30d: 1.6,
    currentOddsSeason: 1.2,
    fireProbability7d: 0.42,
    fireProbability30d: 0.78,
    totalPool: 15800,
    activeBets: 47,
    fwiIndex: 87,
    meteo: { temp: 21.4, humidity: 44, wind: 11, precipitation: 0 },
    centroid: new GeoPoint(43.24, 5.4),
    geometry: {
      type: "Polygon",
      coordinates: [[[5.35,43.20],[5.45,43.20],[5.45,43.28],[5.35,43.28],[5.35,43.20]]],
    },
    bbox: { minLon: 5.35, minLat: 43.2, maxLon: 5.45, maxLat: 43.28 },
  },
  {
    id: "ZONE-EST-001",
    name: "Massif de l'Esterel",
    department: "Alpes-Maritimes (06)",
    departmentCode: "06",
    vegetation: "maquis",
    riskLevel: "high",
    status: "active",
    currentOdds7d: 2.0,
    currentOdds30d: 1.5,
    currentOddsSeason: 1.15,
    fireProbability7d: 0.38,
    fireProbability30d: 0.72,
    totalPool: 19200,
    activeBets: 63,
    fwiIndex: 91,
    meteo: { temp: 21.0, humidity: 40, wind: 16, precipitation: 0 },
    centroid: new GeoPoint(43.52, 6.915),
    geometry: {
      type: "Polygon",
      coordinates: [[[6.85,43.47],[6.98,43.47],[6.98,43.57],[6.85,43.57],[6.85,43.47]]],
    },
    bbox: { minLon: 6.85, minLat: 43.47, maxLon: 6.98, maxLat: 43.57 },
  },
  {
    id: "ZONE-COR-001",
    name: "Maquis Porto-Vecchio",
    department: "Corse-du-Sud (2A)",
    departmentCode: "2A",
    vegetation: "maquis",
    riskLevel: "high",
    status: "active",
    currentOdds7d: 1.6,
    currentOdds30d: 1.3,
    currentOddsSeason: 1.1,
    fireProbability7d: 0.4,
    fireProbability30d: 0.75,
    totalPool: 11500,
    activeBets: 34,
    fwiIndex: 93,
    meteo: { temp: 23.8, humidity: 38, wind: 19, precipitation: 0 },
    centroid: new GeoPoint(41.59, 9.29),
    geometry: {
      type: "Polygon",
      coordinates: [[[9.23,41.54],[9.35,41.54],[9.35,41.64],[9.23,41.64],[9.23,41.54]]],
    },
    bbox: { minLon: 9.23, minLat: 41.54, maxLon: 9.35, maxLat: 41.64 },
  },
  {
    id: "ZONE-LUB-001",
    name: "Luberon",
    department: "Vaucluse (84)",
    departmentCode: "84",
    vegetation: "garrigue",
    riskLevel: "moderate",
    status: "active",
    currentOdds7d: 3.8,
    currentOdds30d: 2.1,
    currentOddsSeason: 1.4,
    fireProbability7d: 0.22,
    fireProbability30d: 0.55,
    totalPool: 5200,
    activeBets: 18,
    fwiIndex: 65,
    meteo: { temp: 19.5, humidity: 48, wind: 12, precipitation: 0 },
    centroid: new GeoPoint(43.885, 5.405),
    geometry: {
      type: "Polygon",
      coordinates: [[[5.35,43.84],[5.46,43.84],[5.46,43.93],[5.35,43.93],[5.35,43.84]]],
    },
    bbox: { minLon: 5.35, minLat: 43.84, maxLon: 5.46, maxLat: 43.93 },
  },
];

// ─── FIRES (top 20 clustered from FIRMS) ───
const fires = [
  { id: "FIRE-001", name: "Feu Lozere", lat: 44.502, lon: 3.836, detections: 4, maxFrp: 104.3, avgFrp: 32.8, firstDate: "2026-04-02", lastDate: "2026-04-03", severity: "critical", satellites: ["MODIS/T"], status: "extinguished" },
  { id: "FIRE-002", name: "Feu Pyrenees Nord", lat: 41.554, lon: -0.858, detections: 14, maxFrp: 90.4, avgFrp: 15.6, firstDate: "2026-04-05", lastDate: "2026-04-06", severity: "critical", satellites: ["MODIS/T","Suomi-NPP/VIIRS"], status: "active" },
  { id: "FIRE-003", name: "Feu Lac Majeur", lat: 45.877, lon: 8.182, detections: 11, maxFrp: 85.2, avgFrp: 20.6, firstDate: "2026-04-06", lastDate: "2026-04-06", severity: "critical", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-004", name: "Feu Alpes-Maritimes frontalier", lat: 44.094, lon: 7.976, detections: 20, maxFrp: 74.5, avgFrp: 12.2, firstDate: "2026-03-31", lastDate: "2026-04-01", severity: "high", satellites: ["MODIS/T","Suomi-NPP/VIIRS"], status: "extinguished" },
  { id: "FIRE-005", name: "Feu Alsace frontalier", lat: 48.126, lon: 8.570, detections: 2, maxFrp: 56.1, avgFrp: 52.5, firstDate: "2026-04-02", lastDate: "2026-04-02", severity: "high", satellites: ["MODIS/A"], status: "extinguished" },
  { id: "FIRE-006", name: "Feu Cantabrie maritime", lat: 43.231, lon: -4.492, detections: 17, maxFrp: 55.8, avgFrp: 19.5, firstDate: "2026-04-06", lastDate: "2026-04-06", severity: "high", satellites: ["MODIS/A","Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-007", name: "Feu Navarre", lat: 42.054, lon: -1.653, detections: 2, maxFrp: 51.0, avgFrp: 27.6, firstDate: "2026-04-01", lastDate: "2026-04-03", severity: "high", satellites: ["MODIS/T"], status: "extinguished" },
  { id: "FIRE-008", name: "Feu Camargue persistant", lat: 43.443, lon: 4.891, detections: 134, maxFrp: 46.1, avgFrp: 3.7, firstDate: "2026-03-30", lastDate: "2026-04-06", severity: "high", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS","MODIS/T","MODIS/A"], status: "active" },
  { id: "FIRE-009", name: "Feu Lombardie frontalier", lat: 45.146, lon: 9.943, detections: 61, maxFrp: 44.2, avgFrp: 7.6, firstDate: "2026-03-30", lastDate: "2026-04-06", severity: "high", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS","MODIS/A"], status: "active" },
  { id: "FIRE-010", name: "Feu Landes Sud", lat: 44.103, lon: -0.655, detections: 5, maxFrp: 43.2, avgFrp: 19.6, firstDate: "2026-04-04", lastDate: "2026-04-06", severity: "moderate", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-011", name: "Feu Cantabrique interieur", lat: 42.758, lon: -4.732, detections: 5, maxFrp: 31.4, avgFrp: 18.5, firstDate: "2026-04-02", lastDate: "2026-04-02", severity: "moderate", satellites: ["MODIS/A","Suomi-NPP/VIIRS"], status: "extinguished" },
  { id: "FIRE-012", name: "Feu Rhenanie", lat: 50.911, lon: 6.506, detections: 1, maxFrp: 30.8, avgFrp: 30.8, firstDate: "2026-03-30", lastDate: "2026-03-30", severity: "moderate", satellites: ["MODIS/T"], status: "extinguished" },
  { id: "FIRE-013", name: "Feu Cologne", lat: 50.887, lon: 6.811, detections: 2, maxFrp: 29.5, avgFrp: 23.6, firstDate: "2026-04-01", lastDate: "2026-04-01", severity: "moderate", satellites: ["MODIS/T","MODIS/A"], status: "extinguished" },
  { id: "FIRE-014", name: "Feu Ardeche", lat: 44.747, lon: 4.484, detections: 3, maxFrp: 27.3, avgFrp: 18.4, firstDate: "2026-04-06", lastDate: "2026-04-06", severity: "moderate", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-015", name: "Feu Bonn", lat: 50.877, lon: 6.701, detections: 2, maxFrp: 26.1, avgFrp: 22.2, firstDate: "2026-04-01", lastDate: "2026-04-01", severity: "moderate", satellites: ["MODIS/T"], status: "extinguished" },
  { id: "FIRE-016", name: "Feu Herault garrigue", lat: 43.598, lon: 3.714, detections: 8, maxFrp: 24.5, avgFrp: 9.3, firstDate: "2026-04-03", lastDate: "2026-04-06", severity: "moderate", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-017", name: "Feu Aude", lat: 43.112, lon: 2.891, detections: 6, maxFrp: 22.1, avgFrp: 11.7, firstDate: "2026-04-04", lastDate: "2026-04-06", severity: "moderate", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-018", name: "Feu Gard", lat: 43.845, lon: 4.312, detections: 4, maxFrp: 19.8, avgFrp: 13.2, firstDate: "2026-04-05", lastDate: "2026-04-06", severity: "low", satellites: ["Suomi-NPP/VIIRS"], status: "active" },
  { id: "FIRE-019", name: "Feu Drome provencale", lat: 44.421, lon: 5.012, detections: 3, maxFrp: 18.4, avgFrp: 12.1, firstDate: "2026-04-05", lastDate: "2026-04-06", severity: "low", satellites: ["NOAA-20/VIIRS"], status: "active" },
  { id: "FIRE-020", name: "Feu Bouches-du-Rhone nord", lat: 43.612, lon: 5.178, detections: 7, maxFrp: 16.9, avgFrp: 8.4, firstDate: "2026-04-04", lastDate: "2026-04-06", severity: "low", satellites: ["Suomi-NPP/VIIRS","NOAA-20/VIIRS"], status: "active" },
];

// ─── CONFIG ───
const config = {
  version: "1.0.0",
  seasonActive: true,
  seasonStart: "2026-06-01",
  seasonEnd: "2026-10-31",
  marginPercent: 3,
  minBet: 10,
  maxBetPercent: 10,
  oddsRefreshIntervalMinutes: 60,
  firmsRefreshIntervalMinutes: 15,
  telegramBotUrl: "",
  telegramGroupUrl: "",
  dataSourcesEnabled: {
    firms: true,
    effis: true,
    openMeteo: true,
    ignCadastre: true,
    ignOrtho: true,
  },
};

// ─── SEED ───
async function seed() {
  console.log("Seeding Firestore for geoedge-app...\n");

  // 1. Zones
  console.log("--- zones ---");
  for (const zone of zones) {
    const { id, ...data } = zone;
    await db.collection("zones").doc(id).set({
      ...data,
      lastOddsUpdate: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
    console.log(`  + ${id} (${data.name})`);
  }

  // 2. Fires
  console.log("\n--- fires ---");
  for (const fire of fires) {
    const { id, lat, lon, ...data } = fire;
    await db.collection("fires").doc(id).set({
      ...data,
      centroid: new GeoPoint(lat, lon),
      source: "firms",
      matchedZones: [],
      detectedAt: Timestamp.fromDate(new Date(data.firstDate)),
      createdAt: Timestamp.now(),
    });
    console.log(`  + ${id} (${data.name}) — ${data.detections} pts, FRP ${data.maxFrp}`);
  }

  // 3. Config
  console.log("\n--- config ---");
  await db.collection("config").doc("app").set({
    ...config,
    updatedAt: Timestamp.now(),
  });
  console.log("  + config/app");

  // 4. firmsRaw
  console.log("\n--- firmsRaw ---");
  await db.collection("firmsRaw").doc("latest").set({
    importDate: Timestamp.now(),
    totalDetections: 1118,
    franceBbox: { minLon: -5, minLat: 41, maxLon: 10, maxLat: 51 },
    sources: ["SUOMI_VIIRS_C2_Europe_7d", "J1_VIIRS_C2_Europe_7d", "MODIS_C6_1_Europe_7d"],
    dateRange: { start: "2026-03-30", end: "2026-04-06" },
    bySatellite: {
      "Suomi-NPP/VIIRS": 512,
      "NOAA-20/VIIRS": 454,
      "MODIS/T": 77,
      "MODIS/A": 75,
    },
    geojsonPath: "/data/fires_france_real.geojson",
  });
  console.log("  + firmsRaw/latest");

  // 5. oddsHistory (initial entry per zone)
  console.log("\n--- oddsHistory ---");
  for (const zone of zones) {
    await db.collection("oddsHistory").doc(zone.id).collection("entries").add({
      odds7d: zone.currentOdds7d,
      odds30d: zone.currentOdds30d,
      oddsSeason: zone.currentOddsSeason,
      probability7d: zone.fireProbability7d,
      fwiIndex: zone.fwiIndex,
      meteo: zone.meteo,
      timestamp: Timestamp.now(),
    });
    console.log(`  + oddsHistory/${zone.id}/entries/initial`);
  }

  console.log("\n✓ Seed complete!");
  console.log(`  ${zones.length} zones`);
  console.log(`  ${fires.length} fires`);
  console.log(`  1 config`);
  console.log(`  1 firmsRaw`);
  console.log(`  ${zones.length} oddsHistory entries`);
}

seed().catch(console.error);
