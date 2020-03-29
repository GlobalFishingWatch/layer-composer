import { Type } from './types'
import BackgroundGenerator from './background/background'
import BaseMapGenerator from './basemap/basemap'
import GLStyleGenerator from './gl/gl'
import CartoGenerator, { CARTO_FISHING_MAP_API } from './carto-polygons/carto-polygons'
import HeatmapGenerator, { HEATMAP_GEOM_TYPES, HEATMAP_COLOR_RAMPS } from './heatmap/heatmap'
import TrackGenerator from './track/track'
import VesselEventsGenerator from './vessel-events/vessel-events'

export { HEATMAP_GEOM_TYPES, HEATMAP_COLOR_RAMPS }

export default {
  [Type.Background]: new BackgroundGenerator(),
  [Type.Basemap]: new BaseMapGenerator(),
  [Type.GL]: new GLStyleGenerator(),
  [Type.CartoPolygons]: new CartoGenerator({ baseUrl: CARTO_FISHING_MAP_API }),
  [Type.Heatmap]: new HeatmapGenerator({}),
  [Type.Track]: new TrackGenerator(),
  [Type.VesselEvents]: new VesselEventsGenerator(),
}
