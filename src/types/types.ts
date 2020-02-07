import { Group } from '../sort/types'
import { Style, Layer } from 'mapbox-gl'

export interface Dictionary<T> {
  [key: string]: T
}

export interface ExtendedLayerMeta {
  group?: Group
}

export interface ExtendedLayer extends Layer {
  metadata?: ExtendedLayerMeta
}

export interface ExtendedStyle extends Style {
  layers?: ExtendedLayer[]
}
