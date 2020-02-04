import { AnySourceImpl, Layer } from 'mapbox-gl'

export interface LayerComposerGenerator {
  type: string
  getStyle: (
    layer: LayerComposerLayer
  ) => {
    id: string
    sources: [AnySourceImpl]
    layers: [Layer]
  }
}

export interface LayerComposerOptions {
  generators: { [key: string]: LayerComposerGenerator }
  version: string
  glyphs: string
  sprites: string
}

export interface LayerComposerLayer {
  id: string
  type: 'BACKGROUND' | 'BASEMAP' | 'CARTO_POLYGONS' | 'GL_STYLES' | string
  data?: any
  visible?: boolean
  opacity?: number
  color?: string
  attribution?: string
}

export declare class LayerComposer {
  version?: any
}