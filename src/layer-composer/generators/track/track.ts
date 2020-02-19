import { GeneratorConfig } from 'layer-composer/types'
// TODO custom "augemented" GeoJSON type
// see https://github.com/yagajs/generic-geojson/blob/master/index.d.ts
import { FeatureCollection } from 'geojson'

export const TRACK_TYPE = 'TRACK'

export interface TrackGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
  color?: string
}

class TrackGenerator {
  type = TRACK_TYPE

  _getStyleSources = (config: TrackGeneratorConfig) => {
    const source = {
      type: 'geojson',
      data: config.data || {
        type: 'FeatureCollection',
        features: [],
      },
    }
    return [{ id: config.id, ...source }]
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
