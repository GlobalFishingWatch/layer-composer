import layersDirectory from './basemap-layers'
import { GeneratorConfig } from 'layer-composer/types'

export const BASEMAP_TYPE = 'BASEMAP'

class BasemapGenerator {
  type = BASEMAP_TYPE

  _getStyleSources = (layer: GeneratorConfig) => {
    const { id, attribution } = layer
    const source = {
      ...layer.source,
      ...((layersDirectory as any)[id] && (layersDirectory as any)[id].source),
      ...(attribution && { attribution }),
    }
    return [{ id, ...source }]
  }
  _getStyleLayers = (layer: GeneratorConfig) => {
    const layerData = (layersDirectory as any)[layer.id]
    return layerData !== undefined ? layerData.layers : []
  }

  getStyle = (layer: GeneratorConfig) => {
    return {
      id: layer.id,
      sources: this._getStyleSources(layer),
      layers: this._getStyleLayers(layer),
    }
  }
}

export default BasemapGenerator
