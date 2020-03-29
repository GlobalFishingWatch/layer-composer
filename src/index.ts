export { LayerComposerStyles, LayerComposerOptions, GeneratorStyles } from './layer-composer/types'
export { Type, Generator, GeneratorConfig } from './layer-composer/generators/types'

export { default, DEFAULT_CONFIG } from './layer-composer'

export {
  default as defaultGenerators,
  HEATMAP_GEOM_TYPES,
  HEATMAP_COLOR_RAMPS,
} from './layer-composer/generators'

export { default as sort, convertLegacyGroups } from './sort'
