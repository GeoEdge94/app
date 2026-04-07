/**
 * Satellite and aerial imagery tile sources for MapLibre GL JS.
 * All URLs verified working as of 2026-04-07.
 *
 * Usage with MapLibre:
 *   map.addSource('satellite', SATELLITE_TILES.esriWorldImagery);
 *   map.addLayer({ id: 'satellite-layer', type: 'raster', source: 'satellite' });
 */

export const SATELLITE_TILES = {
  /**
   * ESRI World Imagery - global high-res satellite/aerial imagery.
   * Free for non-commercial and limited commercial use.
   * Verified: returns 256x256 JPEG tiles.
   */
  esriWorldImagery: {
    type: "raster" as const,
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution:
      "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxzoom: 19,
  },

  /**
   * IGN France Orthophoto - high-resolution aerial imagery for France.
   * Free and open (Geoplateforme / data.geopf.fr). No API key required.
   * Verified: returns 256x256 JPEG tiles.
   */
  ignOrthophoto: {
    type: "raster" as const,
    tiles: [
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg&STYLE=normal",
    ],
    tileSize: 256,
    attribution: "IGN France - BD ORTHO",
    maxzoom: 19,
  },
} as const;

/**
 * Fire data sources - NASA FIRMS endpoints for active fire data.
 * These URLs return CSV files that can be filtered by region.
 */
export const FIRE_DATA_SOURCES = {
  /** Suomi NPP VIIRS Collection 2 - Europe, last 24 hours */
  suomiViirs24h:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Europe_24h.csv",

  /** Suomi NPP VIIRS Collection 2 - Europe, last 7 days */
  suomiViirs7d:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Europe_7d.csv",

  /** NOAA-20 VIIRS Collection 2 - Europe, last 24 hours */
  noaa20Viirs24h:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Europe_24h.csv",

  /** NOAA-20 VIIRS Collection 2 - Europe, last 7 days */
  noaa20Viirs7d:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Europe_7d.csv",

  /** MODIS Collection 6.1 - Europe, last 24 hours */
  modis24h:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Europe_24h.csv",

  /** MODIS Collection 6.1 - Europe, last 7 days */
  modis7d:
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Europe_7d.csv",
} as const;

/** France bounding box for filtering fire data: [minLon, minLat, maxLon, maxLat] */
export const FRANCE_BBOX = [-5, 41, 10, 51] as const;

/** Static fire data file path (pre-filtered for France) */
export const FIRE_GEOJSON_PATH = "/data/fires_france_real.geojson";
