/* eslint-disable @typescript-eslint/camelcase */
import layersDirectory from './carto-polygons-layers'
import { GeneratorStyles } from 'layer-composer/types'
import { Type, CartoPolygonsGeneratorConfig } from '../types'

export const CARTO_FISHING_MAP_API = 'https://carto.globalfishingwatch.org/user/admin/api/v1/map'
const DEFAULT_LINE_COLOR = 'white'

interface CartoLayerOptions {
  id: string
  sql: string
  baseUrl: string
}

const getCartoLayergroupId = async (options: CartoLayerOptions) => {
  const { id, sql, baseUrl } = options
  const layerConfig = JSON.stringify({
    version: '1.3.0',
    stat_tag: 'API',
    layers: [{ id, options: { sql } }],
  })
  const url = `${baseUrl}?config=${encodeURIComponent(layerConfig)}`

  const response = await fetch(url).then((res) => {
    if (res.status >= 400) {
      throw new Error(`loading of layer failed ${id}`)
    }
    return res.json()
  })

  return response
}

class CartoPolygonsGenerator {
  type = Type.CartoPolygons
  tilesCacheByid: { [key: string]: any } = {}
  baseUrl: string

  constructor({ baseUrl = CARTO_FISHING_MAP_API }) {
    this.baseUrl = baseUrl
  }

  _getStyleSources = (layer: CartoPolygonsGeneratorConfig) => {
    const { id } = layer
    const layerData = (layersDirectory as any)[layer.id] || layer
    const response = {
      sources: [{ id: layer.id, ...layerData.source, tiles: [''] }],
    }

    try {
      if (this.tilesCacheByid[id] !== undefined) {
        response.sources[0].tiles = this.tilesCacheByid[id]
        return response
      }

      const promise = async () => {
        try {
          const { layergroupid } = await getCartoLayergroupId({
            id,
            baseUrl: layer.baseUrl || this.baseUrl,
            ...layerData.source,
          })
          const tiles = [`${CARTO_FISHING_MAP_API}/${layergroupid}/{z}/{x}/{y}.mvt`]
          this.tilesCacheByid[id] = tiles
          return this.getStyle(layer)
        } catch (e) {
          console.warn(e)
          return response
        }
      }
      return { ...response, promise: promise() }
    } catch (e) {
      console.warn(e)
      return response
    }
  }

  _getStyleLayers = (config: CartoPolygonsGeneratorConfig) => {
    const isSourceReady = this.tilesCacheByid[config.id] !== undefined

    const layerData = (layersDirectory as any)[config.id] || config
    const layers: any = layerData.layers.map((glLayer: any) => {
      if (!isSourceReady) return glLayer

      const visibility =
        config.visible !== undefined ? (config.visible ? 'visible' : 'none') : 'visible'
      const layout = glLayer.layout ? { ...glLayer.layout, visibility } : { visibility }
      const paint: any = {}
      const hasSelectedFeatures = config.selectedFeatures?.values?.length
      // TODO: make this dynamic
      if (glLayer.type === 'line') {
        paint['line-opacity'] = config.opacity !== undefined ? config.opacity : 1
        paint['line-color'] = config.color || DEFAULT_LINE_COLOR
      } else if (glLayer.type === 'fill') {
        paint['fill-opacity'] = config.opacity !== undefined ? config.opacity : 1
        const fillColor = config.fillColor || DEFAULT_LINE_COLOR

        if (hasSelectedFeatures) {
          const { field = 'id', values, fill = {} } = config.selectedFeatures
          const { color = fillColor, fillOutlineColor = config.color } = fill
          const matchFilter = ['match', ['get', field], values]
          paint[`fill-color`] = [...matchFilter, color, fillColor]
          paint[`fill-outline-color`] = [...matchFilter, fillOutlineColor, config.color]
        } else {
          paint[`fill-color`] = fillColor
          paint[`fill-outline-color`] = config.color || DEFAULT_LINE_COLOR
        }
      } else if (glLayer.type === 'circle') {
        const circleColor = config.color || '#99eeff'
        const circleOpacity = config.opacity || 1
        const circleStrokeColor = config.strokeColor || 'hsla(190, 100%, 45%, 0.5)'
        const circleStrokeWidth = config.strokeWidth || 2
        const circleRadius = config.radius || 5
        paint['circle-color'] = circleColor
        paint['circle-stroke-width'] = circleStrokeWidth
        paint['circle-radius'] = circleRadius
        paint['circle-stroke-color'] = circleStrokeColor
        if (hasSelectedFeatures) {
          const { field = 'id', values, fallback = {} } = config.selectedFeatures
          const {
            color = 'rgba(50, 139, 169, 0.3)',
            opacity = 1,
            strokeColor = 'rgba(0,0,0,0)',
            strokeWidth = 0,
          } = fallback
          const matchFilter = ['match', ['get', field], values]
          paint[`circle-color`] = [...matchFilter, circleColor, color]
          paint['circle-opacity'] = [...matchFilter, circleOpacity, opacity]
          paint['circle-stroke-color'] = [...matchFilter, circleStrokeColor, strokeColor]
          paint['circle-stroke-width'] = [...matchFilter, circleStrokeWidth, strokeWidth]
        }
      }

      return { ...glLayer, layout, paint }
    })

    const newLayers: any = []
    // workaround to use line type for better rendering (uses antialiasing) but allows to fill the layer too
    layers.forEach((layer: any) => {
      if (layer.type === 'line' && config.selectedFeatures?.values?.length) {
        const { field = 'id', values, fill = {} } = config.selectedFeatures
        const { color = DEFAULT_LINE_COLOR } = fill
        const matchFilter = ['match', ['get', field], values]
        const paint: any = {
          'fill-color': [...matchFilter, color, 'transparent'],
          'fill-outline-color': 'transparent',
        }
        const newLayer = {
          ...layer,
          id: `${layer.id}_selected_features`,
          type: 'fill',
          paint,
          layout: {},
        }
        newLayers.push(newLayer)
      }
    })
    return layers.concat(newLayers)
  }

  getStyle = (layer: CartoPolygonsGeneratorConfig): GeneratorStyles => {
    const { sources, promise } = this._getStyleSources(layer) as any
    return {
      id: layer.id,
      promise,
      sources: sources,
      layers: this._getStyleLayers(layer),
    }
  }
}

export default CartoPolygonsGenerator
