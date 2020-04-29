/* eslint-disable @typescript-eslint/camelcase */

import { Group } from '../../types'

export default {
  cp_rfmo: {
    source: {
      sql: 'SELECT the_geom, the_geom_webmercator, cartodb_id, id FROM carrier_portal_rfmo_hi_res',
      type: 'vector',
    },
    layers: [
      {
        id: 'cp_rfmo',
        type: 'line',
        source: 'cp_rfmo',
        'source-layer': 'cp_rfmo',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        metadata: {
          group: Group.OutlinePolygons,
        },
      },
    ],
  },
  sprfmo: {
    source: {
      sql: 'SELECT the_geom, the_geom_webmercator, cartodb_id as id FROM sprfmo',
      type: 'vector',
    },
    layers: [
      {
        id: 'sprfmo',
        type: 'line',
        source: 'sprfmo',
        'source-layer': 'sprfmo',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        metadata: {
          group: Group.OutlinePolygons,
        },
      },
    ],
  },
  mpant: {
    source: {
      sql: 'select * FROM wdpa_no_take_mpas',
      type: 'vector',
      attribution: 'MPA: Protected Planet WDPA',
    },
    layers: [
      {
        id: 'mpant',
        type: 'line',
        source: 'mpant',
        'source-layer': 'mpant',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        metadata: {
          group: Group.OutlinePolygons,
        },
      },
    ],
  },
  eez: {
    source: {
      sql:
        'SELECT cartodb_id, CAST (mrgid AS TEXT) as id, the_geom, the_geom_webmercator FROM eez_land_v3_202030',
      type: 'vector',
      attribution: 'EEZs: marineregions.org',
    },
    layers: [
      {
        id: 'eez',
        type: 'line',
        source: 'eez',
        'source-layer': 'eez',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        metadata: {
          group: Group.OutlinePolygonsBackground,
        },
      },
    ],
  },
  bluefin_rfmo: {
    source: {
      sql: 'SELECT the_geom, the_geom_webmercator, cartodb_id FROM bluefin_rfmo',
      type: 'vector',
    },
    layers: [
      {
        id: 'bluefin_rfmo',
        type: 'line',
        source: 'bluefin_rfmo',
        'source-layer': 'bluefin_rfmo',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        metadata: {
          group: Group.OutlinePolygons,
        },
      },
    ],
  },
}
