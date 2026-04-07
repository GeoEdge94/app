// ═══════════════════════════════════════════════════════════════════
// real-bets.ts — Real bet generator from official geospatial data
// ═══════════════════════════════════════════════════════════════════

export type RealBetCategory = "fire" | "flood" | "rain" | "storm" | "earthquake";

export interface RealBet {
  id: string;
  title: string;
  category: RealBetCategory;
  probability: number; // 0–1, computed from data
  yesPrice: number;
  noPrice: number;
  deadline: string; // ISO date
  oracleSource: string; // exact URL/API to check for resolution
  oracleCheck: string; // human-readable condition that resolves the bet
  coordinates: { lat: number; lon: number };
  proof: string; // satellite/data layer that proves the outcome
  volume: number; // EUR (realistic mock)
  participants: number;
  url?: string; // link to original bet on platform
  createdAt: string;
  department?: string;
  station?: string;
  threshold?: number;
  magnitude?: number;
}

// ── GeoJSON Feature type helpers ─────────────────────────────────

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  metadata?: Record<string, unknown>;
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
  id?: string;
}

// ── Deterministic pseudo-random from string seed ─────────────────

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: string): number {
  const h = hashSeed(seed);
  return (h % 10000) / 10000;
}

function seededVolume(seed: string, min: number, max: number): number {
  return Math.round(min + seededRandom(seed) * (max - min));
}

function seededParticipants(seed: string, min: number, max: number): number {
  return Math.round(min + seededRandom(seed + "-p") * (max - min));
}

// ── ISO date helpers ─────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Department lookup by lat/lon (simplified France grid) ────────

const FRANCE_DEPARTMENTS: Record<string, { name: string; code: string }> = {
  "43_2": { name: "Bouches-du-Rhone", code: "13" },
  "43_3": { name: "Var", code: "83" },
  "43_4": { name: "Alpes-Maritimes", code: "06" },
  "44_2": { name: "Vaucluse", code: "84" },
  "44_3": { name: "Alpes-de-Haute-Provence", code: "04" },
  "44_4": { name: "Hautes-Alpes", code: "05" },
  "44_5": { name: "Drome", code: "26" },
  "43_1": { name: "Herault", code: "34" },
  "43_0": { name: "Aude", code: "11" },
  "42_0": { name: "Pyrenees-Orientales", code: "66" },
  "44_0": { name: "Gard", code: "30" },
  "45_0": { name: "Lozere", code: "48" },
  "45_1": { name: "Ardeche", code: "07" },
  "46_2": { name: "Loire", code: "42" },
  "46_3": { name: "Rhone", code: "69" },
  "47_4": { name: "Saone-et-Loire", code: "71" },
  "48_2": { name: "Vosges", code: "88" },
  "48_6": { name: "Bas-Rhin", code: "67" },
  "47_6": { name: "Haut-Rhin", code: "68" },
  "45_-1": { name: "Charente-Maritime", code: "17" },
  "46_-1": { name: "Charente", code: "16" },
  "44_-1": { name: "Gironde", code: "33" },
  "43_-1": { name: "Landes", code: "40" },
  "48_0": { name: "Meurthe-et-Moselle", code: "54" },
  "49_2": { name: "Moselle", code: "57" },
};

function approxDepartment(lat: number, lon: number): { name: string; code: string } {
  const key = `${Math.round(lat)}_${Math.round(lon)}`;
  return FRANCE_DEPARTMENTS[key] ?? { name: `Zone ${lat.toFixed(1)}N ${lon.toFixed(1)}E`, code: "XX" };
}

// ═══════════════════════════════════════════════════════════════════
// Data processors — read GeoJSON and extract bet-worthy data
// ═══════════════════════════════════════════════════════════════════

interface FireCluster {
  department: string;
  departmentCode: string;
  count: number;
  avgBrightness: number;
  avgConfidence: number;
  avgFrp: number;
  centroidLat: number;
  centroidLon: number;
  latestDate: string;
}

