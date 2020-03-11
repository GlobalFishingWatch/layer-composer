import { GeneratorConfig } from 'layer-composer/types'
import { FeatureCollection } from 'geojson'
import { GeoJSONSourceRaw } from 'mapbox-gl'

export const VESSEL_EVENTS_TYPE = 'VESSEL_EVENTS'

export interface VesselEventsGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
}

const BASEMAP_COLOR = '#00265c'
const EVENTS_COLORS = {
  encounter: '#FAE9A0',
  partially: '#F59E84',
  unmatched: '#CE2C54',
  loitering: '#cfa9f9',
  port: '#99EEFF',
}

class VesselsEventsGenerator {
  type = VESSEL_EVENTS_TYPE

  _getStyleSources = (layer: VesselEventsGeneratorConfig) => {
    const { id, data } = layer

    if (!data) {
      console.warn(`${VESSEL_EVENTS_TYPE} source generator needs geojson data`, layer)
      return []
    }

    const source: GeoJSONSourceRaw = {
      type: 'geojson',
      data: data || null,
    }
    return [{ id, ...source }]
  }

  _getStyleLayers = (layer: VesselEventsGeneratorConfig) => {
    if (!layer.data) {
      console.warn(`${VESSEL_EVENTS_TYPE} source generator needs geojson data`, layer)
      return []
    }

    const activeFilter = ['case', ['==', ['get', 'active'], true]]
    const layers: any[] = [
      {
        id: 'vessel_events_bg',
        type: 'circle',
        source: layer.id,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': [...activeFilter, 'rgba(0, 193, 231, 1)', BASEMAP_COLOR],
          'circle-radius': [...activeFilter, 12, 5],
        },
      },
      {
        id: 'vessel_events',
        source: layer.id,
        type: 'symbol',
        layout: {
          'icon-allow-overlap': true,
          'icon-image': ['get', 'icon'],
          'icon-size': [...activeFilter, 1, 0],
        },
      },
    ]
    return layers
  }

  getStyle = (layer: VesselEventsGeneratorConfig) => {
    return {
      id: layer.id,
      sources: this._getStyleSources(layer),
      layers: this._getStyleLayers(layer),
    }
  }
}

export default VesselsEventsGenerator
