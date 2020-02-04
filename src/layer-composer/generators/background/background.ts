import { LayerComposerLayer } from 'types/layer-composer'

export const BACKGROUND_TYPE = 'BACKGROUND'

class BackgroundGenerator {
  type = BACKGROUND_TYPE

  _getStyleLayers = (layer: LayerComposerLayer) => [
    {
      id: 'background',
      type: 'background',
      layout: {
        visibility: layer.visible !== undefined ? (layer.visible ? 'visible' : 'none') : 'visible',
      },
      paint: {
        'background-color': layer.color || '#001436',
      },
    },
  ]

  getStyle = (layer: LayerComposerLayer) => {
    return {
      id: layer.id,
      sources: [],
      layers: this._getStyleLayers(layer),
    }
  }
}

export default BackgroundGenerator
