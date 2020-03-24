import { GeneratorConfig, Dictionary } from 'layer-composer/types'
import memoizeOne from 'memoize-one'
import { scaleLinear, scalePow } from 'd3-scale'
// TODO custom "augmented" GeoJSON type?
// see https://github.com/yagajs/generic-geojson/blob/master/index.d.ts
import { FeatureCollection, LineString } from 'geojson'
import filterGeoJSONByTimerange from './filterGeoJSONByTimerange'
import { simplifyTrack } from './simplify-track'

export const TRACK_TYPE = 'TRACK'

const mapZoomToMinPosΔ = (zoomLoadLevel: number) => {
  // first normalize and invert z level
  const normalizedZoom = scaleLinear()
    .clamp(true)
    .range([1, 0])
    .domain([3, 12])(zoomLoadLevel)

  const MIN_POS_Δ_LOW_ZOOM = 0.1
  const MIN_POS_Δ_HIGH_ZOOM = 0.0005
  const DETAIL_INCREASE_RATE = 1.5 // Higher = min delta lower at intermediate zoom levels = more detail at intermediate zoom levels

  const minPosΔ = scalePow()
    .clamp(true)
    .exponent(DETAIL_INCREASE_RATE)
    .range([MIN_POS_Δ_HIGH_ZOOM, MIN_POS_Δ_LOW_ZOOM])
    .domain([0, 1])(normalizedZoom)

  return minPosΔ
}

export interface TrackGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
  color?: string
}

const memoizedById: Dictionary<Dictionary<(...args: any[]) => any>> = {}
const memoizeById = (id: string, fun: (...args: any[]) => any) => {
  if (memoizedById[id] === undefined) {
    memoizedById[id] = {}
  }
  if (!memoizedById[id][fun.name]) {
    memoizedById[id][fun.name] = memoizeOne(fun)
  }
  return memoizedById[id][fun.name]
}

const simplifyTrackWithZoomLevel = (
  data: FeatureCollection,
  zoomLoadLevel: number
): FeatureCollection => {
  const s = mapZoomToMinPosΔ(zoomLoadLevel)
  const simplifiedData = simplifyTrack(data as FeatureCollection<LineString>, s)
  return simplifiedData
}

const filterByTimerange = (data: FeatureCollection, start: string, end: string) => {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()

  const filteredData = filterGeoJSONByTimerange(data, startMs, endMs)
  return filteredData
}

class TrackGenerator {
  type = TRACK_TYPE

  _getStyleSources = (config: TrackGeneratorConfig) => {
    const defaultGeoJSON: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    }
    const source = {
      id: config.id,
      type: 'geojson',
      data: config.data || defaultGeoJSON,
    }

    if (config.zoomLoadLevel) {
      source.data = memoizedById[config.id].simplifyTrackWithZoomLevel(
        source.data,
        config.zoomLoadLevel
      )
    }

    if (config.start && config.end) {
      source.data = memoizedById[config.id].filterByTimerange(source.data, config.start, config.end)
    }

    return [source]
  }

  _getStyleLayers = (config: TrackGeneratorConfig) => {
    const layer = {
      type: 'line',
      id: config.id,
      source: config.id,
      layout: {},
      paint: { 'line-color': config.color || 'hsl(100, 100%, 55%)' },
    }
    return [layer]
  }

  getStyle = (config: TrackGeneratorConfig) => {
    memoizeById(config.id, simplifyTrackWithZoomLevel)
    memoizeById(config.id, filterByTimerange)
    return {
      id: config.id,
      sources: this._getStyleSources(config),
      layers: this._getStyleLayers(config),
    }
  }
}

export default TrackGenerator
