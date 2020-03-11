import { Layer, AnySourceImpl } from 'mapbox-gl'
// This what is returned by LayerComposer.getGLStyle
export interface LayerComposerStyles {
  style: any
  promises?: Promise<any>[]
}

export interface LayerComposerOptions {
  generators?: { [key: string]: any }
  version?: number
  glyphs?: string
  sprite?: string
}

// This is what is returned by a <Generator>.getStyle
// TODO This is unusable as is because sources carry an id which is invalid
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
  type:
    | 'BACKGROUND'
    | 'BASEMAP'
    | 'CARTO_POLYGONS'
    | 'GL_STYLES'
    | 'HEATMAP'
    | 'TRACK'
    | 'VESSEL_EVENTS'
    | string
  visible?: boolean
  opacity?: number
  start?: string
  end?: string
}

export interface GlobalGeneratorConfig {
  start?: string
  end?: string
}
