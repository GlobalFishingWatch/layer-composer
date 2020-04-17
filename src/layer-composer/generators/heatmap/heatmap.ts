import flatten from 'lodash/flatten'
import compact from 'lodash/compact'
import debounce from 'lodash/debounce'
import zip from 'lodash/zip'
import { Group } from '../../types'
import { Type, HeatmapGeneratorConfig, HeatmapColorRamp, HeatmapColorRampColors } from '../types'
import paintByGeomType from './heatmap-layers-paint'
import memoizeOne from 'memoize-one'
import { memoizeByLayerId, memoizeCache } from '../../utils'

export const HEATMAP_TYPE = 'HEATMAP'
export const HEATMAP_DEFAULT_MAX_ZOOM = 12
const API_TILES_URL = 'https://fst-tiles-jzzp2ui3wq-uc.a.run.app/v1'
const API_ENDPOINTS = {
  tiles: 'tile/heatmap/{z}/{x}/{y}',
  statistics: 'statistics',
}

export const toDays = (date: string) => {
  return Math.floor(new Date(date).getTime() / 1000 / 60 / 60 / 24)
}

export const DEFAULT_QUANTIZE_OFFSET = toDays('2019-01-01T00:00:00.000Z')

export type Geoms = 'blob' | 'gridded' | 'extruded'
export type HeatmapGeoms = {
  [key: string]: Geoms
}

export const HEATMAP_GEOM_TYPES: HeatmapGeoms = {
  BLOB: 'blob',
  GRIDDED: 'gridded',
  EXTRUDED: 'extruded',
}

export type GeomGl = 'heatmap' | 'fill' | 'fill-extrusion'
export type HeatmapGeomGL = {
  [key: string]: GeomGl
}
export const HEATMAP_GEOM_TYPES_GL_TYPES: HeatmapGeomGL = {
  [HEATMAP_GEOM_TYPES.BLOB]: 'heatmap',
  [HEATMAP_GEOM_TYPES.GRIDDED]: 'fill',
  [HEATMAP_GEOM_TYPES.EXTRUDED]: 'fill-extrusion',
}

export const HEATMAP_COLOR_RAMPS: HeatmapColorRamp = {
  FISHING: 'fishing',
  PRESENCE: 'presence',
  RECEPTION: 'reception',
}

const HEATMAP_COLOR_RAMPS_RAMPS: HeatmapColorRampColors = {
  [HEATMAP_COLOR_RAMPS.FISHING]: [
    'rgba(12, 39, 108, 0)',
    'rgb(12, 39, 108)',
    '#3B9088',
    '#EEFF00',
    '#ffffff',
  ],
  [HEATMAP_COLOR_RAMPS.PRESENCE]: [
    'rgba(12, 39, 108, 0)',
    'rgb(12, 39, 108)',
    '#114685',
    '#00ffc3',
    '#ffffff',
  ],
  [HEATMAP_COLOR_RAMPS.RECEPTION]: [
    'rgba(255, 69, 115, 0)',
    'rgb(255, 69, 115)',
    '#7b2e8d',
    '#093b76',
    '#0c276c',
  ],
}

// TODO this can yield different deltas depending even when start and end stays equally further apart:
//  improve logic or throttle
// TODO should work also with hours
const getDelta = (start: string, end: string) => {
  const startTimestampMs = new Date(start).getTime()
  const endTimestampMs = new Date(end).getTime()
  const startTimestampDays = startTimestampMs / 1000 / 60 / 60 / 24
  const endTimestampDays = endTimestampMs / 1000 / 60 / 60 / 24
  const daysDelta = Math.round(endTimestampDays - startTimestampDays)
  return daysDelta
}

// TODO This is hardcoded for now, but it will need to be set intelligently
// const quantizeOffset = DEFAULT_QUANTIZE_OFFSET

// TODO for now only works in days
const toQuantizedDays = (date: string, quantizeOffset: number) => {
  const days = toDays(date)
  return days - quantizeOffset
}

type stats = {
  max: number
  min: number
  median: number
}

class HeatmapGenerator {
  type = Type.Heatmap
  loadingStats = false
  fastTilesAPI: string
  quantizeOffset = 0
  currentSetDeltaDebounced: any
  delta = 0
  stats: stats | null = null

  constructor({ fastTilesAPI = API_TILES_URL }) {
    this.fastTilesAPI = fastTilesAPI
  }

