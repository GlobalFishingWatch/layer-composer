import layersDirectory from './basemap-layers'
import { LayerComposerLayer } from 'types/layer-composer'

export const BASEMAP_TYPE = 'BASEMAP'

class BasemapGenerator {
  type = BASEMAP_TYPE

  _getStyleSources = (layer: LayerComposerLayer) => {
    const { id, attribution } = layer
    const source = {
      ...layer.source,
      ...((layersDirectory as any)[id] && (layersDirectory as any)[id].source),
      ...(attribution && { attribution }),
    }
    return [{ id, ...source }]
  }
  _getStyleLayers = (layer: LayerComposerLayer) => {
    const layerData = (layersDirectory as any)[layer.id]
    return layerData !== undefined ? layerData.layers : []
  }

  getStyle = (layer: LayerComposerLayer) => {
    return {
      id: layer.id,
      sources: this._getStyleSources(layer),
      layers: this._getStyleLayers(layer),
    }
  }
}

export default BasemapGenerator
