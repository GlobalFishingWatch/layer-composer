import { AnySourceImpl, Layer } from 'mapbox-gl'
import { ColorRamps } from 'layer-composer/generators/heatmap/heatmap'

// TODO FIRST: DEFINE THIS
// This what is returned by LayerComposer.getGLStyle
export interface LayerComposerStyles {
  style: any
  promises?: Promise<any>[]
}

export interface LayerComposerOptions {
  generators?: { [key: string]: Generator }
  version?: number
  glyphs?: string
  sprite?: string
}

// This is what is returned by a <Generator>.getStyle
export interface GeneratorStyles {
  id: string
  sources: AnySourceImpl[]
  layers: Layer[]
  promise?: Promise<GeneratorStyles>
  promises?: Promise<GeneratorStyles>[]
}

export interface Generator {
  type: string
  getStyle: (layer: GeneratorConfig) => GeneratorStyles
}

export interface GeneratorConfig {
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
