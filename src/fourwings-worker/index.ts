/* eslint no-restricted-globals: "off" */

import vtpbf from 'vt-pbf'
import geojsonVt from 'geojson-vt'
import aggregate, { rawTileToIntArray } from './aggregate'

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const tilebelt = require('@mapbox/tilebelt')
import tilebelt from '@mapbox/tilebelt'

// TODO use different tsconfig to include worker types here
// it needs to include "workers" as lib but can't overlap with "dom"
declare const self: any

const FAST_TILES_KEY = '__fast_tiles__'
const FAST_TILES_KEY_RX = new RegExp(FAST_TILES_KEY)
const FAST_TILES_KEY_XYZ_RX = new RegExp(`${FAST_TILES_KEY}\\/(\\d+)\\/(\\d+)\\/(\\d+)`)
const CACHE_TIMESTAMP_HEADER_KEY = 'sw-cache-timestamp'
const CACHE_NAME = FAST_TILES_KEY
const CACHE_MAX_AGE_MS = 60 * 60 * 1000

const isoToDate = (iso: string) => {
  return new Date(iso).getTime()
}

const isoToDay = (iso: string) => {
  return isoToDate(iso) / 1000 / 60 / 60 / 24
}

const aggregateIntArray = (intArray: any, options: any) => {
  const { geomType, numCells, delta, x, y, z, quantizeOffset, singleFrameStart } = options
  const tileBBox = tilebelt.tileToBBOX([x, y, z])
  const aggregated = aggregate(intArray, {
    quantizeOffset,
    tileBBox,
    delta,
    geomType,
    numCells,
    singleFrameStart,
    // TODO make me configurable
    skipOddCells: false,
  })
  return aggregated
}

const decodeTile = (originalResponse: any, tileset: any) => {
  return originalResponse.arrayBuffer().then((buffer: any) => {
    const intArray = rawTileToIntArray(buffer, { tileset })
    return intArray
  })
}

const encodeTileResponse = (aggregatedGeoJSON: any, options: any) => {
  const { x, y, z, tileset } = options
  const tileindex = geojsonVt(aggregatedGeoJSON)
  const newTile = tileindex.getTile(z, x, y)
  const newBuff = vtpbf.fromGeojsonVt({ [tileset]: newTile })

  return new Response(newBuff)
}

self.addEventListener('install', () => {
  console.log('Install sw with skip waiting')
  self.skipWaiting()
})

self.addEventListener('activate', (event: any) => {
  console.log('Now ready to handle fetches?')

  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('Now ready to handle fetches!')
    })
  )
})

self.addEventListener('fetch', (fetchEvent: any) => {
  const originalUrl = fetchEvent.request.url

  if (FAST_TILES_KEY_RX.test(originalUrl) !== true) {
    return
  }

  const url = new URL(originalUrl)
  const tileset = url.searchParams.get('tileset')
  const geomType = url.searchParams.get('geomType')
  const fastTilesAPI = url.searchParams.get('fastTilesAPI')
  const quantizeOffset = parseInt(url.searchParams.get('quantizeOffset') || '0')
  const delta = parseInt(url.searchParams.get('delta') || '10')
  const singleFrame = url.searchParams.get('singleFrame') === 'true'
  const start = isoToDay(url.searchParams.get('start') || '')
  const serverSideFilters = url.searchParams.get('serverSideFilters')

  const [z, x, y] = (originalUrl as any)
    .match(FAST_TILES_KEY_XYZ_RX)
    .slice(1, 4)
    .map((d: string) => parseInt(d))

  const TILESET_NUM_CELLS = 64
  const aggregateParams = {
    geomType,
    numCells: TILESET_NUM_CELLS,
    delta,
    x,
    y,
    z,
    quantizeOffset,
    tileset,
    singleFrameStart: singleFrame ? start - quantizeOffset : null,
  }

  const finalUrl = new URL(`${fastTilesAPI}${tileset}/tile/heatmap/${z}/${x}/${y}`)

  if (serverSideFilters) {
    finalUrl.searchParams.set('filters', serverSideFilters)
  }
  const finalUrlStr = decodeURI(finalUrl.toString())
  // console.log('real tile zoom', z)
  const finalReq = new Request(finalUrlStr)

  const cachePromise = self.caches.match(finalReq).then((cacheResponse: any) => {
    const now = new Date().getTime()
    const cachedTimestamp =
      (cacheResponse && parseInt(cacheResponse.headers.get(CACHE_TIMESTAMP_HEADER_KEY) || '')) || 0
    // only get value from cache if it's recent enough
    const hasRecentCache = cacheResponse && now - cachedTimestamp < CACHE_MAX_AGE_MS
    if (hasRecentCache && cacheResponse) {
      return cacheResponse.arrayBuffer().then((ab: any) => {
        const intArray = new Uint16Array(ab)
        const aggregated = aggregateIntArray(intArray, aggregateParams)
        return encodeTileResponse(aggregated, aggregateParams)
      })
    } else {
      // console.log('too old, fetching again')
    }

    const fetchPromise = fetch(finalUrl as any)
    const decodePromise = fetchPromise.then((fetchResponse: any) => {
      if (!fetchResponse.ok) throw new Error()
      // Response needs to be cloned to m odify headers (used for cache expiration)
      // const responseToCache = fetchResponse.clone()
      const decoded = decodeTile(fetchResponse, tileset)
      return decoded
    })

    // Cache fetch response in parallel
    decodePromise.then((intArray: any) => {
      const headers = new Headers()
      const timestamp = new Date().getTime()
      // add extra header to set a timestamp on cache - will be read at cache.matches call
      headers.set(CACHE_TIMESTAMP_HEADER_KEY, timestamp as any)
      // convert response to decoded int arrays
      const blob = new Blob([intArray], { type: 'application/octet-binary' })

      const cacheResponse = new Response(blob, {
        // status: fetchResponse.status,
        // statusText: fetchResponse.statusText,
        headers,
      })
      self.caches.open(CACHE_NAME).then((cache: any) => {
        cache.put(finalReq, cacheResponse)
      })
    })

    // then, aggregate
    const aggregatePromise = decodePromise.then((intArray: any) => {
      const aggregated = aggregateIntArray(intArray, aggregateParams)
      return encodeTileResponse(aggregated, aggregateParams)
    })
    return aggregatePromise
  })

  fetchEvent.respondWith(cachePromise)
})
