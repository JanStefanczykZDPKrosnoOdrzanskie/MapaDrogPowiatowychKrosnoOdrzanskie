let ROAD_SIGNS_CACHE = {};

async function LOAD_ROAD_SIGNS(nr){
  if(ROAD_SIGNS_CACHE[nr]) return ROAD_SIGNS_CACHE[nr];

  try{
    const res = await fetch(`Ewidr/${nr}.csv`);
    if(!res.ok) return null;

    const text = await res.text();
    const parsed = PARSE_CSV(text);

    ROAD_SIGNS_CACHE[nr] = parsed;
    return parsed;

  }catch(e){
    console.error("CSV load error:", e);
    return null;
  }
}

function GET_POINT_ON_ROAD(feature, kmMeters, side){
  const km_s = feature.properties.km_s;
  const km_e = feature.properties.km_e;

  if(km_s == null || km_e == null) return null;

  const totalMeters = Math.abs(km_e - km_s);
  if(totalMeters === 0) return null;

  const line = turf.lineString(feature.geometry.coordinates);

  /*
    Odległość od początku geometrii.
    Początek geometrii odpowiada km_s.
  */
  const distFromStartMeters = Math.abs(kmMeters - km_s);

  const point = turf.along(
    line,
    distFromStartMeters / 1000,
    { units: "kilometers" }
  );

  if(!point) return null;

  /*
    Lokalny kierunek linii.
  */
  const delta = 1; // 1 metr
  const beforeDist = Math.max(0, distFromStartMeters - delta);
  const afterDist = Math.min(
    turf.length(line, { units: "kilometers" }) * 1000,
    distFromStartMeters + delta
  );

  const ptBefore = turf.along(line, beforeDist / 1000, {
    units: "kilometers"
  });

  const ptAfter = turf.along(line, afterDist / 1000, {
    units: "kilometers"
  });

  if(!ptBefore || !ptAfter) return point;

  const c1 = ptBefore.geometry.coordinates;
  const c2 = ptAfter.geometry.coordinates;

  let bearing = turf.bearing(
    turf.point(c1),
    turf.point(c2)
  );

  /*
    Jeżeli kilometraż maleje (km_e < km_s),
    to kierunek przyrostu kilometraża jest przeciwny
    do kierunku geometrii.
  */
  if(km_e < km_s){
    bearing += 180;
  }

  /*
    Strona względem kierunku przyrostu kilometraża.
  */
  let offsetMeters = 0;

  if(side === "prawa"){
    offsetMeters = 5;
  }else if(side === "lewa"){
    offsetMeters = -5;
  }

  /*
    Dodatnia wartość = prawa strona,
    ujemna wartość = lewa strona.
  */
  const shifted = turf.destination(
    point,
    Math.abs(offsetMeters) / 1000,
    bearing + (offsetMeters > 0 ? 90 : -90),
    { units: "kilometers" }
  );

  return shifted;
}

function INIT_ROAD_SIGNS_LAYER(map){

  if(map.getLayer("road-signs-icons-layer")){
    map.removeLayer("road-signs-icons-layer");
  }

  if(map.getLayer("road-signs-layer")){
    map.removeLayer("road-signs-layer");
  }

  if(map.getSource("road-signs")){
    map.removeSource("road-signs");
  }

  map.addSource("road-signs", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });

  /*
    Warstwa punktów referencyjnych.
  */
  map.addLayer({
    id: "road-signs-layer",
    type: "circle",
    source: "road-signs",
    paint: {
      "circle-radius": 5,
      "circle-color": "#ff0000",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#000000"
    }
  });

  /*
    Warstwa ikon znaków.
  */
  map.addLayer({
    id: "road-signs-icons-layer",
    type: "symbol",
    source: "road-signs",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-anchor": "center",
      "icon-offset": ["get", "iconOffset"],
      "icon-size": 1,
      "icon-allow-overlap": false,
      "icon-ignore-placement": false
    }
  });
}