function clusterFiresByDepartment(features: GeoJSONFeature[]): FireCluster[] {
  const clusters = new Map<string, {
    name: string;
    code: string;
    count: number;
    totalBrightness: number;
    totalConfidence: number;
    totalFrp: number;
    totalLat: number;
    totalLon: number;
    latestDate: string;
  }>();

  for (const f of features) {
    const coords = f.geometry.coordinates as number[];
    const lon = coords[0];
    const lat = coords[1];
    const props = f.properties;

    // Only count features inside France bounding box
    if (lat < 41 || lat > 51.5 || lon < -5.5 || lon > 10) continue;

    const dept = approxDepartment(lat, lon);
    const key = dept.code;

    const existing = clusters.get(key);
    const date = String(props.acq_date ?? "");
    const brightness = Number(props.brightness ?? 0);
    const confidence = Number(props.confidence ?? 0);
    const frp = Number(props.frp ?? 0);

    if (existing) {
      existing.count++;
      existing.totalBrightness += brightness;
      existing.totalConfidence += confidence;
      existing.totalFrp += frp;
      existing.totalLat += lat;
      existing.totalLon += lon;
      if (date > existing.latestDate) existing.latestDate = date;
    } else {
      clusters.set(key, {
        name: dept.name,
        code: dept.code,
        count: 1,
        totalBrightness: brightness,
        totalConfidence: confidence,
        totalFrp: frp,
        totalLat: lat,
        totalLon: lon,
        latestDate: date,
      });
    }
  }

  return Array.from(clusters.values())
    .map((c) => ({
      department: c.name,
      departmentCode: c.code,
      count: c.count,
      avgBrightness: c.totalBrightness / c.count,
      avgConfidence: c.totalConfidence / c.count,
      avgFrp: c.totalFrp / c.count,
      centroidLat: c.totalLat / c.count,
      centroidLon: c.totalLon / c.count,
      latestDate: c.latestDate,
    }))
    .sort((a, b) => b.count - a.count);
}

function generateFireBets(features: GeoJSONFeature[]): RealBet[] {
  const clusters = clusterFiresByDepartment(features);
  const topClusters = clusters.slice(0, 4);

  return topClusters.map((cluster, i) => {
    // Probability: more fires recently = higher probability of future fire
    // Baseline ~30%, +5% per detection up to cap of 90%
    const baseProbability = 0.3;
    const countBoost = Math.min(cluster.count * 0.05, 0.55);
    const confidenceBoost = (cluster.avgConfidence / 100) * 0.05;
    const probability = Math.min(baseProbability + countBoost + confidenceBoost, 0.92);
    const rounded = Math.round(probability * 100) / 100;

    return {
      id: `REAL-FIRE-${String(i + 1).padStart(3, "0")}`,
      title: `FIRMS detectera-t-il un feu actif dans le ${cluster.department} (${cluster.departmentCode}) sous 7 jours ?`,
      category: "fire" as const,
      probability: rounded,
      yesPrice: rounded,
      noPrice: Math.round((1 - rounded) * 100) / 100,
      deadline: daysFromNow(7),
      oracleSource: "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1",
      oracleCheck: `Au moins 1 detection FIRMS (VIIRS ou MODIS) dans le departement ${cluster.departmentCode} (${cluster.department}) dans les 7 prochains jours`,
      coordinates: {
        lat: Math.round(cluster.centroidLat * 1000) / 1000,
        lon: Math.round(cluster.centroidLon * 1000) / 1000,
      },
      proof: "NASA FIRMS VIIRS/MODIS Active Fire data — couche satellite thermique",
      volume: seededVolume(`fire-${cluster.departmentCode}`, 5000, 35000),
      participants: seededParticipants(`fire-${cluster.departmentCode}`, 15, 120),
      createdAt: new Date().toISOString(),
      department: cluster.departmentCode,
    };
  });
}

interface EarthquakeZone {
  place: string;
  mag: number;
  lat: number;
  lon: number;
  url: string;
  time: number;
}

function extractTopEarthquakes(features: GeoJSONFeature[]): EarthquakeZone[] {
  const quakes: EarthquakeZone[] = [];

  for (const f of features) {
    const props = f.properties;
    const coords = f.geometry.coordinates as number[];
    const mag = Number(props.mag ?? 0);
    const place = String(props.place ?? "Unknown");
    const url = String(props.url ?? "");
    const time = Number(props.time ?? 0);

    if (mag >= 4.0) {
      quakes.push({
        place,
        mag,
        lat: coords[1],
        lon: coords[0],
        url,
        time,
      });
    }
  }

  return quakes
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 4);
}

