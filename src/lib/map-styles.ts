export const MAP_STYLES = {
  streets: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

export const TILE_SOURCES = {
  /** IGN France Orthophoto — high-res aerial imagery, free, no key */
  satellite: {
    type: "raster" as const,
    tiles: [
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg&STYLE=normal",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "IGN France - BD ORTHO",
  },
  /** IGN Cadastre parcels — transparent PNG overlay, free, no key */
  cadastre: {
    type: "raster" as const,
    tiles: [
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png&STYLE=normal",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "IGN France - Cadastre",
  },
  /** EFFIS Fire Weather Index — daily fire danger forecast, WMS */
  fwi: {
    type: "raster" as const,
    tiles: [
      "https://maps.effis.emergency.copernicus.eu/gwis?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=fwi.fwi&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true",
    ],
    tileSize: 256,
    maxzoom: 12,
    attribution: "EFFIS/Copernicus EMS",
  },
  /** ESRI World Imagery — global fallback satellite */
  esriSatellite: {
    type: "raster" as const,
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "Esri, Maxar, Earthstar Geographics",
  },
};

export const FRANCE_CENTER: [number, number] = [2.5, 46.5];
export const DEFAULT_ZOOM = 5.5;
