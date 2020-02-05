import { AnySourceImpl, Layer } from 'mapbox-gl'
import { ColorRamps } from 'layer-composer/generators/heatmap/heatmap'

export interface LayerComposerGl {
  id: string
  sources: [AnySourceImpl]
  layers: [Layer]
  promise?: Promise<LayerComposerGl>
  promises?: Promise<LayerComposerGl>[]
}

export interface LayerComposerGenerator {
  type: string
  getStyle: (layer: LayerComposerLayer) => LayerComposerGl
}

// TODO FIRST: DEFINE THIS
export interface LayerComposeStyles {
  style: any
  promises?: Promise<any>[]
}

export interface LayerComposerOptions {
  generators?: { [key: string]: LayerComposerGenerator }
  version?: number
  glyphs?: string
  sprite?: string
}

export interface LayerComposerLayer {
  id: string
  type: 'BACKGROUND' | 'BASEMAP' | 'CARTO_POLYGONS' | 'GL_STYLES' | 'HEATMAP' | string
  data?: any
  // TODO review this types
  baseUrl?: string
  source?: any
  sources?: any
  layers?: any
  selectedFeatures?: any
  // At least until here
  visible?: boolean
  opacity?: number
  color?: string
  attribution?: string
  // Include this types depending on layer type ?
  // Custom carto props
  fillColor?: string
  strokeColor?: string
  strokeWidth?: string
  radius?: string
  // Custom heatmap props
  start: string
  end: string
  zoom: number
  delta?: number
  tileset: string
  geomType: string
  singleFrame?: boolean
  fetchStats?: boolean
  serverSideFilter?: string
  updateColorRampOnTimeChange?: boolean
  quantizeOffset?: number
  colorRamp: ColorRamps
  colorRampMult: number
}