function generateEarthquakeBets(features: GeoJSONFeature[]): RealBet[] {
  const topQuakes = extractTopEarthquakes(features);

  return topQuakes.map((quake, i) => {
    // Higher recent magnitude = higher probability of aftershock / follow-up
    // Base 15% + magnitude scaling
    const baseProbability = 0.15;
    const magBoost = Math.min((quake.mag - 4) * 0.12, 0.45);
    const probability = Math.min(baseProbability + magBoost, 0.75);
    const rounded = Math.round(probability * 100) / 100;

    const shortPlace = quake.place.length > 50 ? quake.place.slice(0, 47) + "..." : quake.place;

    return {
      id: `REAL-QUAKE-${String(i + 1).padStart(3, "0")}`,
      title: `Seisme M5+ pres de "${shortPlace}" sous 30 jours ?`,
      category: "earthquake" as const,
      probability: rounded,
      yesPrice: rounded,
      noPrice: Math.round((1 - rounded) * 100) / 100,
      deadline: daysFromNow(30),
      oracleSource: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
      oracleCheck: `Seisme de magnitude >= 5.0 enregistre par USGS dans un rayon de 200km de (${quake.lat.toFixed(2)}, ${quake.lon.toFixed(2)}) sous 30 jours`,
      coordinates: {
        lat: Math.round(quake.lat * 1000) / 1000,
        lon: Math.round(quake.lon * 1000) / 1000,
      },
      proof: "USGS Earthquake Hazards Program — sismometre global",
      volume: seededVolume(`quake-${quake.place}`, 8000, 50000),
      participants: seededParticipants(`quake-${quake.place}`, 20, 150),
      createdAt: new Date().toISOString(),
      magnitude: quake.mag,
    };
  });
}

interface WeatherAlert {
  event: string;
  severity: string;
  headline: string;
  areaDesc: string;
  expires: string;
  lat: number;
  lon: number;
}