  _getServerSideFilters = (
    serverSideFilter = '',
    start: string,
    end: string,
    useStartAndEnd = false
  ) => {
    const serverSideFiltersList = []

    if (serverSideFilter) {
      serverSideFiltersList.push(serverSideFilter)
    }

    if (useStartAndEnd) {
      serverSideFiltersList.push(`timestamp > '${start.slice(0, 19).replace('T', ' ')}'`)
      serverSideFiltersList.push(`timestamp < '${end.slice(0, 19).replace('T', ' ')}'`)
    }
    const serverSideFilters = serverSideFiltersList.join(' AND ')
    return serverSideFilters
  }

  _fetchStats = (tileset: string, zoom: number, serverSideFilters: string) => {
    this.loadingStats = true
    const statsUrl = new URL(`${this.fastTilesAPI}/${tileset}/${API_ENDPOINTS.statistics}/${zoom}`)
    if (serverSideFilters) {
      statsUrl.searchParams.set('filters', serverSideFilters)
    }
    return fetch(statsUrl.toString(), { cache: 'force-cache' })
      .then((r) => {
        if (r.ok) return r.json()
        throw r
      })
      .then((statsResponse) => {
        this.stats = statsResponse
        this.loadingStats = false
        return statsResponse
      })
      .catch((e) => {
        console.warn(e)
        this.loadingStats = false
        return e
      })
  }

  _getStyleSources = (layer: HeatmapGeneratorConfig) => {
    if (!layer.start || !layer.end || !layer.tileset) {
      throw new Error(
        `Heatmap generator must specify start, end and tileset parameters in ${layer}`
      )
    }
    const geomType = layer.geomType || HEATMAP_GEOM_TYPES.GRIDDED

    const tilesUrl = `${this.fastTilesAPI}/${layer.tileset}/${API_ENDPOINTS.tiles}`
    const url = new URL(tilesUrl)
    url.searchParams.set('geomType', geomType)
    url.searchParams.set('quantizeOffset', this.quantizeOffset.toString())
    url.searchParams.set('delta', this.delta.toString())

    if (layer.singleFrame === true) {
      url.searchParams.set('singleFrame', layer.singleFrame.toString())
      url.searchParams.set('start', layer.start)
    }

    if (layer.serverSideFilter) {
      url.searchParams.set(
        'serverSideFilters',
        this._getServerSideFilters(
          layer.serverSideFilter,
          layer.start,
          layer.end,
          layer.updateColorRampOnTimeChange
        )
      )
    }
    return [
      {
        id: layer.id,
        type: 'temporalgrid' as const,
        tiles: [decodeURI(url.toString())],
        maxzoom: layer.maxZoom || HEATMAP_DEFAULT_MAX_ZOOM,
      },
    ]
  }

