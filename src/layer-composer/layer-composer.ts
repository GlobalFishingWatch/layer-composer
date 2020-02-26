import Generators from './generators'
import { flatObjectArrays, flatObjectToArray } from './utils'
import {
  LayerComposerStyles,
  LayerComposerOptions,
  GeneratorStyles,
  GeneratorConfig,
  GlobalGeneratorConfig,
} from './types'

export const DEFAULT_CONFIG = {
  version: 8,
  glyphs:
    'https://raw.githubusercontent.com/GlobalFishingWatch/map-gl-glyphs/master/_output/{fontstack}/{range}.pbf?raw=true',
  sprite: 'https://raw.githubusercontent.com/GlobalFishingWatch/map-gl-sprites/master/out/sprites',
}

class LayerComposer {
  version: number
  glyphs: string
  sprite: string
  generators: { [key: string]: any }
  latestGenerated: any
  globalGeneratorConfig: GlobalGeneratorConfig

  constructor(params?: LayerComposerOptions) {
    this.version = (params && params.version) || DEFAULT_CONFIG.version
    this.glyphs = (params && params.glyphs) || DEFAULT_CONFIG.glyphs
    this.sprite = (params && params.sprite) || DEFAULT_CONFIG.sprite
    this.generators = (params && params.generators) || Generators

    // Used to cache results and always return the latest style in promises
    this.latestGenerated = {}

    this.globalGeneratorConfig = {}
  }

  // Sources dictionary for id and array of sources per layer
  _getGeneratedLayerSource = (layers: GeneratorStyles[]) => {
    return Object.fromEntries(
      layers
        .filter((layer) => layer.sources && layer.sources.length)
        .map((layer) => [layer.id, layer.sources])
    )
  }

  // Same here for layers
  _getGeneratedLayerLayers = (layers: GeneratorStyles[]) => {
    return Object.fromEntries(
      layers
        .filter((layer) => layer.layers && layer.layers.length)
        .map((layer) => [layer.id, layer.layers])
    )
  }

  _applyGenericStyle = (generatorConfig: GeneratorConfig, generatorStyles: GeneratorStyles) => {
    const newGeneratorStyles = { ...generatorStyles }
    newGeneratorStyles.layers = newGeneratorStyles.layers.map((layer) => {
      const newLayer = { ...layer }
      if (generatorConfig.visible !== undefined && generatorConfig.visible !== null) {
        if (!newLayer.layout) {
          newLayer.layout = {}
        }
        newLayer.layout.visibility = generatorConfig.visible === true ? 'visible' : 'none'
      }
      return newLayer
    })
    return newGeneratorStyles
  }

  // Uses generators to return the layer with sources and layers
  _getGeneratedLayer = (layer: GeneratorConfig) => {
    if (!this.generators[layer.type]) {
      throw new Error(`There is no generator loaded for the layer: ${layer}}`)
    }
    const generator = this.generators[layer.type]
    const generatorStyles = this._applyGenericStyle(layer, generator.getStyle(layer))
    return generatorStyles
  }

  // Latest step in the workflow which compose the output needed for mapbox-gl
  _getStyleJson(sources = {}, layers = {}) {
    return {
      version: this.version,
      glyphs: this.glyphs,
      sprite: this.sprite,
      sources: flatObjectArrays(sources),
      layers: flatObjectToArray(layers),
    }
  }

  // Main mathod of the library which uses the privates one to compose the style
  getGLStyle = (
    layers: GeneratorConfig[],
    globalGeneratorConfig: GlobalGeneratorConfig = {}
  ): LayerComposerStyles => {
    if (!layers) {
      console.warn('No layers passed to layer manager')
      return { style: this._getStyleJson() }
    }

    this.globalGeneratorConfig = globalGeneratorConfig

    let layersPromises: Promise<GeneratorStyles>[] = []
    const layersGenerated = layers.map((layer) => {
      const { promise, promises, ...rest } = this._getGeneratedLayer(layer)
      let layerPromises: Promise<GeneratorStyles>[] = []
      if (promise) {
        layerPromises = [promise]
      } else if (promises) {
        layerPromises = promises
      }
      layersPromises = layersPromises.concat(layerPromises)
      return rest
    })

    const sourcesStyle = this._getGeneratedLayerSource(layersGenerated)
    const layersStyle = this._getGeneratedLayerLayers(layersGenerated)

    this.latestGenerated = { sourcesStyle, layersStyle }

    const promises = layersPromises.map((promise) => {
      return promise.then((layer) => {
        const { id, sources, layers } = layer
        const { sourcesStyle, layersStyle } = this.latestGenerated
        // Mutating the reference to keep the layers order
        sourcesStyle[id] = sources
        layersStyle[id] = layers
        return { style: this._getStyleJson(sourcesStyle, layersStyle), layer }
      })
    })

    return { style: this._getStyleJson(sourcesStyle, layersStyle), promises }
  }
}

export default LayerComposer
