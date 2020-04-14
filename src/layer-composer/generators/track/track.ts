import { scaleLinear, scalePow } from 'd3-scale'
import { FeatureCollection, LineString } from 'geojson'
import memoizeOne from 'memoize-one'
import { Group } from '../../types'
import { Type, TrackGeneratorConfig } from '../types'
import filterGeoJSONByTimerange from './filterGeoJSONByTimerange'
import { simplifyTrack } from './simplify-track'
import { memoizeByLayerId, memoizeCache } from '../../utils'

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

const getHighlightedData = (
  data: FeatureCollection,
  highlightedStart: string,
  highlightedEnd: string
) => {
  const startMs = new Date(highlightedStart).getTime()
  const endMs = new Date(highlightedEnd).getTime()

  const filteredData = filterGeoJSONByTimerange(data, startMs, endMs)

  return filteredData
}

class TrackGenerator {
  type = Type.Track

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
    const sources = [source]

    if (config.zoomLoadLevel && config.simplify) {
      source.data = memoizeCache[config.id].simplifyTrackWithZoomLevel(
        source.data,
        config.zoomLoadLevel
      )
    }

    if (config.start && config.end) {
      source.data = memoizeCache[config.id].filterByTimerange(source.data, config.start, config.end)
    }

    if (config.highlightedTime) {
      const highlightedData = memoizeCache[config.id].getHighlightedData(
        source.data,
        config.highlightedTime.start,
        config.highlightedTime.end
      )
      const highlightedSource = {
        id: `${config.id}_highlighted`,
        type: 'geojson',
        data: highlightedData,
      }
      sources.push(highlightedSource)
    }

    return sources
  }

  _getStyleLayers = (config: TrackGeneratorConfig) => {
    const layer = {
      type: 'line',
      id: config.id,
      source: config.id,
      layout: {},
      paint: { 'line-color': config.color || 'hsl(100, 100%, 55%)' },
      metadata: {
        group: Group.Track,
      },
    }
    const layers = [layer]
    if (config.highlightedTime) {
      const highlightedId = `${config.id}_highlighted`
      const highlightedLayer = {
        type: 'line',
        id: highlightedId,
        source: highlightedId,
        layout: {},
        paint: { 'line-color': 'white', 'line-width': 2 },
        metadata: {
          group: Group.TrackHighlighted,
        },
      }
      layers.push(highlightedLayer)
    }

    return layers
  }

  getStyle = (config: TrackGeneratorConfig) => {
    memoizeByLayerId(config.id, {
      simplifyTrackWithZoomLevel: memoizeOne(simplifyTrackWithZoomLevel),
      filterByTimerange: memoizeOne(filterByTimerange),
      getHighlightedData: memoizeOne(getHighlightedData),
    })
    return {
      id: config.id,
      sources: this._getStyleSources(config),
      layers: this._getStyleLayers(config),
    }
  }
}

export default TrackGenerator
