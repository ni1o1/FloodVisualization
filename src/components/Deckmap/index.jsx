/* global window */
import React, { useState, useEffect, useCallback } from 'react';
import { _MapContext as MapContext, StaticMap, NavigationControl, ScaleControl, FlyToInterpolator } from 'react-map-gl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import DeckGL from '@deck.gl/react';
import { useSubscribe, usePublish, useUnsubscribe } from '@/utils/usePubSub';
import { useInterval } from 'ahooks';
import { AmbientLight, LightingEffect, MapView, FirstPersonView, _SunLight as SunLight } from '@deck.gl/core';
import { BitmapLayer, IconLayer } from '@deck.gl/layers';
import { TileLayer, TerrainLayer } from '@deck.gl/geo-layers';
import { PolygonLayer } from '@deck.gl/layers';
import { Tile3DLayer } from '@deck.gl/geo-layers';
import { I3SLoader } from '@loaders.gl/i3s';
//redux
import { useDispatch, useMappedState } from 'redux-react-hook'
//镜头redux
import {
  setviewStates_tmp
} from '@/redux/actions/Visualcamera'


const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmkxbzEiLCJhIjoiY2t3ZDgzMmR5NDF4czJ1cm84Z3NqOGt3OSJ9.yOYP6pxDzXzhbHfyk3uORg';
const TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`;
const SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_ACCESS_TOKEN}`;
const ELEVATION_DECODER = {
  rScaler: 6553.6,
  gScaler: 25.6,
  bScaler: 0.1,
  offset: -10000
};

// Tileset entry point: Indexed 3D layer file url
const TILESET_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

