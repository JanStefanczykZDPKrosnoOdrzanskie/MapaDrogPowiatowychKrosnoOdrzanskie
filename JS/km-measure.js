let CURRENT_KM_MARKER = null;
let KM_MEASURE_ENABLED = false;
let ROAD_SIGNS_CACHE = {};

function INIT_KM_TOGGLE(){
  const btn = document.getElementById("kmToggle");

  function updateUI(){
    btn.innerText = KM_MEASURE_ENABLED ? "KM: ON" : "KM: OFF";
    btn.style.background = KM_MEASURE_ENABLED ? "#2c3e50" : "white";
    btn.style.color = KM_MEASURE_ENABLED ? "white" : "black";
  }

  btn.addEventListener("click", () => {
    KM_MEASURE_ENABLED = !KM_MEASURE_ENABLED;

    if(!KM_MEASURE_ENABLED){
      if(CURRENT_KM_MARKER){
        CURRENT_KM_MARKER.remove();
        CURRENT_KM_MARKER = null;
      }
    }

    updateUI();
  });

  updateUI();
}

function PARSE_KM_TO_METERS(kmText){
  if(!kmText) return null;

  const parts = kmText.split("+");
  if(parts.length !== 2) return null;

  const km = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if(isNaN(km) || isNaN(m)) return null;

  return km * 1000 + m;
}

function PARSE_CSV(text){
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const cols = line.split(",");

    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (cols[i] ?? "").trim());

    return obj;
  });
}

