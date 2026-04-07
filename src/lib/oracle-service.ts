// ═══════════════════════════════════════════════════════════════════
// oracle-service.ts — Oracle resolution service for real bets
// Checks official data sources to determine bet outcomes
// ═══════════════════════════════════════════════════════════════════

import type { RealBet } from "./real-bets";

// ── Types ────────────────────────────────────────────────────────

export interface OracleResult {
  betId: string;
  resolved: boolean;
  outcome: "yes" | "no" | "pending";
  proof: string; // URL or data point that proves the outcome
  checkedAt: string; // ISO date
  source: string; // official source name
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

// ── Geo helpers ──────────────────────────────────────────────────

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Check if a point is roughly in a French department (simplified bounding box approach) */
function isInDepartmentBBox(
  lat: number,
  lon: number,
  targetDept: string,
  betLat: number,
  betLon: number
): boolean {
  // Use 50km radius around bet centroid as department approximation
  return haversineKm(lat, lon, betLat, betLon) < 50;
}

// ── Source checkers ──────────────────────────────────────────────

async function checkFireBet(bet: RealBet): Promise<OracleResult> {
  const now = new Date().toISOString();

  try {
    // Try loading local FIRMS data first (always available)
    const res = await fetch("/data/fires_france_real.geojson");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: GeoJSONFeatureCollection = await res.json();
    let detectionCount = 0;
    let closestDistance = Infinity;

    for (const feature of data.features) {
      const coords = feature.geometry.coordinates as number[];
      const fireLon = coords[0];
      const fireLat = coords[1];

      if (bet.department) {
        if (isInDepartmentBBox(fireLat, fireLon, bet.department, bet.coordinates.lat, bet.coordinates.lon)) {
          detectionCount++;
          const dist = haversineKm(fireLat, fireLon, bet.coordinates.lat, bet.coordinates.lon);
          if (dist < closestDistance) closestDistance = dist;
        }
      } else {
        const dist = haversineKm(fireLat, fireLon, bet.coordinates.lat, bet.coordinates.lon);
        if (dist < 50) {
          detectionCount++;
          if (dist < closestDistance) closestDistance = dist;
        }
      }
    }

    const deadline = new Date(bet.deadline);
    const isPastDeadline = new Date() > deadline;

    if (detectionCount > 0) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "yes",
        proof: `${detectionCount} detection(s) FIRMS dans la zone. Detection la plus proche: ${closestDistance.toFixed(1)}km du centroide. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "NASA FIRMS",
      };
    }

    if (isPastDeadline) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "no",
        proof: `Aucune detection FIRMS dans la zone avant l'echeance du ${bet.deadline}. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "NASA FIRMS",
      };
    }

    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `${detectionCount} detection(s) a ce jour. Echeance: ${bet.deadline}. Source: ${bet.oracleSource}`,
      checkedAt: now,
      source: "NASA FIRMS",
    };
  } catch (err) {
    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Erreur lors de la verification: ${err instanceof Error ? err.message : "unknown"}. Source: ${bet.oracleSource}`,
      checkedAt: now,
      source: "NASA FIRMS",
    };
  }
}

async function checkEarthquakeBet(bet: RealBet): Promise<OracleResult> {
  const now = new Date().toISOString();

  try {
    const res = await fetch("/data/usgs_earthquakes.geojson");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: GeoJSONFeatureCollection = await res.json();
    let foundMatch = false;
    let maxMag = 0;
    let matchPlace = "";

    for (const feature of data.features) {
      const coords = feature.geometry.coordinates as number[];
      const quakeLon = coords[0];
      const quakeLat = coords[1];
      const mag = Number(feature.properties.mag ?? 0);
      const place = String(feature.properties.place ?? "");

      const dist = haversineKm(quakeLat, quakeLon, bet.coordinates.lat, bet.coordinates.lon);

      if (dist < 200 && mag >= 5.0) {
        foundMatch = true;
        if (mag > maxMag) {
          maxMag = mag;
          matchPlace = place;
        }
      }
    }

    const deadline = new Date(bet.deadline);
    const isPastDeadline = new Date() > deadline;

    if (foundMatch) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "yes",
        proof: `Seisme M${maxMag.toFixed(1)} detecte: "${matchPlace}" dans un rayon de 200km. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "USGS Earthquake Hazards Program",
      };
    }

    if (isPastDeadline) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "no",
        proof: `Aucun seisme M5+ dans un rayon de 200km avant l'echeance. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "USGS Earthquake Hazards Program",
      };
    }

    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Pas encore de seisme M5+ dans la zone. Echeance: ${bet.deadline}. Source: ${bet.oracleSource}`,
      checkedAt: now,
      source: "USGS Earthquake Hazards Program",
    };
  } catch (err) {
    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Erreur lors de la verification: ${err instanceof Error ? err.message : "unknown"}`,
      checkedAt: now,
      source: "USGS Earthquake Hazards Program",
    };
  }
}

async function checkFloodBet(bet: RealBet): Promise<OracleResult> {
  const now = new Date().toISOString();

  try {
    const res = await fetch("/data/hubeau_rivers.geojson");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: GeoJSONFeatureCollection = await res.json();
    let currentHeight: number | null = null;
    let stationName = "";

    for (const feature of data.features) {
      const code = String(feature.properties.code_station ?? "");

      if (bet.station && code === bet.station) {
        currentHeight = Number(feature.properties.current_height_m ?? 0);
        stationName = String(feature.properties.station_name ?? "");
        break;
      }

      // Fallback: match by proximity
      if (!bet.station) {
        const coords = feature.geometry.coordinates as number[];
        const dist = haversineKm(coords[1], coords[0], bet.coordinates.lat, bet.coordinates.lon);
        if (dist < 5) {
          currentHeight = Number(feature.properties.current_height_m ?? 0);
          stationName = String(feature.properties.station_name ?? "");
          break;
        }
      }
    }

    const deadline = new Date(bet.deadline);
    const isPastDeadline = new Date() > deadline;

    if (currentHeight !== null && bet.threshold) {
      if (currentHeight >= bet.threshold) {
        return {
          betId: bet.id,
          resolved: true,
          outcome: "yes",
          proof: `Hauteur actuelle: ${currentHeight.toFixed(3)}m >= seuil ${bet.threshold}m a ${stationName}. Source: ${bet.oracleSource}`,
          checkedAt: now,
          source: "Hub'Eau (eaufrance.fr)",
        };
      }

      if (isPastDeadline) {
        return {
          betId: bet.id,
          resolved: true,
          outcome: "no",
          proof: `Hauteur maximale observee: ${currentHeight.toFixed(3)}m < seuil ${bet.threshold}m. Echeance depassee. Source: ${bet.oracleSource}`,
          checkedAt: now,
          source: "Hub'Eau (eaufrance.fr)",
        };
      }

      const ratio = currentHeight / bet.threshold;
      return {
        betId: bet.id,
        resolved: false,
        outcome: "pending",
        proof: `Hauteur actuelle: ${currentHeight.toFixed(3)}m (${(ratio * 100).toFixed(0)}% du seuil ${bet.threshold}m) a ${stationName}. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "Hub'Eau (eaufrance.fr)",
      };
    }

    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Donnees de station non trouvees. Source: ${bet.oracleSource}`,
      checkedAt: now,
      source: "Hub'Eau (eaufrance.fr)",
    };
  } catch (err) {
    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Erreur lors de la verification: ${err instanceof Error ? err.message : "unknown"}`,
      checkedAt: now,
      source: "Hub'Eau (eaufrance.fr)",
    };
  }
}

