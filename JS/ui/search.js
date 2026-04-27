/* ===============================
SEARCH FUNCTIONALITY
=============================== */
function INIT_SEARCH(){
  const btn = document.getElementById("searchButton");
  const panel = document.getElementById("searchPanel");
  const input = document.getElementById("searchInput");
  const submit = document.getElementById("searchSubmit");
  btn.addEventListener("click",()=>{
    panel.style.display = panel.style.display === "block" ? "none" : "block";
    input.focus();
  });
  submit.addEventListener("click", EXECUTE_SEARCH);
  input.addEventListener("keypress", e=>{
    if(e.key === "Enter") EXECUTE_SEARCH();
  });
  function EXECUTE_SEARCH(){
    CLEAR_HIGHLIGHT();
    const value = input.value.trim();
    if(!value) return;
    const normalize = str =>
     str.toString()
    .replace(/\s+/g,'')
    .toUpperCase();
    const query = normalize(value);
    const features = ZDP_ALL_FEATURES.filter(f => {
      const roadId = f.properties?.nr;
      if(!roadId) return false;
      return normalize(roadId).startsWith(query);
    });
    if(!features.length){
      alert("Nie znaleziono drogi o nr: " + value);
      return;
    }
    /* Podświetl wszystkie segmenty o tym samym ID */
    HIGHLIGHT_FEATURES_BY_ID(value);
    const geojson = {
      type:"FeatureCollection",
      features: features
    };
    let bounds = new maplibregl.LngLatBounds();
    geojson.features.forEach(feature=>{
      const geom = feature.geometry;
      if(!geom) return;
      const processCoords = (coords)=>{
        coords.forEach(c=>{
          if(Array.isArray(c[0])){
            processCoords(c);
            } else {
                bounds.extend(c);
            }
        });
      };
    processCoords(geom.coordinates);
    });
    map.fitBounds(bounds,{
      padding:80,
      duration:800
    });
  }
}
function CLEAR_HIGHLIGHT(){
  STOP_PULSE_ANIMATION();
  if(map.getLayer("search_highlight_layer")){
    map.removeLayer("search_highlight_layer");
  }
  if(map.getLayer("search_pulse_layer")){
    map.removeLayer("search_pulse_layer");
  }
  if(map.getSource("search_highlight_source")){
    map.removeSource("search_highlight_source");
  }
  pulseGrowing = true;
  pulseRadius = 2;
}
/* ===============================
MODIFY HIGHLIGHT FUNCTION
=============================== */
function HIGHLIGHT_FEATURES_BY_ID(id){
  const features = ZDP_ALL_FEATURES.filter(
    f => f.properties?.nr && f.properties.nr.toString().toUpperCase().startsWith(
      id.toString().toUpperCase()
    )
  );
  if(!features.length) return;
  /* cleanup */
  if(map.getLayer("search_highlight_layer")){
    map.removeLayer("search_highlight_layer");
  }
  if(map.getLayer("search_pulse_layer")){
    map.removeLayer("search_pulse_layer");
  }
  if(map.getSource("search_highlight_source")){
    map.removeSource("search_highlight_source");
  }
  /* geojson wrapper */
  const geojson = {
    type:"FeatureCollection",
    features:features
  };
  map.addSource("search_highlight_source",{
    type:"geojson",
    data:geojson
  });
  /* main highlight line */
  const labelLayer = "road_id_labels";
  map.addLayer(
    {
      id:"search_highlight_layer",
      type:"line",
      source:"search_highlight_source",
      paint:{
          "line-color":"#00008B",
          "line-width":6,
          "line-opacity":0.95
      },
      layout:{
        "line-cap":"round",
        "line-join":"round"
      }
    },
    /* Wstaw highlight POD numerami dróg */
    map.getLayer(labelLayer) ? labelLayer : undefined
  );
  /* pulse halo layer */
  map.addLayer({
    id:"search_pulse_layer",
    type:"line",
    source:"search_highlight_source",
    paint:{
      "line-color":"#FFFF00",
      "line-width":2,
      "line-opacity":0.5
    }
  });
  /* start animation */
  map.once("idle", () => {
    START_PULSE_ANIMATION();
  });
}
