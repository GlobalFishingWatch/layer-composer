#!/usr/bin/env bash

rm -rf scripts/data/tiles-basemap

rm scripts/data/landmass.mbtiles

tippecanoe --minimum-zoom=0 --maximum-zoom=8 -o scripts/data/landmass.mbtiles --drop-densest-as-needed scripts/data/landmass.json

mb-util --image_format=pbf scripts/data/landmass.mbtiles scripts/data/tiles-basemap --silent


rm scripts/data/graticules.mbtiles

tippecanoe --minimum-zoom=0 --maximum-zoom=8 -o scripts/data/graticules.mbtiles --drop-densest-as-needed scripts/data/graticules.json

mb-util --image_format=pbf scripts/data/graticules.mbtiles scripts/data/tiles-graticules --silent

tile-join -o scripts/data/basemap.mbtiles scripts/data/graticules.mbtiles scripts/data/landmass.mbtiles

mb-util --image_format=pbf scripts/data/basemap.mbtiles scripts/data/tiles-basemap --silent
