import { Layer } from 'mapbox-gl'
import { Group } from '../../types'
import { Type, BackgroundGeneratorConfig } from '../types'

class BackgroundGenerator {
  type = Type.Background

  _getStyleLayers = (layer: BackgroundGeneratorConfig): Layer[] => [
    {
      id: 'background',
      type: 'background',
      layout: {
        visibility: layer.visible !== undefined ? (layer.visible ? 'visible' : 'none') : 'visible',
      },
      paint: {
        'background-color': layer.color || '#0A1738',
      },
      metadata: {
        group: Group.Background,
      },
    },
  ]

  getStyle = (layer: BackgroundGeneratorConfig) => {
    return {
      id: layer.id,
      sources: [],
      layers: this._getStyleLayers(layer),
    }
  }
}

export default BackgroundGenerator
