import Generators from './generators'
import { flatObjectArrays, flatObjectToArray } from './utils'
import {
  LayerComposerGl,
  LayerComposerOptions,
  LayerComposerLayer,
  LayerComposeStyles,
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

  constructor(params?: LayerComposerOptions) {
    this.version = (params && params.version) || DEFAULT_CONFIG.version
    this.glyphs = (params && params.glyphs) || DEFAULT_CONFIG.glyphs
    this.sprite = (params && params.sprite) || DEFAULT_CONFIG.sprite
    this.generators = (params && params.generators) || Generators

    // Used to cache results and always return the latest style in promises
    this.latestGenerated = {}
  }

  // Sources dictionary for id and array of sources per layer
  _getGeneratedLayerSource = (layers: LayerComposerGl[]) => {
    return Object.fromEntries(
      layers
        .filter((layer) => layer.sources && layer.sources.length)
        .map((layer) => [layer.id, layer.sources])
    )
  }

  // Same here for layers
  _getGeneratedLayerLayers = (layers: LayerComposerGl[]) => {
    return Object.fromEntries(
      layers
        .filter((layer) => layer.layers && layer.layers.length)
        .map((layer) => [layer.id, layer.layers])
    )
  }

  // Uses generators to return the layer with sources and layers
  _getGeneratedLayer = (layer: LayerComposerLayer) => {
    if (!this.generators[layer.type]) {
      throw new Error(`There is no styleLayer generator loaded for the layer: ${layer}}`)
    }
    return this.generators[layer.type].getStyle(layer)
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
  getGLStyle = (layers: LayerComposerLayer[]): LayerComposeStyles => {
    if (!layers) {
      console.warn('No layers passed to layer manager')
      return { style: this._getStyleJson() }
    }

    let layersPromises: Promise<LayerComposerGl>[] = []
    const layersGenerated = layers.map((layer) => {
      const { promise, promises, ...rest } = this._getGeneratedLayer(layer)
      let layerPromises: Promise<LayerComposerGl>[] = []
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
