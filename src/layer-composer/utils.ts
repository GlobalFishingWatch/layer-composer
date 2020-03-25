import memoizeOne from 'memoize-one'
import { Dictionary } from 'layer-composer/types'

export const flatObjectArrays = (object = {} as any) => {
  let objectParsed: { [key: string]: any } = {}
  Object.keys(object).forEach((key) => {
    if (object[key] && object[key].length) {
      const arrayObject = Object.fromEntries(
        object[key].map((source: any) => {
          const { id, ...rest } = source
          return [id, rest]
        })
      )
      objectParsed = { ...objectParsed, ...arrayObject }
    } else {
      objectParsed[key] = object[key]
    }
  })
  return objectParsed
}

export const flatObjectToArray = (object = {}) =>
  Object.values(object).flatMap((layerGroup) => layerGroup)

export const memoizeCache: Dictionary<Dictionary<(...args: any[]) => any>> = {}
export const memoizeByLayerId = (id: string, ...functions: ((...args: any[]) => any)[]) => {
  if (memoizeCache[id] === undefined) {
    memoizeCache[id] = {}
  }
  functions.forEach((fun) => {
    if (!memoizeCache[id][fun.name]) {
      memoizeCache[id][fun.name] = memoizeOne(fun)
    }
  })
  return memoizeCache[id]
}
