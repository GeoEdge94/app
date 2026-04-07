import json, csv, os, datetime

tmp = os.environ.get('TEMP', os.environ.get('TMP', 'C:/Users/matth/AppData/Local/Temp'))
outdir = "C:/Users/matth/GeoEdge/app/public/data"
now = datetime.datetime.utcnow().isoformat() + "Z"

###############################################################################
# 1. USGS EARTHQUAKES - already GeoJSON, just add metadata
###############################################################################
print("=== Processing USGS Earthquakes ===")
with open(os.path.join(outdir, "usgs_earthquakes_raw.geojson"), "r", encoding="utf-8") as f:
    eq = json.load(f)

eq["metadata"]["_geoedge"] = {
    "source": "USGS Earthquake Hazards Program",
    "source_url": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    "fetched_at": now,
    "official_label": "USGS Magnitude 2.5+ Earthquakes, Past 7 Days",
    "description": "Real-time earthquake data from the U.S. Geological Survey"
}

with open(os.path.join(outdir, "usgs_earthquakes.geojson"), "w", encoding="utf-8") as f:
    json.dump(eq, f, ensure_ascii=False)

print(f"  Saved {len(eq['features'])} earthquakes")
os.remove(os.path.join(outdir, "usgs_earthquakes_raw.geojson"))

###############################################################################
# 2. NASA FIRMS FIRES - CSV to GeoJSON, filtered
###############################################################################
print("\n=== Processing NASA FIRMS Global Fires ===")

def read_viirs(filepath):
    results = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                frp = float(row.get("frp", 0))
                conf = row.get("confidence", "")
                conf_ok = conf.lower() in ("high", "h")
                if frp > 15 or conf_ok:
                    results.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(row["longitude"]), float(row["latitude"])]
                        },
                        "properties": {
                            "source_sensor": "VIIRS (Suomi NPP)",
                            "frp": frp,
                            "confidence": conf,
                            "brightness_ti4": float(row.get("bright_ti4", 0)),
                            "brightness_ti5": float(row.get("bright_ti5", 0)),
                            "acq_date": row.get("acq_date", ""),
                            "acq_time": row.get("acq_time", ""),
                            "satellite": row.get("satellite", ""),
                            "daynight": row.get("daynight", ""),
                            "scan": float(row.get("scan", 0)),
                            "track": float(row.get("track", 0))
                        }
                    })
            except (ValueError, KeyError):
                continue
    return results

def read_modis(filepath):
    results = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                frp = float(row.get("frp", 0))
                conf_val = int(row.get("confidence", 0))
                if frp > 15 or conf_val > 70:
                    results.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(row["longitude"]), float(row["latitude"])]
                        },
                        "properties": {
                            "source_sensor": "MODIS (Aqua/Terra)",
                            "frp": frp,
                            "confidence": conf_val,
                            "brightness": float(row.get("brightness", 0)),
                            "bright_t31": float(row.get("bright_t31", 0)),
                            "acq_date": row.get("acq_date", ""),
                            "acq_time": row.get("acq_time", ""),
                            "satellite": row.get("satellite", ""),
                            "daynight": row.get("daynight", ""),
                            "scan": float(row.get("scan", 0)),
                            "track": float(row.get("track", 0))
                        }
                    })
            except (ValueError, KeyError):
                continue
    return results

viirs_path = os.path.join(tmp, "viirs_global.csv")
modis_path = os.path.join(tmp, "modis_global.csv")

viirs_fires = read_viirs(viirs_path)
modis_fires = read_modis(modis_path)
print(f"  VIIRS significant fires: {len(viirs_fires)}")
print(f"  MODIS significant fires: {len(modis_fires)}")

all_fires = viirs_fires + modis_fires
all_fires.sort(key=lambda f: f["properties"]["frp"], reverse=True)
all_fires = all_fires[:2000]

fires_geojson = {
    "type": "FeatureCollection",
    "metadata": {
        "source": "NASA FIRMS (Fire Information for Resource Management System)",
        "source_urls": [
            "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv",
            "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv"
        ],
        "fetched_at": now,
        "official_label": "NASA FIRMS Global Active Fires (24h) - VIIRS & MODIS",
        "description": "Global active fire detections from NASA satellites, filtered for significant fires (FRP>15 or high confidence)",
        "filters_applied": "FRP > 15 MW or confidence > 70 (MODIS) / high (VIIRS)",
        "total_viirs_significant": len(viirs_fires),
        "total_modis_significant": len(modis_fires),
        "max_features": 2000
    },
    "features": all_fires
}

