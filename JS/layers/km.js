let KM_INTERMEDIATE_LOADED = false
function ADD_KM_LABELS(){
  if(map.getSource("km_labels_source")) return;
  const features = [];
  ZDP_ALL_FEATURES.forEach(f => {
    if(f.properties?.adm !== "P") return;
    const coords = f.geometry?.coordinates;
    if(!coords || coords.length < 2) return;
    const km_s = f.properties?.km_s;
    const km_e = f.properties?.km_e;
    // START
    if(km_s !== undefined){
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords[0]
        },
        properties: {
          km: km_s,
          type: "start"
        }
      });
    }
    // END
    if(km_e !== undefined){
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords[coords.length - 1]
        },
        properties: {
          km: km_e,
          type: "end"
        }
      });
    }
  });
  map.addSource("km_labels_source", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features
    }
  });
  map.addLayer({
    id: "km_labels",
    type: "symbol",
    source: "km_labels_source",
    layout: {
      "text-field": [
        "concat",
        ["to-string", ["floor", ["/", ["get", "km"], 1000]]],
        "+",
        ["case",
          ["<", ["to-number", ["%", ["get", "km"], 1000]], 10],
          ["concat", "00", ["to-string", ["to-number", ["%", ["get", "km"], 1000]]]],
          ["<", ["to-number", ["%", ["get", "km"], 1000]], 100],
          ["concat", "0", ["to-string", ["to-number", ["%", ["get", "km"], 1000]]]],
          ["to-string", ["to-number", ["%", ["get", "km"], 1000]]]
        ]
      ],
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 0.6],
      "visibility": "visible"
    },
    paint: {
      "text-color": "#A500AD",
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 2
    }
  });
}
function GENERATE_INTERMEDIATE_KM_LABELS(){
  const features = [];
  ZDP_ALL_FEATURES.forEach(f => {
    if(f.properties?.adm !== "P") return;
    const line = f.geometry;
    if(!line || line.type !== "LineString") return;
    const km_s = f.properties?.km_s;
    const km_e = f.properties?.km_e;
    if(km_s == null || km_e == null) return;
    const direction = km_e >= km_s ? 1 : -1;
    const length = turf.length(line, {units: "kilometers"});
    const startKm = Math.ceil(Math.min(km_s, km_e) / 100) * 100;
    const endKm   = Math.floor(Math.max(km_s, km_e) / 100) * 100;
    for(let km = startKm; km <= endKm; km += 100){
      const targetOffsetKm = Math.abs(km - km_s) / 1000;
      const t = targetOffsetKm / length;
      if(t < 0 || t > 1) continue;
      const pt = turf.along(line, t * length, {units:"kilometers"});
      const kmPart = Math.floor(km / 1000);
      const mPart = km % 1000;
      const label = `${kmPart}+${String(mPart).padStart(3, "0")}`;
      features.push({
        type:"Feature",
        geometry: pt.geometry,
        properties:{
          km: km,
          label: label
        }
      });
    }
  });
  if(map.getSource("km_intermediate_source")){
    map.getSource("km_intermediate_source").setData({
      type:"FeatureCollection",
      features
    });
    return;
  }
  map.addSource("km_intermediate_source",{
    type:"geojson",
    data:{
      type:"FeatureCollection",
      features
    }
  });
  map.addLayer({
    id:"km_intermediate_labels",
    type:"symbol",
    source:"km_intermediate_source",
    layout:{
      "text-field": ["get","label"],
      "text-size": 11,
      "text-anchor":"top",
      "text-offset":[0,0.5]
    },
    paint:{
      "text-color":"#111",
      "text-halo-color":"#fff",
      "text-halo-width":2
    }
  });
}
function LOAD_INTERMEDIATE_KM_LABELS(){
  if (KM_INTERMEDIATE_LOADED) return;
  KM_INTERMEDIATE_LOADED = true;
  GENERATE_INTERMEDIATE_KM_LABELS();
}
function UPDATE_KM_LABEL_VISIBILITY(){
  const z = map.getZoom();
  let step = null;
  if (z < 10) step = 10000;
  else if (z < 11) step = 5000;
  else if (z < 13) step = 2000;
  else if (z < 15) step = 1000;
  else if (z < 16) step = 500;
  else if (z < 17) step = 200;
  else step = 100;
  // filtr dla etykiet pośrednich
  if(map.getLayer("km_intermediate_labels")){
    map.setFilter("km_intermediate_labels", [
      "==",
      ["%", ["get","km"], step],
      0
    ]);
  }
  // skalowanie wielkości tekstu
  if(map.getLayer("km_intermediate_labels")){
    map.setLayoutProperty(
      "km_intermediate_labels",
      "text-size",
      z >= 15 ? 12 : 10
    );
  }
  // schowanie kilometrarzu początku/końca
  const kmToggle = document.getElementById("kmIntermediateToggle");
  // schowanie kilometrarzu początku/końca (zależne też od checkboxa)
  if(map.getLayer("km_labels")){
    map.setLayoutProperty(
      "km_labels",
      "visibility",
      (z >= 12 && kmToggle.checked) ? "visible" : "none"
    );
  }
}
function INIT_KM_MODULE(map){
  ADD_KM_LABELS();
  map.on("zoom", UPDATE_KM_LABEL_VISIBILITY);
  UPDATE_KM_LABEL_VISIBILITY();
  document.getElementById("kmIntermediateToggle")
    .addEventListener("change", (e) => {
      const visible = e.target.checked ? "visible" : "none";
      if (e.target.checked && !KM_INTERMEDIATE_LOADED) {
        LOAD_INTERMEDIATE_KM_LABELS();
      }
      if (map.getLayer("km_intermediate_labels")) {
        map.setLayoutProperty(
          "km_intermediate_labels",
          "visibility",
          visible
        );
      }
      if (map.getLayer("km_labels")) {
        map.setLayoutProperty(
          "km_labels",
          "visibility",
          visible
        );
      }
    });
}
