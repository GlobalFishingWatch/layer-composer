import { GeneratorConfig } from 'layer-composer/types'
import memoizeOne from 'memoize-one'
import { scaleLinear, scalePow } from 'd3-scale'
// TODO custom "augmented" GeoJSON type?
// see https://github.com/yagajs/generic-geojson/blob/master/index.d.ts
import { FeatureCollection, LineString } from 'geojson'
import filterGeoJSONByTimerange from './filterGeoJSONByTimerange'
import { simplifyTrack } from './simplify-track'

export const TRACK_TYPE = 'TRACK'

const mapZoomToMinPosΔ = (zoomLoadLevel: number) => {
  const normalizedZoom = scaleLinear()
    .clamp(true)
    .range([1, 0])
    .domain([3, 12])(zoomLoadLevel)

  const minPosΔ = scalePow()
    .clamp(true)
    .exponent(1.5)
    .range([0.0005, 0.05])
    .domain([0, 1])(normalizedZoom)

  console.log(zoomLoadLevel, normalizedZoom, minPosΔ)

  return minPosΔ
}

export interface TrackGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
  color?: string
}

class TrackGenerator {
  type = TRACK_TYPE

  _simplifyTrack = memoizeOne((data: FeatureCollection, zoomLoadLevel: number) => {
    const s = mapZoomToMinPosΔ(zoomLoadLevel)
    const simplifiedData = simplifyTrack(data as FeatureCollection<LineString>, s)
    console.log(simplifiedData)
    return simplifiedData
  })

  _filterByTimerange = memoizeOne((data: FeatureCollection, start: string, end: string) => {
    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()

    const filteredData = filterGeoJSONByTimerange(data, startMs, endMs)
    return filteredData
  })

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
      source.data = this._simplifyTrack(source.data, config.zoomLoadLevel)
    }

    if (config.start && config.end) {
      source.data = this._filterByTimerange(source.data, config.start, config.end)
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
    return {
      id: config.id,
      sources: this._getStyleSources(config),
      layers: this._getStyleLayers(config),
    }
  }
}

export default TrackGenerator
