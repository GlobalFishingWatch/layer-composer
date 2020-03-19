import { GeneratorConfig } from 'layer-composer/types'
import { FeatureCollection, Point } from 'geojson'
import { GeoJSONSourceRaw } from 'mapbox-gl'
import { Dictionary } from 'types'
import { DEFAULT_LANDMASS_COLOR } from '../basemap/basemap-layers'

export const VESSEL_EVENTS_TYPE = 'VESSEL_EVENTS'

interface CurrentEvent {
  position: {
    lat: number
    lng: number
  }
}

export interface VesselEventsGeneratorConfig extends GeneratorConfig {
  data: FeatureCollection
  currentEvent?: CurrentEvent
}

class VesselsEventsGenerator {
  type = VESSEL_EVENTS_TYPE

  _setActiveEvent = (data: FeatureCollection, currentEvent: CurrentEvent): FeatureCollection => {
    const featureCollection = { ...data }
    featureCollection.features = featureCollection.features.map((feature) => {
      const newFeature = { ...feature }
      const geom = feature.geometry as Point
      const featureLng = geom.coordinates[0]
      const featureLat = geom.coordinates[1]
      newFeature.properties = newFeature.properties || {}
      newFeature.properties.active =
        currentEvent !== null &&
        featureLng === currentEvent.position.lng &&
        featureLat === currentEvent.position.lat
      return newFeature
    })
    featureCollection.features.sort((a, b) => {
      if (a.properties && a.properties.active) return 1
      else if (b.properties && b.properties.active) return -1
      else return 0
    })
    return featureCollection
  }

  _getStyleSources = (config: VesselEventsGeneratorConfig) => {
    const { id, data } = config

    if (!data) {
      // console.warn(`${VESSEL_EVENTS_TYPE} source generator needs geojson data`, config)
      return []
    }

    let newData: FeatureCollection = { ...data }
    if (config.currentEvent) {
      newData = this._setActiveEvent(newData, config.currentEvent)
    }

    if (config.start && config.end) {
      const startMs = new Date(config.start).getTime()
      const endMs = new Date(config.end).getTime()
      newData.features = newData.features.filter((feature) => {
        return (
          feature.properties &&
          feature.properties.timestamp > startMs &&
          feature.properties.timestamp < endMs
        )
      })
    }

    const source: GeoJSONSourceRaw = {
      type: 'geojson',
      data: newData,
    }
    return [{ id, ...source }]
  }

  _getStyleLayers = (config: VesselEventsGeneratorConfig) => {
    if (!config.data) {
      // console.warn(`${VESSEL_EVENTS_TYPE} source generator needs geojson data`, config)
      return []
    }

    const activeFilter = ['case', ['==', ['get', 'active'], true]]
    const layers: any[] = [
      {
        id: 'vessel_events_bg',
        type: 'circle',
        source: config.id,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': [...activeFilter, 'rgba(0, 193, 231, 1)', DEFAULT_LANDMASS_COLOR],
          'circle-radius': [...activeFilter, 12, 5],
        },
      },
      {
        id: 'vessel_events',
        source: config.id,
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

  getStyle = (config: VesselEventsGeneratorConfig) => {
    return {
      id: config.id,
      sources: this._getStyleSources(config),
      layers: this._getStyleLayers(config),
    }
  }
}

export default VesselsEventsGenerator

type AuthorizationOptions = 'authorized' | 'partially' | 'unmatched'

type RawEvent = {
  id: string
  type: string
  position: {
    lng?: number
    lon?: number
    lat: number
  }
  start: number
  encounter?: {
    authorized: boolean
    authorizationStatus: AuthorizationOptions
  }
}

const EVENTS_COLORS: Dictionary<string> = {
  encounter: '#FAE9A0',
  partially: '#F59E84',
  unmatched: '#CE2C54',
  loitering: '#cfa9f9',
  port: '#99EEFF',
}

const getEncounterAuthColor = (authorizationStatus: AuthorizationOptions) => {
  switch (authorizationStatus) {
    case 'authorized':
      return EVENTS_COLORS.encounter
    case 'partially':
      return EVENTS_COLORS.partially
    case 'unmatched':
      return EVENTS_COLORS.unmatched
    default:
      return ''
  }
}

export const getVesselEventsGeojson = (trackEvents: RawEvent[] | null): FeatureCollection => {
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  if (!trackEvents) return featureCollection

  featureCollection.features = trackEvents.map((event: RawEvent) => {
    const authorized = event.encounter && event.encounter.authorized === true
    const authorizationStatus = event.encounter
      ? event.encounter.authorizationStatus
      : ('unmatched' as AuthorizationOptions)

    const lng = event.position.lng || event.position.lon || 0
    return {
      type: 'Feature',
      properties: {
        type: event.type,
        timestamp: event.start,
        authorized,
        authorizationStatus,
        icon: `carrier_portal_${event.type}`,
        color:
          event.type === 'encounter'
            ? getEncounterAuthColor(authorizationStatus)
            : EVENTS_COLORS[event.type],
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, event.position.lat],
      },
    }
  })

  return featureCollection
}