export default function Deckmap() {
  const unsubscribe = useUnsubscribe();//清除更新组件重复订阅的副作用
  /*
    ---------------redux中取出变量---------------
  */
  //#region
  const mapState = useCallback(
    state => ({
      traj: state.traj,
      Visualcamera: state.Visualcamera
    }),
    []
  );
  const { Visualcamera, traj } = useMappedState(mapState);
  const { waterheight } = traj
  //dispatch
  const dispatch = useDispatch()
  //#endregion
  /*
  ---------------镜头设置与截图功能---------------
  */
  //#region
  const { fpvsize, viewStates } = Visualcamera
  const setViewStates = (data) => {
    dispatch(setviewStates_tmp(data))
  }

  //#endregion
  /*
  ---------------地图底图设置---------------
  */
  //#region
  //管理光强度
  const [lightintensity, setlightintensity] = useState(2)
  unsubscribe('lightintensity')
  useSubscribe('lightintensity', function (msg: any, data: any) {
    setlightintensity(data)
  });

  //管理光角度X
  const [lightx, setlightx] = useState(1554937300)
  unsubscribe('lightx')
  useSubscribe('lightx', function (msg: any, data: any) {
    setlightx(data)
  });

  //地图光效
  const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
  });


  const sunLight = new SunLight({
    timestamp: lightx,
    color: [255, 255, 255],
    intensity: lightintensity
  });
  const lightingEffect = new LightingEffect({ ambientLight, sunLight });

  const material = {
    ambient: 0.1,
    diffuse: 0.6,
    shininess: 22,
    specularColor: [60, 64, 70]
  };

  const theme = {
    buildingColor: [255, 255, 255],
    trailColor0: [253, 128, 93],
    trailColor1: [23, 184, 190],
    material,
    effects: [lightingEffect]
  };



  //默认地图底图
  const [mapStyle, setMapStyle] = React.useState('dark-v9');
  const publish = usePublish();

  //订阅地图样式
  unsubscribe('mapstyle')
  useSubscribe('mapstyle', function (msg: any, data: any) {
    setMapStyle(data)
  });


  useEffect(() => {
    //允许右键旋转视角
    document.getElementById("deckgl-wrapper").addEventListener("contextmenu", evt => evt.preventDefault());
    //转换至用户自定义中心点
    setViewStates({
      firstPerson: viewStates.firstPerson,
      baseMap: {
        ...viewStates.baseMap,
        longitude: -122.4,
        latitude: 37.78,
        zoom: 15,
        pitch: 45
      }
    })
  }, [])

  //第一人称底图
  const minimapBackgroundStyle = {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    height: '100%',
    background: '#aaa',
    boxShadow: '0 0 8px 2px rgba(0,0,0,0.15)'
  };
  //#endregion
  /*
  ---------------地图旋转按钮---------------
  */
  //#region
  //旋转的函数
  function rotate(pitch, bearing, duration) {
    setViewStates({
      firstPerson: viewStates.firstPerson
      ,
      baseMap: {
        ...viewStates.baseMap,
        pitch: pitch,
        bearing: bearing,
        transitionDuration: duration,
        transitionInterpolator: new FlyToInterpolator()
      }
    })
  }
  const [angle, setangle] = useState(120);
  const [interval, setInterval] = useState(undefined);
  useInterval(() => {
    rotate(viewStates.baseMap.pitch, angle, 2000)
    setangle(angle => angle + 10)
  }, interval, { immediate: true });
  //旋转的按钮
  function rotatecam() {

    setangle(viewStates.baseMap.bearing + 10)
    if (interval != 2000) {
      setInterval(2000)
    } else {
      setInterval(undefined)
      setViewStates(viewStates)
    }

  };
  //镜头旋转工具
  const [fristperson_isshow, setfristperson_isshow] = useState(false)
  const cameraTools = (
    <div className="mapboxgl-ctrl-group mapboxgl-ctrl">
      <button
        title="Rotatecam"
        onClick={rotatecam}
        style={{ opacity: interval == 2000 ? 1 : 0.2 }}
      > <span className="iconfont icon-camrotate" /></button>
      <button
        title="fristpersoncontrol"
        onClick={() => {
          setfristperson_isshow(!fristperson_isshow)
        }}
        style={{ opacity: fristperson_isshow ? 1 : 0.2 }}
      >
        <span className="iconfont icon-firstperson" /></button>
    </div>
  );

  //#endregion
  /*
  ---------------地形设置---------------
  */
  //#region



  //#endregion
  /*
  ---------------地图图层设置---------------
  */
  //#region

  const layers = [
    fristperson_isshow ? new IconLayer({//第一人称位置
      id: 'ref-point',
      data: [{
        color: [68, 142, 247],
        coords: [viewStates.baseMap.longitude, viewStates.baseMap.latitude,viewStates.firstPerson.position[2]]
      }],
      iconAtlas: 'images/firstperson.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 200, height: 200, mask: true }
      },
      sizeScale: 5,
      getIcon: d => 'marker',
      getPosition: d => [...d.coords, 0],
      getSize: d => 10,
      getColor: d => d.color
    }) : null,
    new TerrainLayer({
      id: 'terrain',
      minZoom: 0,
      maxZoom: 23,
      strategy: 'no-overlap',
      elevationDecoder: ELEVATION_DECODER,
      elevationData: TERRAIN_IMAGE,
      texture: SURFACE_IMAGE,
      wireframe: false,
      color: [255, 255, 255]
    }),
    new Tile3DLayer({
      id: 'tile-3d-layer',
      data: TILESET_URL,
      loader: I3SLoader
    }),
    new PolygonLayer({
      id: 'flood',
      data: [{
        coords: [[-122.2, 37.08, waterheight],
        [-122.2, 37.98, waterheight],
        [-122.7, 37.98, waterheight],
        [-122.7, 37.08, waterheight]]
      }],
      pickable: false,
      stroked: false,
      filled: true,
      wireframe: true,
      lineWidthMinPixels: 1,
      getPolygon: d => d.coords,
      opacity: 0.5,
      getFillColor: d => [139, 117, 0],
    })
  ];
  //#endregion
  /*
  ---------------渲染地图---------------
  */
  //#region
  const onViewStateChange = useCallback(({ viewId, viewState }) => {
    if (viewId === 'baseMap') {
      setViewStates({
        baseMap: viewState,
        firstPerson: {
          ...viewStates.firstPerson,
          longitude: viewState.longitude,
          latitude: viewState.latitude,
          bearing: viewState.bearing,
          zoom: viewState.zoom,
        }
      });
    } else {
      setViewStates({
        baseMap: {
          ...viewStates.baseMap,
          zoom: viewStates.baseMap.zoom,
          longitude: viewState.longitude,
          latitude: viewState.latitude,
          bearing: viewState.bearing,
        },
        firstPerson: { ...viewState, fovy: 75 }
      });
    }
  }, [viewStates]);
  return (
    <DeckGL
      layers={layers}
      viewState={viewStates}
      effects={theme.effects}
      controller={{ doubleClickZoom: false, inertia: true, touchRotate: true }}
      style={{ zIndex: 0 }}
      ContextProvider={MapContext.Provider}
      onViewStateChange={onViewStateChange}
    >
      <MapView id="baseMap"
        controller={true}
        y="0%"
        height="100%"
        position={
          [0, 0, 0]}>
        <StaticMap reuseMaps
          mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          preventStyleDiffing={true} >
          <div className='mapboxgl-ctrl-bottom-left' style={{ bottom: '20px' }}>
            <ScaleControl maxWidth={100} unit="metric" />
          </div>
        </StaticMap>
        <div className='mapboxgl-ctrl-bottom-right' style={{ bottom: '80px' }}>
          <NavigationControl onViewportChange={viewport => {

            setViewStates({
              baseMap: {
                ...viewStates.baseMap,
                longitude: viewport.longitude,
                latitude: viewport.latitude,
                bearing: viewport.bearing,
                zoom: viewport.zoom
              },
              firstPerson: viewStates.firstPerson
            })
          }} />
          {cameraTools}
        </div>
      </MapView>
      {fristperson_isshow && (<FirstPersonView id="firstPerson"
        controller={{ scrollZoom: false, dragRotate: true, inertia: true }}
        far={10000}
        focalDistance={1.5}
        x={(100 - fpvsize.width) + '%'}
        y={0}
        width={fpvsize.width + '%'}
        height={fpvsize.height + '%'}
        clear={true}>
        <div style={minimapBackgroundStyle} /> </FirstPersonView>)}
    </DeckGL>
  );
}
//#endregion