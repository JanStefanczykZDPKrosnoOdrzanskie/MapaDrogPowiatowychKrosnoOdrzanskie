function ADD_FILTER_LAYER(map, layerId, source, filterExpression, color, width, visible=true){
  if(map.getLayer(layerId)) return;
  map.addLayer({
      id:layerId,
      type:"line",
      source:source,
      filter:filterExpression,
      layout:{
        visibility: visible ? "visible" : "none"
      },
      paint:{
        "line-color":color,
        "line-width":width
      }
  });
}df
function ZDP_RENDER_ROAD_STYLES(map){
  ADD_FILTER_LAYER(map,"layer_pr","zdp_roads",["has","PR"],
    ["coalesce", ["get","pr_color"], "#888888"],
    ["case", ["has", "pr_sum"], ["+", 2, ["*", ["get", "pr_sum"], 0.01]],2],false);
  
  ADD_FILTER_LAYER(map,"layer_adm_1","zdp_roads",["==",["get","adm"],"K"],"#FF0000",4);
  ADD_FILTER_LAYER(map,"layer_adm_2","zdp_roads",["==",["get","adm"],"W"],"#08FF00",4);
  
  ADD_FILTER_LAYER(map,"layer_zud_2","zdp_roads",["==",["get","ZUD"],2],"#FFEE00",6, false);
  ADD_FILTER_LAYER(map,"layer_zud_3","zdp_roads",["==",["get","ZUD"],3],"#00FFFF",6, false);
  ADD_FILTER_LAYER(map,"layer_zud_4","zdp_roads",["==",["get","ZUD"],4],"#FA9EFF",6, false);
  ADD_FILTER_LAYER(map,"layer_zud_6","zdp_roads",["==",["get","ZUD"],6],"#A1A1A1",6, false);
  
  ADD_FILTER_LAYER(map,"layer_adm_3","zdp_roads",["==",["get","adm"],"P"],"#A500AD",3);
  ADD_FILTER_LAYER(map,"layer_adm_4","zdp_roads",["==",["get","adm"],"G"],"#808080",3, false);
  ADD_FILTER_LAYER(map,"layer_adm_5","zdp_roads",["==",["get","adm"],"L"],"#808080",1, false);

  ADD_FILTER_LAYER(map,"layer_dp_asf","zdp_roads",["==",["get","naw"],"ASF"],"#000000", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_gru","zdp_roads",["==",["get","naw"],"GRU"],"#A0522D", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_kam","zdp_roads",["==",["get","naw"],"KAM"],"#666666", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_bru","zdp_roads",["==",["get","naw"],"BRU"],"#8B4513", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_tlu","zdp_roads",["==",["get","naw"],"TLU"],"#C2B280", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_zwr","zdp_roads",["==",["get","naw"],"ZWR"],"#FFD700", 5, false);
  ADD_FILTER_LAYER(map,"layer_dp_prf","zdp_roads",["==",["get","naw"],"PRF"],"#00FFFF", 5, false);
 
  ADD_FILTER_LAYER(map,"layer_kl_g","zdp_roads",["==",["get","kl"],"G"],"#520000", 7, false);
  ADD_FILTER_LAYER(map,"layer_kl_z","zdp_roads",["==",["get","kl"],"Z"],"#4c5200", 5, false);
  ADD_FILTER_LAYER(map,"layer_kl_l","zdp_roads",["==",["get","kl"],"L"],"#005218", 4, false);
}
/* ===============================
LABELS
=============================== */
function ADD_LABEL_LAYER(map){
  if(map.getLayer("road_id_labels")) return;
  map.addLayer({
    id:"road_id_labels",
    type:"symbol",
    source:"zdp_roads",
    filter:["match",["get","adm"],[1,2,3],true,false],
    layout:{
      "symbol-placement":"line",
      "text-field":["get","nr"],
      "text-font":["Open Sans Semibold"],
      "text-size":12,
      "text-anchor":"center",
      "text-allow-overlap":false,
      "text-ignore-placement":false,
      "text-max-angle":30
    },
  paint:{
    /* ===== Kolor tekstu zależny od adm ===== */
    "text-color":[
    "case",
      ["==", ["get","adm"], "K"], "#FFFFFF",
      ["==", ["get","adm"], "W"], "#000000",
      ["==", ["get","adm"], "P"], "#FFFFFF",
      ["==", ["get","adm"], "G"], "#FFFFFF",
      "#000000"
    ],
    /* ===== Halo / ramka ===== */
    "text-halo-color":[
      "case",
      ["==", ["get","adm"], "K"], "#FF0000",
      ["==", ["get","adm"], "W"], "#FFEE00",
      ["==", ["get","adm"], "P"], "#A500AD",
      ["==", ["get","adm"], "G"], "#808080",
      "#FFFFFF"
    ],
      "text-halo-width":3,
      "text-halo-blur":0.5
    }
  });
}
