import { LayerComposerLayer } from 'types/layer-composer'

export const GL_TYPE = 'GL_STYLES'

class GlStyleGenerator {
  type = GL_TYPE

  _getStyleSources = (layer: LayerComposerLayer) => {
    return layer.sources.map((glSource: any) => ({ id: `${layer.id}`, ...glSource }))
  }

  _getStyleLayers = (layer: LayerComposerLayer) => {
    const layout = {
      visibility: layer.visible !== undefined ? (layer.visible ? 'visible' : 'none') : 'visible',
    }
    return layer.layers.map((glLayer: any, i: number) => ({
      id: `${layer.id}-${i}`,
      source: layer.id,
      ...glLayer,
      layout: {
        ...layout,
        ...glLayer.layout,
      },
    }))
  }

  getStyle = (layer: LayerComposerLayer) => {
    return {
      id: layer.id,
      // Auto generates sources and glLayers id using layer id when neccesary
      sources: this._getStyleSources(layer),
      layers: this._getStyleLayers(layer),
    }
  }
}

export default GlStyleGenerator
