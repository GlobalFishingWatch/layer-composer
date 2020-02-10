export {
  LayerComposerStyles,
  LayerComposerOptions,
  GeneratorStyles,
  Generator,
  GeneratorConfig,
} from './layer-composer/types'

export { default, DEFAULT_CONFIG } from './layer-composer'

export {
  default as defaultGenerators,
  TYPES,
  HEATMAP_GEOM_TYPES,
  HEATMAP_COLOR_RAMPS,
} from './layer-composer/generators'

export { default as sort, convertLegacyGroups } from './sort'
