import { GeneratorConfig, GeneratorStyles } from 'layer-composer/types'
import { layers, sources } from './basemap-layers'

export const BASEMAP_TYPE = 'BASEMAP'

// export interface BasemapGeneratorConfig extends GeneratorConfig {
//   basemapType?: string
// }

class BasemapGenerator {
  type = BASEMAP_TYPE

  _getStyleSources = (config: GeneratorConfig) => {
    const layer = layers[config.id]
    const sourceId = layer.source as string
    const source = sources[sourceId]
    return [{ id: sourceId, ...source }]
  }
  _getStyleLayers = (config: GeneratorConfig) => {
    const layer = layers[config.id]
    return [layer]
  }

  getStyle = (config: GeneratorConfig) => {
    return {
      id: config.id,
      sources: this._getStyleSources(config),
      layers: this._getStyleLayers(config),
    }
  }
}

export default BasemapGenerator
