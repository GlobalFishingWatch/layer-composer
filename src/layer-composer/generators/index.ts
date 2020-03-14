import BackgroundGenerator, { BACKGROUND_TYPE as BACKGROUND } from './background/background'
import BaseMapGenerator, { BASEMAP_TYPE as BASEMAP } from './basemap/basemap'
import GLStyleGenerator, { GL_TYPE as GL } from './gl/gl'
import CartoGenerator, {
  CARTO_POLYGONS_TYPE as CARTO_POLYGONS,
  CARTO_FISHING_MAP_API,
} from './carto-polygons/carto-polygons'
import HeatmapGenerator, {
  HEATMAP_TYPE as HEATMAP,
  HEATMAP_GEOM_TYPES,
  HEATMAP_COLOR_RAMPS,
} from './heatmap/heatmap'
import TrackGenerator, { TRACK_TYPE as TRACK } from './track/track'
import { simplifyTrack } from './track/simplify-track'
import VesselEventsGenerator, {
  VESSEL_EVENTS_TYPE as VESSEL_EVENTS,
  getVesselEventsGeojson,
} from './vessel-events/vessel-events'

const TYPES = { BASEMAP, CARTO_POLYGONS, BACKGROUND, GL, HEATMAP, TRACK, VESSEL_EVENTS }
export { TYPES }

export { HEATMAP_GEOM_TYPES, HEATMAP_COLOR_RAMPS }

export { getVesselEventsGeojson }
export { simplifyTrack }

export default {
  [BACKGROUND]: new BackgroundGenerator(),
  [BASEMAP]: new BaseMapGenerator(),
  [GL]: new GLStyleGenerator(),
  [CARTO_POLYGONS]: new CartoGenerator({ baseUrl: CARTO_FISHING_MAP_API }),
  [HEATMAP]: new HeatmapGenerator({}),
  [TRACK]: new TrackGenerator(),
  [VESSEL_EVENTS]: new VesselEventsGenerator(),
}
