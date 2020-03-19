import { Group, Dictionary } from '../../../types'
import { Layer, AnySourceImpl } from 'mapbox-gl'

export const BASEMAPS = {
  Satellite: 'satellite',
  Landmass: 'landmass',
  Graticules: 'graticules',
}

const BASEMAP_VECTOR_SOURCE = 'basemap_vector'

export const layers: Dictionary<Layer> = {
  [BASEMAPS.Satellite]: {
    type: 'raster',
    id: BASEMAPS.Satellite,
    source: BASEMAPS.Satellite,
    metadata: {
      group: Group.Basemap,
    },
  },
  [BASEMAPS.Landmass]: {
    type: 'fill',
    id: BASEMAPS.Landmass,
    source: BASEMAP_VECTOR_SOURCE,
    'source-layer': BASEMAPS.Landmass,
    metadata: {
      group: Group.BasemapFill,
    },
    paint: {
      'fill-color': '#203560',
      'fill-opacity': 0.99,
    },
  },
  [BASEMAPS.Graticules]: {
    type: 'line',
    id: BASEMAPS.Graticules,
    source: BASEMAP_VECTOR_SOURCE,
    'source-layer': 'graticules',
    metadata: {
      group: Group.Basemap,
    },
    paint: {
      'line-color': '#ffffff',
      'line-opacity': {
        base: 1,
        stops: [
          [0, 0.1],
          [8, 0.2],
          [9, 0.2],
        ],
      },
      'line-width': 0.5,
    },
  },
}

export const sources: Dictionary<AnySourceImpl> = {
  [BASEMAPS.Satellite]: {
    tiles: [
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    ],
    type: 'raster',
    tileSize: 256,
  },
  [BASEMAP_VECTOR_SOURCE]: {
    type: 'vector',
    tiles: ['https://storage.googleapis.com/public-tiles/tiles-basemap/{z}/{x}/{y}.pbf'],
    maxzoom: 8,
  },
}