with open(os.path.join(outdir, "fires_global_24h.geojson"), "w", encoding="utf-8") as f:
    json.dump(fires_geojson, f, ensure_ascii=False)

print(f"  Saved {len(all_fires)} fires (sorted by FRP, top 2000)")

###############################################################################
# 3. NOAA ALERTS
###############################################################################
print("\n=== Processing NOAA Weather Alerts ===")
with open(os.path.join(tmp, "noaa_alerts.json"), "r", encoding="utf-8") as f:
    noaa = json.load(f)

features_with_geom = []
features_no_geom = []

for feat in noaa.get("features", []):
    props = feat.get("properties", {})
    clean_props = {
        "event": props.get("event", ""),
        "severity": props.get("severity", ""),
        "certainty": props.get("certainty", ""),
        "urgency": props.get("urgency", ""),
        "headline": props.get("headline", ""),
        "description": (props.get("description", "") or "")[:500],
        "areaDesc": props.get("areaDesc", ""),
        "effective": props.get("effective", ""),
        "expires": props.get("expires", ""),
        "senderName": props.get("senderName", ""),
        "status": props.get("status", ""),
        "messageType": props.get("messageType", ""),
        "category": props.get("category", ""),
        "source": "NOAA/NWS"
    }

    geom = feat.get("geometry")
    if geom and geom.get("coordinates"):
        features_with_geom.append({
            "type": "Feature",
            "geometry": geom,
            "properties": clean_props
        })
    else:
        features_no_geom.append({
            "type": "Feature",
            "geometry": None,
            "properties": clean_props
        })

all_noaa = features_with_geom + features_no_geom

noaa_geojson = {
    "type": "FeatureCollection",
    "metadata": {
        "source": "NOAA National Weather Service",
        "source_url": "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
        "fetched_at": now,
        "official_label": "NWS Active Weather Alerts (US)",
        "description": "Active weather alerts from the National Weather Service including watches, warnings, and advisories",
        "features_with_geometry": len(features_with_geom),
        "features_zone_based": len(features_no_geom),
        "total_alerts": len(all_noaa)
    },
    "features": all_noaa
}

with open(os.path.join(outdir, "noaa_alerts.geojson"), "w", encoding="utf-8") as f:
    json.dump(noaa_geojson, f, ensure_ascii=False)

print(f"  Saved {len(all_noaa)} alerts ({len(features_with_geom)} with geometry, {len(features_no_geom)} zone-based)")

###############################################################################
# 4. GDACS ALERTS
###############################################################################
print("\n=== Building GDACS Alerts GeoJSON ===")