  _getHeatmapLayers = (layer: HeatmapGeneratorConfig) => {
    const geomType = layer.geomType || HEATMAP_GEOM_TYPES.GRIDDED
    const colorRampType = layer.colorRamp || HEATMAP_COLOR_RAMPS.PRESENCE
    const colorRampMult = layer.colorRampMult || 1

    const delta = this.delta
    const overallMult = colorRampMult * delta

    let stops: number[] = []
    if (this.stats !== null) {
      const medianOffseted = this.stats.median - this.stats.min + 0.001
      const maxOffseted = this.stats.max - this.stats.min + 0.002
      const medianMaxOffsetedValue = medianOffseted + (maxOffseted - medianOffseted) / 2
      stops = [
        // first meaningful value = use minimum value in stats
        this.stats.min,
        // next step = use median value in stats
        this.stats.min + medianOffseted * overallMult,
        // this is the intermediate value bnetween median and max
        this.stats.min + medianMaxOffsetedValue * overallMult,
        // final step = max value for current zoom level
        this.stats.min + maxOffseted * overallMult,
      ]
    }

    const originalColorRamp = HEATMAP_COLOR_RAMPS_RAMPS[colorRampType as any]
    let legend = stops.length ? zip(stops, originalColorRamp) : []

    const colorRampValues = flatten(legend)

    const d = toQuantizedDays(layer.start, this.quantizeOffset)
    const pickValueAt = layer.singleFrame ? 'value' : d.toString()

    const valueExpression = ['to-number', ['get', pickValueAt]]
    const colorRamp =
      colorRampValues.length > 0
        ? ['interpolate', ['linear'], valueExpression, ...colorRampValues]
        : 'transparent'
    const paint = { ...(paintByGeomType as any)[geomType] }
    switch (geomType) {
      case HEATMAP_GEOM_TYPES.GRIDDED:
        paint['fill-color'] = colorRamp
        break
      case HEATMAP_GEOM_TYPES.EXTRUDED:
        paint['fill-extrusion-color'] = colorRamp
        const zoomFactor = layer.zoom ? 1 / Math.ceil(layer.zoom) : 1
        const extrusionHeightRamp = flatten(
          zip(stops, [
            0,
            10000 * zoomFactor,
            150000 * zoomFactor,
            300000 * zoomFactor,
            500000 * zoomFactor,
          ])
        )
        paint['fill-extrusion-height'] = [
          'interpolate',
          ['linear'],
          valueExpression,
          ...extrusionHeightRamp,
        ]

        break
      case HEATMAP_GEOM_TYPES.BLOB:
        paint['heatmap-weight'] = valueExpression
        const hStops = [0, 0.005, 0.1, 0.3, 1]
        const heatmapColorRamp = flatten(zip(hStops, originalColorRamp))
        paint['heatmap-color'] = [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          ...heatmapColorRamp,
        ]
        paint['heatmap-opacity'] = layer.opacity || 1
        break
      default:
        break
    }

    // 'desactivate' legend values that are similar
    let prevValidValue: number | null
    legend = legend.map(([value, color], i) => {
      let rdFn = Math.round
      if (i === 0) rdFn = Math.floor
      if (i === 4) rdFn = Math.ceil
      let finalValue = value ? rdFn(value) : 0
      if (i > 0 && prevValidValue === finalValue) {
        finalValue = 0
      } else {
        prevValidValue = finalValue
      }
      return [finalValue, color]
    })

    const visibility: 'visible' | 'none' = layer && layer.visible ? 'visible' : 'none'
    return [
      {
        id: layer.id,
        source: layer.id,
        'source-layer': 'temporalgrid',
        type: HEATMAP_GEOM_TYPES_GL_TYPES[geomType],
        layout: {
          visibility,
        },
        paint,
        metadata: {
          legend,
          currentlyAt: pickValueAt,
          group: Group.Heatmap,
        },
      },
    ]
  }

  _getStyleLayers = (layer: HeatmapGeneratorConfig) => {
    const zoom = Math.floor(layer.zoom)
    const maxZoom = layer.maxZoom || HEATMAP_DEFAULT_MAX_ZOOM
    if (layer.fetchStats !== true || zoom > maxZoom) {
      return { layers: this._getHeatmapLayers(layer) }
    }
    const serverSideFilters = this._getServerSideFilters(
      layer.serverSideFilter,
      layer.start,
      layer.end,
      layer.updateColorRampOnTimeChange
    )

    const statsPromise = memoizeCache[layer.id]._fetchStats(layer.tileset, zoom, serverSideFilters)
    const layers = this._getHeatmapLayers(layer)

    if (this.loadingStats === false) {
      return { layers }
    }

    const promise = new Promise((resolve) => {
      statsPromise.then(() => {
        resolve(this.getStyle(layer))
      })
    })

    return { layers, promise }
  }

  _updateDelta = (layer: HeatmapGeneratorConfig) => {
    const newDelta = getDelta(layer.start, layer.end)
    if (newDelta === this.delta) return null

    if (this.currentSetDeltaDebounced) this.currentSetDeltaDebounced.cancel()

    const promise = new Promise((resolve) => {
      this.currentSetDeltaDebounced = debounce(() => {
        this.delta = newDelta
        resolve(this.getStyle(layer))
      }, 400)
      this.currentSetDeltaDebounced()
    })

    return promise
  }
  _setDelta = debounce(this._updateDelta, 1000)

  getStyle = (layer: HeatmapGeneratorConfig) => {
    memoizeByLayerId(layer.id, {
      _fetchStats: memoizeOne(this._fetchStats),
    })
    if (!this.delta) {
      this.delta = getDelta(layer.start, layer.end)
    }
    this.quantizeOffset = layer.quantizeOffset || DEFAULT_QUANTIZE_OFFSET
    if (layer.singleFrame === true) {
      this.quantizeOffset = layer.start as any
    }
    const { layers, promise } = this._getStyleLayers(layer)
    const deltaPromise: any = this._updateDelta(layer)
    const promises = compact([promise, deltaPromise])
    return {
      id: layer.id,
      sources: this._getStyleSources(layer),
      layers,
      promises,
    }
  }
}

export default HeatmapGenerator
