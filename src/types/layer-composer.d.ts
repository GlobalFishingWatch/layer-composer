import { AnySourceImpl, Layer } from 'mapbox-gl'

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

export interface LayerComposerOptions {
  generators?: { [key: string]: LayerComposerGenerator }
  version?: number
  glyphs?: string
  sprite?: string
}

export interface LayerComposerLayer {
  id: string
  type: 'BACKGROUND' | 'BASEMAP' | 'CARTO_POLYGONS' | 'GL_STYLES' | string
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
  // Include this types depending on layer typ ?
  fillColor?: string
  strokeColor: string
  strokeWidth: string
  radius: string
}