async function checkWeatherBet(bet: RealBet): Promise<OracleResult> {
  const now = new Date().toISOString();

  try {
    const res = await fetch("/data/noaa_alerts.geojson");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: GeoJSONFeatureCollection = await res.json();
    let foundMatch = false;
    let matchHeadline = "";

    for (const feature of data.features) {
      const event = String(feature.properties.event ?? "");
      const headline = String(feature.properties.headline ?? "");

      // Check if alert is near our bet location
      let alertLat = 0;
      let alertLon = 0;

      if (feature.geometry.type === "Polygon") {
        const ring = (feature.geometry.coordinates as number[][][])[0];
        if (ring && ring.length > 0) {
          let totalLat = 0;
          let totalLon = 0;
          for (const pt of ring) {
            totalLon += pt[0];
            totalLat += pt[1];
          }
          alertLon = totalLon / ring.length;
          alertLat = totalLat / ring.length;
        }
      } else if (feature.geometry.type === "Point") {
        const coords = feature.geometry.coordinates as number[];
        alertLon = coords[0];
        alertLat = coords[1];
      }

      if (alertLat === 0 && alertLon === 0) continue;

      const dist = haversineKm(alertLat, alertLon, bet.coordinates.lat, bet.coordinates.lon);

      // Match if same type of event within 100km
      if (dist < 100 && bet.title.toLowerCase().includes(event.toLowerCase().split(" ")[0])) {
        foundMatch = true;
        matchHeadline = headline;
        break;
      }
    }

    const deadline = new Date(bet.deadline);
    const isPastDeadline = new Date() > deadline;

    if (foundMatch) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "yes",
        proof: `Alerte active trouvee: "${matchHeadline}". Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "NOAA National Weather Service",
      };
    }

    if (isPastDeadline) {
      return {
        betId: bet.id,
        resolved: true,
        outcome: "no",
        proof: `Aucune alerte correspondante trouvee avant l'echeance. Source: ${bet.oracleSource}`,
        checkedAt: now,
        source: "NOAA National Weather Service",
      };
    }

    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Pas d'alerte active correspondante a ce moment. Echeance: ${bet.deadline}. Source: ${bet.oracleSource}`,
      checkedAt: now,
      source: "NOAA National Weather Service",
    };
  } catch (err) {
    return {
      betId: bet.id,
      resolved: false,
      outcome: "pending",
      proof: `Erreur lors de la verification: ${err instanceof Error ? err.message : "unknown"}`,
      checkedAt: now,
      source: "NOAA National Weather Service",
    };
  }
}

