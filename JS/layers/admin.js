function ZDP_RENDER_ADMIN_STYLES(map){
  ADD_FILTER_LAYER(map,"layer_ew_2","admin_boundaries",["==",["get","EW"],2],"#66B2FF",2, false);
  ADD_FILTER_LAYER(map,"layer_ew_1","admin_boundaries",["==",["get","EW"],1],"#0066CC",2, false);
  
  ADD_FILTER_LAYER(map,"layer_grn_3","admin_boundaries",["==",["get","GRN"],3],"#999999",1, false);
  ADD_FILTER_LAYER(map,"layer_grn_2","admin_boundaries",["==",["get","GRN"],2],"#555555",1,false);
  ADD_FILTER_LAYER(map,"layer_grn_1","admin_boundaries",["==",["get","GRN"],1],"#000000",2, true);
}
function ADD_EW_LABELS(map){
  if(map.getLayer("ew_labels")) return;
  map.addSource("ew_labels_source", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });
  map.addLayer({
    id: "ew_labels",
    type: "symbol",
    source: "ew_labels_source",
    layout: {
      "text-field": ["get","name"],
      "text-size": 12,
      "text-anchor": "center",
      "text-allow-overlap": false
    },
    paint: {
      "text-color": "#003366",
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 2
    }
  });
  UPDATE_EW_LABELS();
}
function UPDATE_EW_LABELS(){
  const zoom = map.getZoom();
  /* ===============================
     ZAKRESY LABELI EW
  =============================== */
  const showEW1 = zoom >= 9.5 && zoom < 12;
  const showEW2 = zoom >= 12 && zoom <= 17;
  /* jeśli nic nie powinno być widoczne */
  if (!showEW1 && !showEW2) {
    map.getSource("ew_labels_source").setData({
      type: "FeatureCollection",
      features: []
    });
    return;
  }
  const source = map.getSource("admin_boundaries");
  if(!source) return;
  const data = source._data;
  if(!data) return;
  const bounds = map.getBounds();
  const bboxPolygon = turf.bboxPolygon([
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ]);
  const visibleFeatures = [];
  data.features.forEach(f=>{
    const ew = f.properties?.EW;
    if (ew === 2 && !showEW2) return;
    if (ew === 1 && !showEW1) return;
    if (ew !== 1 && ew !== 2) return;
    try{
      let polygon = f;
      // 1. Spróbuj przecięcia z viewportem
      let clipped = turf.intersect(polygon, bboxPolygon);
      let point;
      if(clipped){
        // ✔ label "wciągnięty" do widocznej części
        point = turf.pointOnFeature(clipped);
      }else{
        // ✔ fallback: najbliższy punkt do viewportu
        const center = turf.center(bboxPolygon);
        point = turf.nearestPointOnLine(
          turf.polygonToLine(polygon),
          center
        );
      }
      let [lng, lat] = point.geometry.coordinates;
        /* ===============================
        PIXEL OFFSET OD KRAWĘDZI
        =============================== */
      const OFFSET_PX = 40; // <- regulacja
        try{
          const screenPoint = map.project([lng, lat]);
          // zamień polygon na linię (granice)
          const polygonLine = turf.polygonToLine(polygon);
          // znajdź najbliższy punkt na granicy
          const nearest = turf.nearestPointOnLine(polygonLine, point);
          const nearestScreen = map.project(nearest.geometry.coordinates);
          // dystans w pixelach
          const dx = screenPoint.x - nearestScreen.x;
          const dy = screenPoint.y - nearestScreen.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < OFFSET_PX && dist > 0){
            const factor = (OFFSET_PX - dist) / dist;
            screenPoint.x += dx * factor;
            screenPoint.y += dy * factor;
            const newLngLat = map.unproject(screenPoint);
            lng = newLngLat.lng;
            lat = newLngLat.lat;
          }
        } catch(e) {
          // fallback – zostaw jak było
        }
      visibleFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        properties: {
          name: f.properties?.NAME || ""
        }
      });
    }catch(e){
      // ostateczny fallback
      const point = turf.pointOnFeature(f);
      visibleFeatures.push({
        type:"Feature",
        geometry: point.geometry,
        properties:{
          name: f.properties?.NAME || ""
        }
      });
    }
  });
  map.getSource("ew_labels_source").setData({
    type:"FeatureCollection",
    features:visibleFeatures
  });
}
let EW_LABELS_TIMEOUT = null;
function UPDATE_EW_LABELS_DEBOUNCED(){
  if(EW_LABELS_TIMEOUT){
    clearTimeout(EW_LABELS_TIMEOUT);
  }
  EW_LABELS_TIMEOUT = setTimeout(()=>{
    UPDATE_EW_LABELS();
  }, 250); // 0.25s
}
function INIT_ADMIN_LAYER(map){
  ZDP_RENDER_ADMIN_STYLES(map);
  ADD_EW_LABELS(map);
  UPDATE_EW_LABELS_VISIBILITY();
  map.on("move", UPDATE_EW_LABELS_DEBOUNCED);
  map.on("zoom", UPDATE_EW_LABELS_DEBOUNCED);
}
