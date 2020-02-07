import { GeneratorConfig } from 'layer-composer/types'

export const BACKGROUND_TYPE = 'BACKGROUND'

interface BackgroundLayer {
  id: string
  type: 'background'
  layout: {
    visibility: 'visible' | 'none'
  }
  paint: {
    'background-color': string
  }
}

class BackgroundGenerator {
  type = BACKGROUND_TYPE

  _getStyleLayers = (layer: GeneratorConfig): BackgroundLayer[] => [
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

  getStyle = (layer: GeneratorConfig) => {
    return {
      id: layer.id,
      sources: [],
      layers: this._getStyleLayers(layer),
    }
  }
}

export default BackgroundGenerator