async function ENSURE_SIGN_ICON(map, signCode){
  const iconId = signCode && signCode.trim()
    ? signCode.trim()
    : "PH";

  if(map.hasImage(iconId)) return iconId;

  const path = GET_SIGN_ICON_PATH(iconId);

  return new Promise(resolve => {
    map.loadImage(path, (error, image) => {
      if(error || !image){
        if(iconId !== "PH"){
          ENSURE_SIGN_ICON(map, "PH").then(() => resolve("PH"));
        }else{
          resolve(null);
        }
        return;
      }

      if(!map.hasImage(iconId)){
        map.addImage(iconId, image);
      }

      resolve(iconId);
    });
  });
}

function GET_SIGN_ICON_PATH(signCode){
  if(!signCode) return "Graphics/Znaki/PH.BMP";

  const code = signCode.trim();
  if(!code) return "Graphics/Znaki/PH.BMP";

  const group = code.charAt(0).toUpperCase();

  return `Graphics/Znaki/${group}/${code}.BMP`;
}

function GET_SIGN_PIXEL_OFFSET(feature, kmMeters, side, stackIndex = 0){
  // Punkt na osi drogi (bez przesunięcia)
  const roadPoint = GET_POINT_ON_ROAD(feature, kmMeters, null);

  // Punkt odsunięty o 5 m od drogi
  const signPoint = GET_POINT_ON_ROAD(feature, kmMeters, side);

  if(!roadPoint || !signPoint){
    return [0, -(30 + stackIndex * 30)];
  }

  const pRoad = map.project(roadPoint.geometry.coordinates);
  const pSign = map.project(signPoint.geometry.coordinates);

  let dx = pSign.x - pRoad.x;
  let dy = pSign.y - pRoad.y;

  const len = Math.sqrt(dx * dx + dy * dy);

  if(len === 0){
    return [0, -(30 + stackIndex * 30)];
  }

  // Wektor jednostkowy od drogi do znaku
  dx /= len;
  dy /= len;

  const baseOffset = 60;     // pierwsza ikona 30 px dalej
  const stackSpacing = 30;   // kolejne ikony co 30 px

  const distance = baseOffset + stackIndex * stackSpacing;

  return [
    dx * distance,
    dy * distance
  ];
}

async function RENDER_ROAD_SIGNS(map, feature, signs){

  const features = [];

  for(const s of signs){

    const km = PARSE_KM_TO_METERS(s.kilometraż);
    if(km == null) return;

    const point = GET_POINT_ON_ROAD(feature, km, s.strona);
    if(!point) return;

    const signColumns = [
      s["1 znak"],
      s["2 znak"],
      s["3 znak"],
      s["4 znak"]
    ];

    let hasAnyIcon = false;

    for(let index = 0; index < signColumns.length; index++){
      const signCode = signColumns[index];
      if(!signCode) continue;
    
      const iconId = await ENSURE_SIGN_ICON(map, signCode);
      if(!iconId) continue;
    
      hasAnyIcon = true;
    
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: point.geometry.coordinates
        },
        properties: {
          road: feature.properties?.nr,
          km: s.kilometraż,
          type: s["rodzaj zdarzenia"],
          side: s.strona,
          icon: iconId,
          iconOffset: GET_SIGN_PIXEL_OFFSET(
            feature,
            km,
            s.strona,
            index
          )
        }
      });
    }
    /*
      Jeżeli nie znaleziono żadnego znaku,
      użyj placeholdera.
    */
    if(!hasAnyIcon){
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: point.geometry.coordinates
        },
        properties: {
          road: feature.properties?.nr,
          km: s.kilometraż,
          type: s["rodzaj zdarzenia"],
          side: s.strona,
          icon: "Graphics/Znaki/PH.BMP",
          iconOffset: GET_SIGN_PIXEL_OFFSET(
            feature,
            km,
            s.strona,
            0
          )
        }
      });
    }

    /*
      Punkt referencyjny.
    */
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point.geometry.coordinates
      },
      properties: {
        road: feature.properties?.nr,
        km: s.kilometraż,
        type: s["rodzaj zdarzenia"],
        side: s.strona,
        icon: ""
      }
    });
  }

  const src = map.getSource("road-signs");
  if(src){
    src.setData({
      type: "FeatureCollection",
      features
    });
  }
}

async function SHOW_ROAD_SIGNS(map, feature){
  const nr = feature.properties?.nr;
  const signs = await LOAD_ROAD_SIGNS(nr);

  if(signs){
    RENDER_ROAD_SIGNS(map, feature, signs);
  }
}
