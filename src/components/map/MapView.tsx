"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/stores/useMapStore";
import { MAP_STYLES, TILE_SOURCES, FRANCE_CENTER, DEFAULT_ZOOM } from "@/lib/map-styles";
import { RISK_COLORS } from "@/lib/risk-colors";
import { marketsToGeoJson } from "@/lib/markets-geojson";
import { marketZonesToGeoJson } from "@/lib/market-zones-geo";
import { activeBetsToGeoJson } from "@/lib/mock-data";
import type { BettingZone } from "@/types";

interface MapViewProps {
  zones: BettingZone[];
  firesGeoJson: GeoJSON.FeatureCollection | null;
  cadastreGeoJson: GeoJSON.FeatureCollection | null;
  riversGeoJson: GeoJSON.FeatureCollection | null;
  vigilanceGeoJson: GeoJSON.FeatureCollection | null;
  onZoneClick: (zone: BettingZone) => void;
  onDeselect: () => void;
}

export function MapView({ zones, firesGeoJson, cadastreGeoJson, riversGeoJson, vigilanceGeoJson, onZoneClick, onDeselect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { activeLayers, selectedZone, darkMode } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: darkMode ? MAP_STYLES.dark : MAP_STYLES.streets,
      center: FRANCE_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      // ─── 1. SATELLITE IGN (raster) ───
      map.addSource("satellite-tiles", TILE_SOURCES.satellite);
      map.addLayer({
        id: "satellite-layer", type: "raster", source: "satellite-tiles",
        paint: { "raster-opacity": 0 },
      }, map.getStyle().layers?.[1]?.id);

      // ─── 2. CADASTRE RASTER IGN (tuiles) ───
      map.addSource("cadastre-raster-tiles", TILE_SOURCES.cadastre);
      map.addLayer({
        id: "cadastre-raster-layer", type: "raster", source: "cadastre-raster-tiles",
        paint: { "raster-opacity": 0 },
      });

      // ─── 3. CADASTRE VECTOR (parcelles GeoJSON) ───
      if (cadastreGeoJson) {
        map.addSource("cadastre-parcels", { type: "geojson", data: cadastreGeoJson });

        map.addLayer({
          id: "cadastre-fill", type: "fill", source: "cadastre-parcels",
          paint: { "fill-color": "#6366F1", "fill-opacity": 0 },
          minzoom: 12,
        });

        map.addLayer({
          id: "cadastre-border", type: "line", source: "cadastre-parcels",
          paint: {
            "line-color": "#4338CA",
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 1.5],
            "line-opacity": 0,
          },
          minzoom: 12,
        });

        map.addLayer({
          id: "cadastre-label", type: "symbol", source: "cadastre-parcels",
          layout: {
            "text-field": ["get", "numero"],
            "text-size": 9,
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#4338CA",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 1,
            "text-opacity": 0,
          },
          minzoom: 15,
        });
      }

      // ─── 4. EFFIS FWI (raster WMS) ───
      map.addSource("fwi-tiles", TILE_SOURCES.fwi);
      map.addLayer({
        id: "fwi-layer", type: "raster", source: "fwi-tiles",
        paint: { "raster-opacity": 0 },
      });

      // ─── 5. BETTING ZONES (GeoJSON polygones) ───
      const zonesGeoJson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: zones.map((z) => ({
          type: "Feature" as const,
          properties: { zoneId: z.zoneId, name: z.name, risk: z.riskLevel, odds: `x${z.odds["7d"]}`, dept: z.department },
          geometry: z.geometry,
        })),
      };

      map.addSource("betting-zones", { type: "geojson", data: zonesGeoJson });

      map.addLayer({
        id: "zones-fill", type: "fill", source: "betting-zones",
        paint: {
          "fill-color": ["match", ["get", "risk"], "critical", RISK_COLORS.critical, "high", RISK_COLORS.high, "moderate", RISK_COLORS.moderate, "low", RISK_COLORS.low, "#6B7280"],
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "zones-border", type: "line", source: "betting-zones",
        paint: {
          "line-color": ["match", ["get", "risk"], "critical", RISK_COLORS.critical, "high", RISK_COLORS.high, "moderate", RISK_COLORS.moderate, "low", RISK_COLORS.low, "#6B7280"],
          "line-width": 2.5,
          "line-dasharray": [4, 2],
        },
      });

      map.addLayer({
        id: "zones-label", type: "symbol", source: "betting-zones",
        layout: {
          "text-field": ["concat", ["get", "name"], "\n", ["get", "odds"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 9, 10, 13],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-allow-overlap": false,
        },
        paint: { "text-color": "#111827", "text-halo-color": "#FFFFFF", "text-halo-width": 2 },
      });

      // ─── 6. FIRE POINTS FIRMS ───
      if (firesGeoJson) {
        map.addSource("fires", { type: "geojson", data: firesGeoJson });

        map.addLayer({
          id: "fires-heat", type: "circle", source: "fires",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 8, 16, 12, 24],
            "circle-color": ["interpolate", ["linear"], ["get", "frp"], 0, "#FDE047", 20, "#F97316", 50, "#EF4444", 100, "#991B1B"],
            "circle-opacity": 0.25,
            "circle-blur": 1,
          },
        });

        map.addLayer({
          id: "fires-point", type: "circle", source: "fires",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2, 8, 5, 12, 8],
            "circle-color": ["interpolate", ["linear"], ["get", "frp"], 0, "#FBBF24", 20, "#F97316", 50, "#EF4444", 100, "#7F1D1D"],
            "circle-opacity": 0.9,
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 4, 0.5, 10, 1.5],
          },
        });
      }

      // ─── 7. RIVERS (Hub'Eau stations) ───
      if (riversGeoJson) {
        map.addSource("rivers", { type: "geojson", data: riversGeoJson });
        map.addLayer({
          id: "rivers-point", type: "circle", source: "rivers",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3, 10, 8],
            "circle-color": "#3B82F6",
            "circle-opacity": 0.8,
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: "rivers-label", type: "symbol", source: "rivers",
          layout: {
            visibility: "none",
            "text-field": ["concat", ["get", "station_name"], "\n", ["get", "height_m"], "m"],
            "text-size": 9,
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-offset": [0, 1.5],
            "text-allow-overlap": false,
          },
          paint: { "text-color": "#1D4ED8", "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 },
          minzoom: 8,
        });
      }

      // ─── 8. VIGILANCE (department alerts) ───
      if (vigilanceGeoJson) {
        map.addSource("vigilance", { type: "geojson", data: vigilanceGeoJson });
        map.addLayer({
          id: "vigilance-point", type: "circle", source: "vigilance",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 8, 14],
            "circle-color": [
              "match", ["get", "level"],
              "rouge", "#DC2626",
              "orange", "#F97316",
              "jaune", "#FBBF24",
              "#10B981",
            ],
            "circle-opacity": 0.6,
            "circle-stroke-color": [
              "match", ["get", "level"],
              "rouge", "#991B1B",
              "orange", "#C2410C",
              "jaune", "#D97706",
              "#059669",
            ],
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "vigilance-label", type: "symbol", source: "vigilance",
          layout: {
            visibility: "none",
            "text-field": ["concat", ["get", "department_name"], "\n", ["get", "phenomena"]],
            "text-size": 10,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-anchor": "center",
            "text-allow-overlap": false,
          },
          paint: { "text-color": "#111827", "text-halo-color": "#FFFFFF", "text-halo-width": 2 },
        });
      }

      // ─── 9a. MARKET ZONES (thematic polygons) ───
      const mzGeoJson = marketZonesToGeoJson();
      map.addSource("market-zones", { type: "geojson", data: mzGeoJson });

      map.addLayer({
        id: "market-zones-fill", type: "fill", source: "market-zones",
        paint: {
          "fill-color": [
            "match", ["get", "category"],
            "flood", "#3B82F6",
            "rain", "#06B6D4",
            "storm", "#9CA3AF",
            "fire", "#EF4444",
            "catnat", "#F59E0B",
            "#8B5CF6",
          ],
          "fill-opacity": 0.12,
        },
      });

      map.addLayer({
        id: "market-zones-border", type: "line", source: "market-zones",
        paint: {
          "line-color": [
            "match", ["get", "category"],
            "flood", "#2563EB",
            "rain", "#0891B2",
            "storm", "#6B7280",
            "fire", "#DC2626",
            "catnat", "#D97706",
            "#7C3AED",
          ],
          "line-width": 2,
          "line-opacity": 0.6,
          "line-dasharray": [6, 3],
        },
      });

      map.addLayer({
        id: "market-zones-label", type: "symbol", source: "market-zones",
        layout: {
          "text-field": ["get", "label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 10, 13],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": [
            "match", ["get", "category"],
            "flood", "#1D4ED8",
            "rain", "#0E7490",
            "storm", "#4B5563",
            "fire", "#991B1B",
            "catnat", "#B45309",
            "#6D28D9",
          ],
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 2,
        },
        minzoom: 7,
      });

      // ─── 9b. MARKETS (prediction market pins) ───
      const marketsGeoJson = marketsToGeoJson();
      map.addSource("markets", { type: "geojson", data: marketsGeoJson });

      // Outer glow by category
      map.addLayer({
        id: "markets-glow", type: "circle", source: "markets",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 8, 10, 18],
          "circle-color": [
            "match", ["get", "category"],
            "flood", "#3B82F6",
            "rain", "#06B6D4",
            "storm", "#6B7280",
            "fire", "#EF4444",
            "catnat", "#F59E0B",
            "#8B5CF6",
          ],
          "circle-opacity": 0.2,
          "circle-blur": 0.5,
        },
      });

      // Core dot
      map.addLayer({
        id: "markets-point", type: "circle", source: "markets",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 10, 9],
          "circle-color": [
            "match", ["get", "category"],
            "flood", "#2563EB",
            "rain", "#0891B2",
            "storm", "#4B5563",
            "fire", "#DC2626",
            "catnat", "#D97706",
            "#7C3AED",
          ],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
        },
      });

      // Labels with yes% + type
      map.addLayer({
        id: "markets-label", type: "symbol", source: "markets",
        layout: {
          "text-field": ["concat", ["get", "yesPercent"], "% ", ["get", "type"]],
          "text-size": 10,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.8],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": [
            "match", ["get", "category"],
            "flood", "#1D4ED8",
            "rain", "#0E7490",
            "storm", "#374151",
            "fire", "#991B1B",
            "catnat", "#B45309",
            "#6D28D9",
          ],
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1.5,
        },
        minzoom: 6,
      });

      // ─── CLICK HANDLERS ───
      map.on("click", "zones-fill", (e) => {
        if (!e.features?.[0]) return;
        const zoneId = e.features[0].properties?.zoneId;
        const zone = zones.find((z) => z.zoneId === zoneId);
        if (zone) onZoneClick(zone);
      });

      // ─── 10. ACTIVE BETS (user's positions) ───
      const betsGeoJson = activeBetsToGeoJson();
      map.addSource("active-bets", { type: "geojson", data: betsGeoJson });

      map.addLayer({
        id: "bets-pulse", type: "circle", source: "active-bets",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 10, 10, 22],
          "circle-color": "#2563EB",
          "circle-opacity": 0.15,
          "circle-blur": 0.8,
        },
      });

      map.addLayer({
        id: "bets-point", type: "circle", source: "active-bets",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 10, 10],
          "circle-color": "#2563EB",
          "circle-opacity": 0.9,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2.5,
        },
      });

      map.addLayer({
        id: "bets-label", type: "symbol", source: "active-bets",
        layout: {
          "text-field": ["concat", ["get", "amount"], "€ x", ["get", "odds"]],
          "text-size": 10,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, -2],
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#1D4ED8", "text-halo-color": "#FFFFFF", "text-halo-width": 2 },
        minzoom: 6,
      });

      // Bet click popup
      map.on("click", "bets-point", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        const daysLeft = Math.max(0, Math.ceil((new Date(String(p?.expiresAt)).getTime() - Date.now()) / 86400000));
        new maplibregl.Popup({ offset: 14, maxWidth: "240px" })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px;line-height:1.5">
              <div style="font-size:10px;color:#2563EB;font-weight:700;margin-bottom:2px">MON PARI</div>
              <strong>${p?.zoneName}</strong>
              <div style="display:flex;gap:10px;margin-top:4px">
                <div><span style="font-size:16px;font-weight:800">${p?.amount}€</span><br/><span style="font-size:10px;color:#6B7280">Mise</span></div>
                <div><span style="font-size:16px;font-weight:800;color:#2563EB">x${p?.odds}</span><br/><span style="font-size:10px;color:#6B7280">Cote</span></div>
                <div><span style="font-size:16px;font-weight:800;color:#10B981">${p?.potentialGain}€</span><br/><span style="font-size:10px;color:#6B7280">Gain</span></div>
              </div>
              <div style="font-size:10px;color:#6B7280;margin-top:3px">${p?.horizon} · ${daysLeft}j restants</div>
            </div>`
          )
          .addTo(map);
      });

      // Market click popup
      map.on("click", "markets-point", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        const catEmoji: Record<string, string> = { flood: "🌊", rain: "🌧", storm: "💨", fire: "🔥", catnat: "📋" };
        const catLabel: Record<string, string> = { flood: "Inondation", rain: "Pluie", storm: "Tempete", fire: "Feu", catnat: "Cat Nat" };
        new maplibregl.Popup({ offset: 12, maxWidth: "260px" })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px;line-height:1.5">
              <div style="font-size:10px;color:#6B7280;margin-bottom:2px">${catEmoji[p?.category] || ""} ${catLabel[p?.category] || p?.category} — ${p?.type}</div>
              <strong style="font-size:13px">${p?.title}</strong>
              <div style="display:flex;gap:12px;margin-top:6px">
                <div><span style="font-size:18px;font-weight:800;color:#10B981">${p?.yesPercent}%</span><br/><span style="font-size:10px;color:#6B7280">Oui</span></div>
                <div><span style="font-size:18px;font-weight:800;color:#EF4444">${100 - Number(p?.yesPercent)}%</span><br/><span style="font-size:10px;color:#6B7280">Non</span></div>
                <div><span style="font-size:14px;font-weight:700">${(Number(p?.volume) / 1000).toFixed(1)}k</span><br/><span style="font-size:10px;color:#6B7280">Vol.</span></div>
              </div>
              <div style="font-size:10px;color:#6B7280;margin-top:4px">${p?.daysLeft}j restants · ${p?.participants} participants</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("click", "fires-point", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px;line-height:1.6">
              <strong style="color:#EF4444">${p?.satellite || "VIIRS"}</strong><br/>
              <span style="color:#6B7280">Date:</span> ${p?.acq_date} ${p?.acq_time}<br/>
              <span style="color:#6B7280">Confiance:</span> ${p?.confidence}<br/>
              <span style="color:#6B7280">FRP:</span> ${p?.frp} MW<br/>
              <span style="color:#6B7280">Coords:</span> ${Number(p?.latitude).toFixed(4)}, ${Number(p?.longitude).toFixed(4)}
            </div>`
          )
          .addTo(map);
      });

      // Cadastre parcel click
      if (cadastreGeoJson) {
        map.on("click", "cadastre-fill", (e) => {
          if (!e.features?.[0]) return;
          const p = e.features[0].properties;
          new maplibregl.Popup({ offset: 10 })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-size:12px;line-height:1.6">
                <strong style="color:#4338CA">Parcelle ${p?.numero || "?"}</strong><br/>
                <span style="color:#6B7280">Section:</span> ${p?.section || "?"}<br/>
                <span style="color:#6B7280">Commune:</span> ${p?.commune || p?.code_commune || "?"}<br/>
                <span style="color:#6B7280">Surface:</span> ${p?.contenance ? (Number(p.contenance) / 10000).toFixed(2) + " ha" : "?"}
              </div>`
            )
            .addTo(map);
        });
      }

      // Click on empty map → deselect
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["zones-fill", "fires-point", "cadastre-fill"].filter((id) => !!map.getLayer(id)),
        });
        if (features.length === 0) {
          onDeselect();
        }
      });

      // Cursors
      const pointer = () => { map.getCanvas().style.cursor = "pointer"; };
      const reset = () => { map.getCanvas().style.cursor = ""; };
      ["zones-fill", "fires-point", "cadastre-fill", "markets-point", "bets-point"].forEach((id) => {
        if (map.getLayer(id)) {
          map.on("mouseenter", id, pointer);
          map.on("mouseleave", id, reset);
        }
      });

      setLoaded(true);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ─── Layer visibility ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    // Raster layers
    const rasterCfg: Record<string, { ids: string[]; opacity: number; prop: string }> = {
      satellite: { ids: ["satellite-layer"], opacity: 0.85, prop: "raster-opacity" },
      risk: { ids: ["fwi-layer"], opacity: 0.6, prop: "raster-opacity" },
    };

    for (const [key, cfg] of Object.entries(rasterCfg)) {
      const visible = activeLayers.has(key as "satellite" | "risk");
      for (const id of cfg.ids) {
        if (map.getLayer(id)) {
          map.setPaintProperty(id, cfg.prop, visible ? cfg.opacity : 0);
        }
      }
    }

    // Cadastre: show raster at low zoom, vector at high zoom
    const cadastreActive = activeLayers.has("cadastre");
    if (map.getLayer("cadastre-raster-layer")) {
      map.setPaintProperty("cadastre-raster-layer", "raster-opacity", cadastreActive ? 0.6 : 0);
    }
    // Vector parcels
    if (map.getLayer("cadastre-fill")) {
      map.setPaintProperty("cadastre-fill", "fill-opacity", cadastreActive ? 0.08 : 0);
    }
    if (map.getLayer("cadastre-border")) {
      map.setPaintProperty("cadastre-border", "line-opacity", cadastreActive ? 0.7 : 0);
    }
    if (map.getLayer("cadastre-label")) {
      map.setPaintProperty("cadastre-label", "text-opacity", cadastreActive ? 1 : 0);
    }

    // Vector layers
    const vectorCfg: Record<string, string[]> = {
      zones: ["zones-fill", "zones-border", "zones-label"],
      fires: ["fires-point", "fires-heat"],
      rivers: ["rivers-point", "rivers-label"],
      vigilance: ["vigilance-point", "vigilance-label"],
      markets: ["markets-point", "markets-glow", "markets-label", "market-zones-fill", "market-zones-border", "market-zones-label"],
    };

    for (const [key, ids] of Object.entries(vectorCfg)) {
      const vis = activeLayers.has(key as "zones" | "fires") ? "visible" : "none";
      for (const id of ids) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      }
    }
  }, [activeLayers, loaded]);

  // ─── Fly to selected zone ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedZone || !loaded) return;
    const coords = selectedZone.geometry.coordinates[0];
    if (!coords?.length) return;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const bounds = new maplibregl.LngLatBounds(
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    );
    map.fitBounds(bounds, { padding: 60, duration: 1200, maxZoom: 13 });
  }, [selectedZone, loaded]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