async function LOAD_ROAD_SIGNS(nr){
  if(ROAD_SIGNS_CACHE[nr]) return ROAD_SIGNS_CACHE[nr];

  try{
    const res = await fetch(`Ewid/${nr}.csv`);
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

function INIT_KM_MEASURE(){
  map.on("click", async (e) => {
    if(!KM_MEASURE_ENABLED) return;

    const MAX_CLICK_DISTANCE_PX = 20;
    const clickPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);

    let closestFeature = null;
    let closestPoint = null;
    let minDist = Infinity;

    ZDP_ALL_FEATURES.forEach(f => {
      if(f.properties?.adm !== "P") return;
      if(!f.geometry) return;

      try{
        const snapped = turf.nearestPointOnLine(f.geometry, clickPoint, {
          units: "kilometers"
        });

        const snappedLngLat = snapped.geometry.coordinates;
        const clickPixel = map.project([e.lngLat.lng, e.lngLat.lat]);
        const snappedPixel = map.project(snappedLngLat);

        const dx = clickPixel.x - snappedPixel.x;
        const dy = clickPixel.y - snappedPixel.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        if(distPx > MAX_CLICK_DISTANCE_PX) return;

        if(distPx < minDist){
          minDist = distPx;
          closestFeature = f;
          closestPoint = snapped;
        }
      }catch(e){}
    });

    if(!closestFeature || !closestPoint) return;

    const km_s = closestFeature.properties?.km_s;
    const km_e = closestFeature.properties?.km_e;

    if(km_s == null || km_e == null) return;

    if(CURRENT_KM_MARKER){
      CURRENT_KM_MARKER.remove();
      CURRENT_KM_MARKER = null;
    }

    CURRENT_KM_MARKER = new maplibregl.Marker({
      color: "#ff0000"
    })
      .setLngLat(closestPoint.geometry.coordinates)
      .addTo(map);

    const distFromStart = turf.length(
      turf.lineSlice(
        turf.point(closestFeature.geometry.coordinates[0]),
        closestPoint,
        closestFeature.geometry
      ),
      { units: "kilometers" }
    );

    const direction = km_e >= km_s ? 1 : -1;
    const kmValue = km_s + (distFromStart * 1000 * direction);
    const kmInt = Math.floor(kmValue / 1000);
    const m = Math.round(kmValue % 1000);

    const nr = closestFeature.properties?.nr;
    await LOAD_ROAD_SIGNS(nr);
    const startKm = Math.min(km_s, km_e);
    const endKm = Math.max(km_s, km_e);

    const formatKm = (v) => {
      const kmPart = Math.floor(v / 1000);
      const mPart = v % 1000;
      return `${kmPart}+${String(mPart).padStart(3, "0")}`;
    };

    const lengthKm = Math.abs(km_e - km_s) / 1000;

    const klFeature  = GET_NEAREST_FEATURE_BY_PROP(clickPoint, "kl");
    const nawFeature = GET_NEAREST_FEATURE_BY_PROP(clickPoint, "naw");
    const zudFeature = GET_NEAREST_FEATURE_BY_PROP(clickPoint, "ZUD");

    const klRaw  = klFeature?.properties?.kl;
    const nawRaw = nawFeature?.properties?.naw;
    const zudRaw = zudFeature?.properties?.ZUD;

    const klValue  = KL_DICT[klRaw] ?? klRaw ?? "-";
    const nawValue = NAW_DICT[nawRaw] ?? nawRaw ?? "-";
    const zudValue = ZUD_DICT[zudRaw] ?? zudRaw ?? "-";

    UPDATE_BOTTOM_PANEL_BASIC({
      roadNr: nr,
      kmText: `${kmInt}+${String(m).padStart(3, "0")}`,
      geometryHtml: `
        <b>Początek:</b> ${formatKm(startKm)}<br>
        <b>Koniec:</b> ${formatKm(endKm)}<br>
        <b>Długość:</b> ${lengthKm.toFixed(3)} km
      `,
      paramsHtml: `
        <b>Klasa drogi:</b> ${klValue}<br>
        <b>Nawierzchnia:</b> ${nawValue}<br>
        <b>ZUD:</b> ${zudValue}<br>
      `
    });

    const prFeature = GET_NEAREST_PR(clickPoint, nr);
    PR_LAST_ROW = null;

    if(!prFeature){
      UPDATE_BOTTOM_PANEL_PR_EMPTY();
      return;
    }

    const prId = prFeature.properties.PR;
    const row = PR_CSV_DATA[prId];

    await LOAD_PR_CSV(prId);
    PR_LAST_ROW = row;

    if(!row){
      UPDATE_BOTTOM_PANEL_PR_EMPTY();
      return;
    }

    let sum = 0;

    Object.keys(PR_SELECTED_TYPES).forEach(type => {
      if(PR_SELECTED_TYPES[type] && row[type] != null){
        sum += row[type];
      }
    });

    if(sum === 0){
      UPDATE_BOTTOM_PANEL_PR_EMPTY();
      return;
    }

    UPDATE_BOTTOM_PANEL_PR(sum);
    RENDER_PR_CHART();
  });
}

function GET_NEAREST_FEATURE_BY_PROP(point, propName){
  const MAX_DISTANCE_PX = 20;
  let closest = null;
  let minDist = Infinity;

  ZDP_ALL_FEATURES.forEach(f => {
    if(!f.geometry) return;
    if(f.properties?.[propName] == null) return;

    try{
      const snapped = turf.nearestPointOnLine(f.geometry, point, {
        units:"kilometers"
      });

      const snappedLngLat = snapped.geometry.coordinates;
      const clickPixel = map.project(point.geometry.coordinates);
      const snappedPixel = map.project(snappedLngLat);

      const dx = clickPixel.x - snappedPixel.x;
      const dy = clickPixel.y - snappedPixel.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      if(distPx > MAX_DISTANCE_PX) return;

      if(distPx < minDist){
        minDist = distPx;
        closest = f;
      }
    }catch(e){}
  });

  return closest;
}

function GET_NEAREST_PR(point, roadNr){
  const MAX_DISTANCE_PX = 20;
  let closest = null;
  let minDist = Infinity;

  ZDP_ALL_FEATURES.forEach(f => {
    if(!f.geometry) return;
    if(!f.properties?.PR) return;

    try{
      const snapped = turf.nearestPointOnLine(f.geometry, point, {
        units:"kilometers"
      });

      const snappedLngLat = snapped.geometry.coordinates;
      const clickPixel = map.project(point.geometry.coordinates);
      const snappedPixel = map.project(snappedLngLat);

      const dx = clickPixel.x - snappedPixel.x;
      const dy = clickPixel.y - snappedPixel.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      if(distPx > MAX_DISTANCE_PX) return;

      if(distPx < minDist){
        minDist = distPx;
        closest = f;
      }
    }catch(e){}
  });

  if(!closest) return null;
  if(closest.properties?.nr !== roadNr) return null;

  return closest;
}

function GET_POINT_ON_ROAD(feature, kmMeters){
  const km_s = feature.properties.km_s;
  const km_e = feature.properties.km_e;

  const start = Math.min(km_s, km_e);
  const end = Math.max(km_s, km_e);

  const t = (kmMeters - start) / (end - start);

  const line = turf.lineString(feature.geometry.coordinates);

  const point = turf.along(line, t * (end - start) / 1000, {
    units: "kilometers"
  });

  return point;
}

function INIT_ROAD_SIGNS_LAYER(map){

  if(map.getSource("road-signs")){
    map.removeLayer("road-signs-layer");
    map.removeSource("road-signs");
  }

  map.addSource("road-signs", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });

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
}
