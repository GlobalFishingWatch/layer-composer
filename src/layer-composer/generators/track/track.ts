import { GeneratorConfig } from 'layer-composer/types'
// TODO custom "augemented" GeoJSON type
// see https://github.com/yagajs/generic-geojson/blob/master/index.d.ts
import { FeatureCollection } from 'geojson'
import filterGeoJSONByTimerange from './filterGeoJSONByTimerange'

export const TRACK_TYPE = 'TRACK'

export interface TrackGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
  color?: string
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
      data: defaultGeoJSON,
    }
    if (!config.data) {
      return [source]
    }

    if (!config.start || !config.end) {
      source.data = config.data as FeatureCollection
      return [source]
    }

    const startMs = new Date(config.start).getTime()
    const endMs = new Date(config.end).getTime()

    const filteredData = filterGeoJSONByTimerange(config.data, startMs, endMs)
    // const filteredData = config.data
    source.data = filteredData
    return [source]
  }

  _getStyleLayers = (config: TrackGeneratorConfig) => {
    // const startMs = new Date((config as any).start).getTime()
    // const endMs = new Date((config as any).end).getTime()
    console.log(config)

    const defaultColor = config.color || 'hsl(100, 100%, 55%)'
    const filteredColor = 'rgba(0, 0, 0, 0)'

    const layer = {
      type: 'line',
      id: config.id,
      source: config.id,
      layout: {},
      paint: {
        'line-color': defaultColor,
        // [
        //   'case',
        //   [
        //     'all',
        //     ['>', ['get', 'ts'], startMs],
        //     ['<', ['get', 'ts'], endMs],
        //   ],
        //   defaultColor,
        //   filteredColor,
        // ],
      },
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
