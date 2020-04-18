import flatten from 'lodash/flatten'
import zip from 'lodash/zip'
import { Group } from '../../types'
import { Type, HeatmapGeneratorConfig } from '../types'
import paintByGeomType from './heatmap-layers-paint'
import memoizeOne from 'memoize-one'
import { fetchStats, getServerSideFilters } from './utils'
import { memoizeByLayerId, memoizeCache } from '../../utils'
import {
  API_TILES_URL,
  API_ENDPOINTS,
  HEATMAP_GEOM_TYPES,
  HEATMAP_COLOR_RAMPS,
  HEATMAP_COLOR_RAMPS_RAMPS,
  HEATMAP_GEOM_TYPES_GL_TYPES,
  HEATMAP_DEFAULT_MAX_ZOOM,
  HEATMAP_DEFAULT_GEOM_TYPE,
} from './config'
import { statsByZoom } from './types'

class HeatmapGenerator {
  type = Type.Heatmap
  fastTilesAPI: string
  statsError = 0
  stats: statsByZoom | null = null

  constructor({ fastTilesAPI = API_TILES_URL }) {
    this.fastTilesAPI = fastTilesAPI
  }

  _getStyleSources = (layer: HeatmapGeneratorConfig) => {
    if (!layer.start || !layer.end || !layer.tileset) {
      throw new Error(
        `Heatmap generator must specify start, end and tileset parameters in ${layer}`
      )
    }
    const geomType = layer.geomType || HEATMAP_DEFAULT_GEOM_TYPE

    const tilesUrl = `${this.fastTilesAPI}/${layer.tileset}/${API_ENDPOINTS.tiles}`
    const url = new URL(tilesUrl)
    url.searchParams.set('geomType', geomType)
    url.searchParams.set('singleFrame', 'true')
    url.searchParams.set(
      'serverSideFilters',
      getServerSideFilters(layer.start, layer.end, layer.serverSideFilter)
    )

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

    let stops: number[] = []
    const zoom = Math.min(Math.floor(layer.zoom), layer.maxZoom || HEATMAP_DEFAULT_MAX_ZOOM)
    const statsByZoom = (this.stats !== null && this.stats[zoom]) || null
    if (statsByZoom) {
      const { min, max, avg } = statsByZoom
      stops = [0, min, min + (avg - min) / 2, avg, (max - avg) / 2, max]

      // const isAvgCloserToMin = avg - min < max - avg
      // const linearFactor = 1 / 3
      // stops = isAvgCloserToMin
      //   ? [0, min, min + (avg - min) * linearFactor, min + (avg - min) * linearFactor * 2, avg, max]
      //   : [0, min, avg, max - (max - avg) * linearFactor * 2, max - (max - avg) * linearFactor, max]

      const prevStepValues: number[] = []
      stops = stops.map((stop, index) => {
        let roundValue = Math.round(stop)
        if (prevStepValues.indexOf(roundValue) > -1) {
          roundValue = prevStepValues[index - 1] + 1
        }
        prevStepValues.push(roundValue)
        return roundValue
      })
    }

    const pickValueAt = 'value'
    const originalColorRamp = HEATMAP_COLOR_RAMPS_RAMPS[colorRampType as string]
    const legend = stops.length ? zip(stops, originalColorRamp) : []

    const colorRampValues = flatten(legend)
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
          gridArea: statsByZoom && statsByZoom.area,
          currentlyAt: pickValueAt,
          group: Group.Heatmap,
        },
      },
    ]
  }

  _getStyleLayers = (layer: HeatmapGeneratorConfig) => {
    if (layer.fetchStats !== true) {
      return { layers: this._getHeatmapLayers(layer) }
    }

    const serverSideFilters = getServerSideFilters(layer.start, layer.end, layer.serverSideFilter)
    // use statsError to invalidate cache and try again when it fails
    const statsUrl = `${this.fastTilesAPI}/${layer.tileset}/${API_ENDPOINTS.statistics}`
    const statsPromise = memoizeCache[layer.id]._fetchStats(
      statsUrl,
      serverSideFilters,
      true,
      this.statsError
    )
    const layers = this._getHeatmapLayers(layer)

    if (statsPromise.resolved) {
      return { layers }
    }

    const promise = new Promise((resolve, reject) => {
      statsPromise.then((stats: statsByZoom) => {
        this.stats = stats
        if (this.statsError > 0) {
          this.statsError = 0
        }
        resolve(this.getStyle(layer))
      })
      statsPromise.catch((e: any) => {
        this.statsError++
        reject(e)
      })
    })

    return { layers, promise }
  }

  getStyle = (layer: HeatmapGeneratorConfig) => {
    memoizeByLayerId(layer.id, {
      _fetchStats: memoizeOne(fetchStats),
    })
    const { layers, promise } = this._getStyleLayers(layer)
    return {
      id: layer.id,
      sources: this._getStyleSources(layer),
      layers,
      promise,
    }
  }
}

export default HeatmapGenerator
