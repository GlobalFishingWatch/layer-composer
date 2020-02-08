import LayerComposer from '../..'
import { TYPES } from '../'
import { validate as mapboxStyleValidator } from '@mapbox/mapbox-gl-style-spec'

test('check valid style.json format', async () => {
  const layerComposer = new LayerComposer()
  const { style } = layerComposer.getGLStyle([
    {
      type: TYPES.BASEMAP,
      id: 'satellite',
    },
    {
      type: TYPES.BACKGROUND,
      id: 'graticules',
    },
    {
      type: TYPES.BASEMAP,
      id: 'landmass',
    },
  ])
  const errors = mapboxStyleValidator(style)
  if (errors.length) {
    console.log('Errors found in style validation:', errors)
  }
  expect(errors.length).toBe(0)
})
