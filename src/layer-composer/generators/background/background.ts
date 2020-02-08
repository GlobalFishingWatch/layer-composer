import { BackgroundPaint, BackgroundLayout } from 'mapbox-gl'
import { ExtendedLayer, Group } from '../../../types'
import { GeneratorConfig } from 'layer-composer/types'

export const BACKGROUND_TYPE = 'BACKGROUND'

interface BackgroundLayer extends ExtendedLayer {
  type: 'background'
  layout: BackgroundLayout
  paint: BackgroundPaint
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
      metadata: {
        group: Group.Background,
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