gdacs_features = [
    # FLOOD EVENTS
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [67.5317602, 27.9463141]},
        "properties": {
            "event_type": "Flood", "event_id": 1103821, "episode": 2,
            "alert_level": "Green", "severity": 0.0,
            "country": "Pakistan", "source_agency": "GLOFAS",
            "date_start": "2026-03-25", "date_end": "2026-04-04"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-75.5736, 6.2443]},
        "properties": {
            "event_type": "Flood", "event_id": 1103831, "episode": 1,
            "alert_level": "Green", "severity": 0.0,
            "country": "Colombia", "source_agency": "GLOFAS",
            "date_start": "2026-04-03", "date_end": "2026-04-05"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-65.2038, -26.8304]},
        "properties": {
            "event_type": "Flood", "event_id": 1103822, "episode": 3,
            "alert_level": "Green", "severity": 0.0,
            "country": "Argentina", "source_agency": "GLOFAS",
            "date_start": "2026-03-28", "date_end": "2026-04-06"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [15.5130, -9.6499]},
        "properties": {
            "event_type": "Flood", "event_id": 1103828, "episode": 4,
            "alert_level": "Green", "severity": 0.0,
            "country": "Angola", "source_agency": "GLOFAS",
            "date_start": "2026-03-28", "date_end": "2026-04-06"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [48.2889, 41.4499]},
        "properties": {
            "event_type": "Flood", "event_id": 1103818, "episode": 2,
            "alert_level": "Green", "severity": 0.0,
            "country": "Azerbaijan", "source_agency": "GLOFAS",
            "date_start": "2026-03-27", "date_end": "2026-04-07"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [47.5049, 42.9830]},
        "properties": {
            "event_type": "Flood", "event_id": 1103819, "episode": 3,
            "alert_level": "Green", "severity": 0.0,
            "country": "Russia", "source_agency": "GLOFAS",
            "date_start": "2026-03-27", "date_end": "2026-04-07"
        }
    },
    # EARTHQUAKE EVENTS
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [68.913, -21.8707]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533187, "episode": 1697569,
            "alert_level": "Green", "magnitude": 5.5, "depth_km": 10,
            "country": "Mid-Indian Ridge", "source_agency": "NEIC",
            "date": "2026-04-04T04:55:32Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [121.6455, 23.9901]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533366, "episode": 1697764,
            "alert_level": "Green", "magnitude": 5.5, "depth_km": 22.066,
            "country": "Taiwan", "source_agency": "NEIC",
            "date": "2026-04-04T17:14:57Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [130.8226, -25.9274]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533376, "episode": 1697775,
            "alert_level": "Green", "magnitude": 5.5, "depth_km": 10,
            "country": "Australia", "source_agency": "NEIC",
            "date": "2026-04-04T18:26:13Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-177.8645, -32.0412]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533580, "episode": 1697992,
            "alert_level": "Green", "magnitude": 5.5, "depth_km": 10,
            "country": "South of Kermadec Islands", "source_agency": "NEIC",
            "date": "2026-04-05T13:22:15Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [70.852, 36.5479]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533026, "episode": 1697401,
            "alert_level": "Green", "magnitude": 5.8, "depth_km": 186.371,
            "country": "Afghanistan", "source_agency": "NEIC",
            "date": "2026-04-03T16:12:58Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [126.0732, 1.1109]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533130, "episode": 1697512,
            "alert_level": "Green", "magnitude": 5.9, "depth_km": 48.684,
            "country": "Indonesia", "source_agency": "NEIC",
            "date": "2026-04-04T01:35:00Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-129.111, -54.994]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533793, "episode": 1698236,
            "alert_level": "Green", "magnitude": 5.9, "depth_km": 10,
            "country": "Pacific-Antarctic Ridge", "source_agency": "NEIC",
            "date": "2026-04-06T11:18:37Z"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [126.1031, 4.8892]},
        "properties": {
            "event_type": "Earthquake", "event_id": 1533278, "episode": 1697666,
            "alert_level": "Green", "magnitude": 6.0, "depth_km": 99.568,
            "country": "Philippines", "source_agency": "NEIC",
            "date": "2026-04-04T10:34:31Z"
        }
    },
    # TROPICAL CYCLONE
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [71.38, -29.68]},
        "properties": {
            "event_type": "Tropical Cyclone", "event_id": 1001267, "episode": 16,
            "alert_level": "Green", "name": "INDUSA-26",
            "classification": "Post-tropical Depression",
            "max_wind_kmh": 148,
            "country": "Off-shore (No land impact)", "source_agency": "RSMC",
            "date_start": "2026-04-01", "date_end": "2026-04-05"
        }
    }
]

gdacs_geojson = {
    "type": "FeatureCollection",
    "metadata": {
        "source": "GDACS - Global Disaster Alerting Coordination System (UN/EC)",
        "source_url": "https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?eventtypes=EQ,TC,FL,VO,WF&maxResults=50",
        "fetched_at": now,
        "official_label": "GDACS Active Disaster Alerts",
        "description": "Global disaster alerts from the UN/EC GDACS system including earthquakes, tropical cyclones, floods, volcanoes, and wildfires",
        "event_types_requested": ["EQ", "TC", "FL", "VO", "WF"],
        "total_events": len(gdacs_features)
    },
    "features": gdacs_features
}

with open(os.path.join(outdir, "gdacs_alerts.geojson"), "w", encoding="utf-8") as f:
    json.dump(gdacs_geojson, f, ensure_ascii=False)

print(f"  Saved {len(gdacs_features)} GDACS events")

###############################################################################
# 5. TROPICAL CYCLONES
###############################################################################
print("\n=== Tropical Cyclones ===")
print("  No active tropical cyclone alerts from NWS (empty features array)")
print("  GDACS cyclone (INDUSA-26, post-tropical) included in gdacs_alerts.geojson")

###############################################################################
# Summary
###############################################################################
print("\n" + "=" * 60)
print("SUMMARY OF ALL FILES")
print("=" * 60)
for fname in ["fires_global_24h.geojson", "noaa_alerts.geojson", "gdacs_alerts.geojson", "usgs_earthquakes.geojson"]:
    fpath = os.path.join(outdir, fname)
    size = os.path.getsize(fpath)
    with open(fpath, "r", encoding="utf-8") as f:
        d = json.load(f)
    count = len(d.get("features", []))
    print(f"  {fname}: {count} features, {size:,} bytes")
