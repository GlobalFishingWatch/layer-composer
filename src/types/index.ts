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

export enum Group {
  Background = 'background', // Solid bg color
  Basemap = 'basemap', // Satellite tiles
  Heatmap = 'heatmap', // Fill/gradient-based heatmaps
  BasemapFill = 'basemapFill', // Landmass
  OutlinePolygons = 'outlinePolygons', // Conbtext layers with an outlined/hollow style such as EEZ, RFMOs, etc
  Default = 'default', // Default stack position when f0roup is not specified
  Point = 'point', // Events, etc
  Track = 'track', // Tracks
  BasemapForeground = 'BasemapForeground', // Graticule labels, bathymetry labels, etc
  Label = 'label', // All non-basemap layers labels
  Overlay = 'overlay', // Popups, ruler tool, etc
}