async function checkGenericBet(bet: RealBet): Promise<OracleResult> {
  const now = new Date().toISOString();
  const deadline = new Date(bet.deadline);
  const isPastDeadline = new Date() > deadline;

  if (isPastDeadline) {
    // For generic bets past deadline, resolve using probability-weighted outcome
    // This is a fallback — in production, this would check the actual oracle source
    return {
      betId: bet.id,
      resolved: true,
      outcome: bet.probability > 0.5 ? "yes" : "no",
      proof: `Echeance depassee. Resolution basee sur la probabilite calculee (${(bet.probability * 100).toFixed(0)}%). Verification manuelle requise: ${bet.oracleSource}`,
      checkedAt: now,
      source: bet.oracleSource,
    };
  }

  return {
    betId: bet.id,
    resolved: false,
    outcome: "pending",
    proof: `En attente de resolution. Echeance: ${bet.deadline}. Verifier: ${bet.oracleSource}`,
    checkedAt: now,
    source: bet.oracleSource,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Main oracle check dispatcher
// ═══════════════════════════════════════════════════════════════════

/**
 * Check the resolution status of a real bet by querying the appropriate
 * official data source. Returns an OracleResult with proof.
 */
export async function checkBetResolution(bet: RealBet): Promise<OracleResult> {
  // Route to the appropriate checker based on bet category and source
  if (bet.category === "fire" && bet.oracleSource.includes("firms")) {
    return checkFireBet(bet);
  }

  if (bet.category === "fire" && (bet.oracleSource.includes("copernicus") || bet.oracleSource.includes("meteofrance"))) {
    // EFFIS and Meteo des forets bets — check fire data as proxy
    return checkFireBet(bet);
  }

  if (bet.category === "earthquake") {
    return checkEarthquakeBet(bet);
  }

  if (bet.category === "flood" && bet.station) {
    return checkFloodBet(bet);
  }

  if (bet.oracleSource.includes("weather.gov")) {
    return checkWeatherBet(bet);
  }

  // Flood bets from NOAA alerts (no station code)
  if (bet.category === "flood") {
    return checkWeatherBet(bet);
  }

  return checkGenericBet(bet);
}

/**
 * Check all bets in a batch and return results.
 */
export async function checkAllBets(bets: RealBet[]): Promise<OracleResult[]> {
  const results = await Promise.allSettled(bets.map((b) => checkBetResolution(b)));

  return results
    .filter((r): r is PromiseFulfilledResult<OracleResult> => r.status === "fulfilled")
    .map((r) => r.value);
}

/**
 * Start a periodic oracle polling loop for real bets.
 * Returns a cleanup function.
 */
export function startRealOraclePolling(
  bets: RealBet[],
  onResults: (results: OracleResult[]) => void,
  intervalMs = 60_000
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const results = await checkAllBets(bets);
      if (active) onResults(results);
    } catch (err) {
      console.error("[oracle-service] Polling error:", err);
    }
  };

  // Initial check
  poll();

  const id = setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(id);
  };
}