function extractWeatherAlerts(features: GeoJSONFeature[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  for (const f of features) {
    const props = f.properties;
    const event = String(props.event ?? "");
    const severity = String(props.severity ?? "");
    const headline = String(props.headline ?? "");
    const areaDesc = String(props.areaDesc ?? "");
    const expires = String(props.expires ?? "");

    // Extract centroid from polygon geometry
    let lat = 0;
    let lon = 0;
    if (f.geometry.type === "Polygon") {
      const ring = (f.geometry.coordinates as number[][][])[0];
      if (ring && ring.length > 0) {
        let totalLat = 0;
        let totalLon = 0;
        for (const pt of ring) {
          totalLon += pt[0];
          totalLat += pt[1];
        }
        lon = totalLon / ring.length;
        lat = totalLat / ring.length;
      }
    } else if (f.geometry.type === "Point") {
      const coords = f.geometry.coordinates as number[];
      lon = coords[0];
      lat = coords[1];
    }

    if (event && lat !== 0) {
      alerts.push({ event, severity, headline, areaDesc, expires, lat, lon });
    }
  }

  // Prioritize severe alerts
  const severityOrder: Record<string, number> = {
    Extreme: 4,
    Severe: 3,
    Moderate: 2,
    Minor: 1,
    Unknown: 0,
  };

  return alerts
    .sort((a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0))
    .slice(0, 4);
}

function mapAlertToCategory(event: string): RealBetCategory {
  const lower = event.toLowerCase();
  if (lower.includes("flood") || lower.includes("crue")) return "flood";
  if (lower.includes("storm") || lower.includes("wind") || lower.includes("tornado") || lower.includes("hurricane")) return "storm";
  if (lower.includes("fire")) return "fire";
  if (lower.includes("rain") || lower.includes("thunder")) return "rain";
  return "storm";
}

function generateWeatherBets(features: GeoJSONFeature[]): RealBet[] {
  const alerts = extractWeatherAlerts(features);

  return alerts.map((alert, i) => {
    const severityMap: Record<string, number> = {
      Extreme: 0.82,
      Severe: 0.65,
      Moderate: 0.45,
      Minor: 0.25,
    };
    const probability = severityMap[alert.severity] ?? 0.4;
    const rounded = Math.round(probability * 100) / 100;
    const category = mapAlertToCategory(alert.event);

    const shortArea = alert.areaDesc.length > 40
      ? alert.areaDesc.slice(0, 37) + "..."
      : alert.areaDesc;

    return {
      id: `REAL-WX-${String(i + 1).padStart(3, "0")}`,
      title: `${alert.event} confirmee pour ${shortArea} avant expiration ?`,
      category,
      probability: rounded,
      yesPrice: rounded,
      noPrice: Math.round((1 - rounded) * 100) / 100,
      deadline: alert.expires || daysFromNow(3),
      oracleSource: "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
      oracleCheck: `Alerte "${alert.event}" confirmee par le NWS pour la zone ${alert.areaDesc}. Verification: presence de l'alerte dans le flux NWS active alerts.`,
      coordinates: {
        lat: Math.round(alert.lat * 1000) / 1000,
        lon: Math.round(alert.lon * 1000) / 1000,
      },
      proof: "NOAA National Weather Service — flux alertes actives",
      volume: seededVolume(`wx-${alert.event}-${alert.areaDesc}`, 3000, 25000),
      participants: seededParticipants(`wx-${alert.event}-${alert.areaDesc}`, 10, 80),
      createdAt: new Date().toISOString(),
    };
  });
}

interface RiverStation {
  stationCode: string;
  stationName: string;
  riverName: string;
  heightM: number;
  lat: number;
  lon: number;
  observationDate: string;
}

function extractHighWaterStations(features: GeoJSONFeature[]): RiverStation[] {
  const stations: RiverStation[] = [];

  for (const f of features) {
    const props = f.properties;
    const coords = f.geometry.coordinates as number[];

    stations.push({
      stationCode: String(props.code_station ?? ""),
      stationName: String(props.station_name ?? ""),
      riverName: String(props.river_name ?? ""),
      heightM: Number(props.current_height_m ?? 0),
      lat: coords[1],
      lon: coords[0],
      observationDate: String(props.observation_date ?? ""),
    });
  }

  return stations
    .sort((a, b) => b.heightM - a.heightM)
    .slice(0, 4);
}

function generateFloodBets(features: GeoJSONFeature[]): RealBet[] {
  const stations = extractHighWaterStations(features);

  return stations.map((station, i) => {
    // Higher current water level = higher probability of exceeding alert threshold
    // Use current height to estimate probability
    // Typical alert thresholds: 1.5m-3m depending on river
    const estimatedThreshold = Math.max(station.heightM * 1.5, station.heightM + 0.5);
    const ratio = station.heightM / estimatedThreshold;
    const probability = Math.min(Math.max(ratio * 0.7, 0.1), 0.85);
    const rounded = Math.round(probability * 100) / 100;
    const thresholdRounded = Math.round(estimatedThreshold * 100) / 100;

    // Clean station name (fix encoding)
    const cleanName = station.stationName
      .replace(/Ã©/g, "e")
      .replace(/Ã¨/g, "e")
      .replace(/Ã /g, "a")
      .replace(/Ã®/g, "i")
      .replace(/Ã´/g, "o")
      .replace(/Ã¢/g, "a")
      .replace(/Ã§/g, "c")
      .replace(/Ã¼/g, "u")
      .replace(/Ã«/g, "e");

    const cleanRiver = station.riverName
      .replace(/Ã©/g, "e")
      .replace(/Ã¨/g, "e")
      .replace(/Ã /g, "a")
      .replace(/Ã®/g, "i")
      .replace(/Ã´/g, "o")
      .replace(/Ã¢/g, "a")
      .replace(/Ã§/g, "c")
      .replace(/Ã¼/g, "u")
      .replace(/Ã«/g, "e");

    return {
      id: `REAL-FLOOD-${String(i + 1).padStart(3, "0")}`,
      title: `${cleanRiver} a ${cleanName.split(" a ").pop() ?? cleanName} depassera ${thresholdRounded}m sous 14 jours ?`,
      category: "flood" as const,
      probability: rounded,
      yesPrice: rounded,
      noPrice: Math.round((1 - rounded) * 100) / 100,
      deadline: daysFromNow(14),
      oracleSource: `https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=${station.stationCode}&grandeur_hydro=H&size=1&sort=desc`,
      oracleCheck: `Hauteur d'eau a la station ${station.stationCode} (${cleanName}) depasse ${thresholdRounded}m dans les donnees Hub'Eau`,
      coordinates: {
        lat: Math.round(station.lat * 1000) / 1000,
        lon: Math.round(station.lon * 1000) / 1000,
      },
      proof: "Hub'Eau API hydrometrie — hauteur d'eau temps reel",
      volume: seededVolume(`flood-${station.stationCode}`, 4000, 30000),
      participants: seededParticipants(`flood-${station.stationCode}`, 12, 90),
      createdAt: new Date().toISOString(),
      station: station.stationCode,
      threshold: thresholdRounded,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// Additional bets from known official sources (EFFIS, Open-Meteo, Meteo des forets)
// These are generated from known seasonal patterns and official source URLs
// ═══════════════════════════════════════════════════════════════════

function generateStaticOfficialBets(): RealBet[] {
  return [
    {
      id: "REAL-EFFIS-001",
      title: "EFFIS detectera-t-il une zone brulee > 100ha dans les Bouches-du-Rhone sous 30 jours ?",
      category: "fire",
      probability: 0.35,
      yesPrice: 0.35,
      noPrice: 0.65,
      deadline: daysFromNow(30),
      oracleSource: "https://forest-fire.emergency.copernicus.eu/wms/burn",
      oracleCheck: "Couche EFFIS Burnt Areas MODIS/VIIRS Last 30 Days affiche zone > 100ha dans le departement 13",
      coordinates: { lat: 43.4, lon: 5.37 },
      proof: "EFFIS (Copernicus EMS) — burnt area MODIS/VIIRS satellite imagery",
      volume: seededVolume("effis-13", 6000, 20000),
      participants: seededParticipants("effis-13", 18, 65),
      createdAt: new Date().toISOString(),
      department: "13",
    },
    {
      id: "REAL-METEO-001",
      title: "Temperature > 35C a Nimes cette semaine ? (Open-Meteo forecast)",
      category: "storm",
      probability: 0.18,
      yesPrice: 0.18,
      noPrice: 0.82,
      deadline: daysFromNow(7),
      oracleSource: "https://api.open-meteo.com/v1/forecast?latitude=43.8367&longitude=4.3601&daily=temperature_2m_max&timezone=Europe/Paris",
      oracleCheck: "Temperature maximale quotidienne > 35C a Nimes (43.84N, 4.36E) dans les previsions Open-Meteo",
      coordinates: { lat: 43.837, lon: 4.36 },
      proof: "Open-Meteo API — previsions meteorologiques haute resolution",
      volume: seededVolume("meteo-nimes", 3000, 15000),
      participants: seededParticipants("meteo-nimes", 10, 50),
      createdAt: new Date().toISOString(),
      department: "30",
    },
    {
      id: "REAL-FORET-001",
      title: "Le Var (83) en rouge sur la Meteo des forets avant le 15 juillet ?",
      category: "fire",
      probability: 0.62,
      yesPrice: 0.62,
      noPrice: 0.38,
      deadline: "2026-07-15T23:59:00+02:00",
      oracleSource: "https://meteofrance.com/meteo-des-forets",
      oracleCheck: "Le departement du Var (83) affiche le niveau rouge (danger tres eleve) sur la carte Meteo des forets",
      coordinates: { lat: 43.467, lon: 6.217 },
      proof: "Meteo-France Meteo des forets — indice de danger feux de foret",
      volume: seededVolume("foret-83", 8000, 30000),
      participants: seededParticipants("foret-83", 25, 80),
      createdAt: new Date().toISOString(),
      department: "83",
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// Main generator — reads from public/data/ and builds 15+ real bets
// ═══════════════════════════════════════════════════════════════════

export async function generateRealBetsFromData(): Promise<RealBet[]> {
  const bets: RealBet[] = [];

  try {
    const firesRes = await fetch("/data/fires_france_real.geojson");
    if (firesRes.ok) {
      const firesData: GeoJSONFeatureCollection = await firesRes.json();
      bets.push(...generateFireBets(firesData.features));
    }
  } catch {
    console.warn("[real-bets] Could not load fires_france_real.geojson");
  }

  try {
    const quakesRes = await fetch("/data/usgs_earthquakes.geojson");
    if (quakesRes.ok) {
      const quakesData: GeoJSONFeatureCollection = await quakesRes.json();
      bets.push(...generateEarthquakeBets(quakesData.features));
    }
  } catch {
    console.warn("[real-bets] Could not load usgs_earthquakes.geojson");
  }

  try {
    const noaaRes = await fetch("/data/noaa_alerts.geojson");
    if (noaaRes.ok) {
      const noaaData: GeoJSONFeatureCollection = await noaaRes.json();
      bets.push(...generateWeatherBets(noaaData.features));
    }
  } catch {
    console.warn("[real-bets] Could not load noaa_alerts.geojson");
  }

  try {
    const riversRes = await fetch("/data/hubeau_rivers.geojson");
    if (riversRes.ok) {
      const riversData: GeoJSONFeatureCollection = await riversRes.json();
      bets.push(...generateFloodBets(riversData.features));
    }
  } catch {
    console.warn("[real-bets] Could not load hubeau_rivers.geojson");
  }

  // Add official source bets that reference known APIs
  bets.push(...generateStaticOfficialBets());

  return bets;
}

// ═══════════════════════════════════════════════════════════════════
// Static pre-generated bets (15) for SSR / fallback
// Built from the actual data files committed in public/data/
// ═══════════════════════════════════════════════════════════════════

export const REAL_BETS: RealBet[] = [
  // ── Fire bets (from FIRMS data — top departments by detection count) ──
  {
    id: "REAL-FIRE-001",
    title: "FIRMS detectera-t-il un feu actif dans le Var (83) sous 7 jours ?",
    category: "fire",
    probability: 0.72,
    yesPrice: 0.72,
    noPrice: 0.28,
    deadline: daysFromNow(7),
    oracleSource: "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1",
    oracleCheck: "Au moins 1 detection FIRMS (VIIRS ou MODIS) dans le departement 83 (Var) dans les 7 prochains jours",
    coordinates: { lat: 43.467, lon: 6.217 },
    proof: "NASA FIRMS VIIRS/MODIS Active Fire data — couche satellite thermique",
    volume: 24300,
    participants: 78,
    createdAt: new Date().toISOString(),
    department: "83",
  },
  {
    id: "REAL-FIRE-002",
    title: "FIRMS detectera-t-il un feu actif dans les Bouches-du-Rhone (13) sous 7 jours ?",
    category: "fire",
    probability: 0.68,
    yesPrice: 0.68,
    noPrice: 0.32,
    deadline: daysFromNow(7),
    oracleSource: "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1",
    oracleCheck: "Au moins 1 detection FIRMS (VIIRS ou MODIS) dans le departement 13 (Bouches-du-Rhone) dans les 7 prochains jours",
    coordinates: { lat: 43.4, lon: 5.37 },
    proof: "NASA FIRMS VIIRS/MODIS Active Fire data — couche satellite thermique",
    volume: 31200,
    participants: 94,
    createdAt: new Date().toISOString(),
    department: "13",
  },
  {
    id: "REAL-FIRE-003",
    title: "FIRMS detectera-t-il un feu actif dans l'Herault (34) sous 7 jours ?",
    category: "fire",
    probability: 0.55,
    yesPrice: 0.55,
    noPrice: 0.45,
    deadline: daysFromNow(7),
    oracleSource: "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1",
    oracleCheck: "Au moins 1 detection FIRMS dans le departement 34 (Herault) dans les 7 prochains jours",
    coordinates: { lat: 43.611, lon: 3.877 },
    proof: "NASA FIRMS VIIRS/MODIS Active Fire data — couche satellite thermique",
    volume: 18700,
    participants: 52,
    createdAt: new Date().toISOString(),
    department: "34",
  },

  // ── Earthquake bets (from USGS data — top magnitude events) ──
  {
    id: "REAL-QUAKE-001",
    title: "Seisme M5+ pres de \"186 km WSW of Bandar Lampung, Indonesia\" sous 30 jours ?",
    category: "earthquake",
    probability: 0.27,
    yesPrice: 0.27,
    noPrice: 0.73,
    deadline: daysFromNow(30),
    oracleSource: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    oracleCheck: "Seisme de magnitude >= 5.0 enregistre par USGS dans un rayon de 200km de (-6.19, 103.76) sous 30 jours",
    coordinates: { lat: -6.192, lon: 103.764 },
    proof: "USGS Earthquake Hazards Program — sismometre global",
    volume: 42100,
    participants: 132,
    createdAt: new Date().toISOString(),
    magnitude: 5.0,
  },
  {
    id: "REAL-QUAKE-002",
    title: "Seisme M5+ pres de \"south of the Kermadec Islands\" sous 30 jours ?",
    category: "earthquake",
    probability: 0.25,
    yesPrice: 0.25,
    noPrice: 0.75,
    deadline: daysFromNow(30),
    oracleSource: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    oracleCheck: "Seisme de magnitude >= 5.0 enregistre par USGS dans un rayon de 200km de la zone Kermadec sous 30 jours",
    coordinates: { lat: -32.5, lon: -178.3 },
    proof: "USGS Earthquake Hazards Program — sismometre global",
    volume: 28600,
    participants: 87,
    createdAt: new Date().toISOString(),
    magnitude: 4.8,
  },
  {
    id: "REAL-QUAKE-003",
    title: "Seisme M5+ en Mediterranee occidentale sous 30 jours ?",
    category: "earthquake",
    probability: 0.2,
    yesPrice: 0.2,
    noPrice: 0.8,
    deadline: daysFromNow(30),
    oracleSource: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    oracleCheck: "Seisme de magnitude >= 5.0 enregistre par USGS en Mediterranee occidentale (35-44N, -5 to 15E) sous 30 jours",
    coordinates: { lat: 38.5, lon: 5.2 },
    proof: "USGS Earthquake Hazards Program — sismometre global",
    volume: 19400,
    participants: 64,
    createdAt: new Date().toISOString(),
    magnitude: 4.2,
  },

  // ── Weather / storm bets (from NOAA alerts) ──
  {
    id: "REAL-WX-001",
    title: "Flood Warning confirmee pour Kent, MI avant expiration ?",
    category: "flood",
    probability: 0.65,
    yesPrice: 0.65,
    noPrice: 0.35,
    deadline: "2026-04-08T12:45:00-04:00",
    oracleSource: "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
    oracleCheck: "Alerte \"Flood Warning\" confirmee par le NWS pour la zone Kent, MI. Verification: presence de l'alerte dans le flux NWS active alerts.",
    coordinates: { lat: 42.94, lon: -85.76 },
    proof: "NOAA National Weather Service — flux alertes actives",
    volume: 12300,
    participants: 41,
    createdAt: new Date().toISOString(),
  },
  {
    id: "REAL-WX-002",
    title: "Flood Watch confirmee pour Vermont/New Hampshire avant expiration ?",
    category: "flood",
    probability: 0.65,
    yesPrice: 0.65,
    noPrice: 0.35,
    deadline: daysFromNow(3),
    oracleSource: "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
    oracleCheck: "Alerte \"Flood Watch\" confirmee par le NWS pour VT/NH. Verification: presence de l'alerte dans le flux NWS active alerts.",
    coordinates: { lat: 44.1, lon: -73.2 },
    proof: "NOAA National Weather Service — flux alertes actives",
    volume: 8900,
    participants: 28,
    createdAt: new Date().toISOString(),
  },
  {
    id: "REAL-WX-003",
    title: "Winter Storm Warning confirmee pour les Rocheuses avant expiration ?",
    category: "storm",
    probability: 0.45,
    yesPrice: 0.45,
    noPrice: 0.55,
    deadline: daysFromNow(2),
    oracleSource: "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
    oracleCheck: "Alerte \"Winter Storm Warning\" confirmee par le NWS pour la zone Rocky Mountains.",
    coordinates: { lat: 40.5, lon: -105.8 },
    proof: "NOAA National Weather Service — flux alertes actives",
    volume: 15700,
    participants: 53,
    createdAt: new Date().toISOString(),
  },

  // ── Flood bets (from Hub'Eau river stations with highest water levels) ──
  {
    id: "REAL-FLOOD-001",
    title: "La Moselle a Remiremont depassera 1.91m sous 14 jours ?",
    category: "flood",
    probability: 0.47,
    yesPrice: 0.47,
    noPrice: 0.53,
    deadline: daysFromNow(14),
    oracleSource: "https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=A420063002&grandeur_hydro=H&size=1&sort=desc",
    oracleCheck: "Hauteur d'eau a la station A420063002 (Moselle a Remiremont) depasse 1.91m dans les donnees Hub'Eau",
    coordinates: { lat: 48.02, lon: 6.597 },
    proof: "Hub'Eau API hydrometrie — hauteur d'eau temps reel",
    volume: 16400,
    participants: 47,
    createdAt: new Date().toISOString(),
    station: "A420063002",
    threshold: 1.91,
  },
  {
    id: "REAL-FLOOD-002",
    title: "La Moselle a Saint-Nabord depassera 1.33m sous 14 jours ?",
    category: "flood",
    probability: 0.47,
    yesPrice: 0.47,
    noPrice: 0.53,
    deadline: daysFromNow(14),
    oracleSource: "https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=A420063001&grandeur_hydro=H&size=1&sort=desc",
    oracleCheck: "Hauteur d'eau a la station A420063001 (Moselle a Saint-Nabord) depasse 1.33m dans les donnees Hub'Eau",
    coordinates: { lat: 48.067, lon: 6.611 },
    proof: "Hub'Eau API hydrometrie — hauteur d'eau temps reel",
    volume: 11200,
    participants: 34,
    createdAt: new Date().toISOString(),
    station: "A420063001",
    threshold: 1.33,
  },

  // ── EFFIS + Meteo des forets + Open-Meteo bets ──
  {
    id: "REAL-EFFIS-001",
    title: "EFFIS detectera-t-il une zone brulee > 100ha dans les Bouches-du-Rhone sous 30 jours ?",
    category: "fire",
    probability: 0.35,
    yesPrice: 0.35,
    noPrice: 0.65,
    deadline: daysFromNow(30),
    oracleSource: "https://forest-fire.emergency.copernicus.eu/wms/burn",
    oracleCheck: "Couche EFFIS Burnt Areas MODIS/VIIRS Last 30 Days affiche zone > 100ha dans le departement 13",
    coordinates: { lat: 43.4, lon: 5.37 },
    proof: "EFFIS (Copernicus EMS) — burnt area MODIS/VIIRS satellite imagery",
    volume: 14800,
    participants: 43,
    createdAt: new Date().toISOString(),
    department: "13",
  },
  {
    id: "REAL-METEO-001",
    title: "Temperature > 35C a Nimes cette semaine ? (Open-Meteo forecast)",
    category: "storm",
    probability: 0.18,
    yesPrice: 0.18,
    noPrice: 0.82,
    deadline: daysFromNow(7),
    oracleSource: "https://api.open-meteo.com/v1/forecast?latitude=43.8367&longitude=4.3601&daily=temperature_2m_max&timezone=Europe/Paris",
    oracleCheck: "Temperature maximale quotidienne > 35C a Nimes (43.84N, 4.36E) dans les previsions Open-Meteo",
    coordinates: { lat: 43.837, lon: 4.36 },
    proof: "Open-Meteo API — previsions meteorologiques haute resolution",
    volume: 7600,
    participants: 23,
    createdAt: new Date().toISOString(),
    department: "30",
  },
  {
    id: "REAL-FORET-001",
    title: "Le Var (83) en rouge sur la Meteo des forets avant le 15 juillet ?",
    category: "fire",
    probability: 0.62,
    yesPrice: 0.62,
    noPrice: 0.38,
    deadline: "2026-07-15T23:59:00+02:00",
    oracleSource: "https://meteofrance.com/meteo-des-forets",
    oracleCheck: "Le departement du Var (83) affiche le niveau rouge (danger tres eleve) sur la carte Meteo des forets",
    coordinates: { lat: 43.467, lon: 6.217 },
    proof: "Meteo-France Meteo des forets — indice de danger feux de foret",
    volume: 22100,
    participants: 68,
    createdAt: new Date().toISOString(),
    department: "83",
  },
];
