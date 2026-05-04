let CURRENT_BASEMAP = "OSM Standard";
/* ===============================
MAP INSTANCE
=============================== */
const map = new maplibregl.Map({
  attributionControl: false,
  maxBounds:[
    [14, 51.6],
    [15.75, 52.35]
  ],
  container:'map',
  style:{
    version:8,
    glyphs:"https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources:{
      osm:{
        type:"raster",
        tiles:[
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize:256,
        attribution:"© OpenStreetMap contributors"
      }
    },
    layers:[{
      id:"osm",
      type:"raster",
      source:"osm"
    }]
  },
  center:[14.8953712,52.01625],
  zoom:10
});
/* ===============================
BASE MAP DROPDOWN CONTROL
=============================== */
const BASE_MAPS = {
  "OSM Standard":{
    tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    tileSize:256,
    attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
  },
  "ESRI Satellite":{
    tiles:["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    tileSize:256,
    attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
  },
  "Dark Night":{
    tiles:["https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"],
    tileSize:256,
    attribution:'© OpenStreetMap contributors © CARTO'
  },
};
/* ===============================
BASE LAYER SWITCH
=============================== */
function SWITCH_BASEMAP(name){
  CURRENT_BASEMAP = name;
  UPDATE_BASEMAP_ATTRIBUTION();
  const cfg = BASE_MAPS[name];
  if(!cfg) return;
  if(map.getLayer("osm")){
    map.removeLayer("osm");
  }
  if(map.getSource("osm")){
    map.removeSource("osm");
  }
  map.addSource("osm",{
    type:"raster",
    tiles:cfg.tiles,
    tileSize:cfg.tileSize,
    attribution:cfg.attribution
  });
  map.addLayer({
    id:"osm",
    type:"raster",
    source:"osm"
  }, 
  map.getStyle().layers[0].id);
}
/* ===============================
CREATE UI
=============================== */
function CREATE_BASEMAP_BUTTONS(map){
  const container = document.createElement("div");
  container.id = "basemapButtons";
  document.body.appendChild(container);
  const buttons = [
    {label:"Mapa", map:"OSM Standard"},
    {label:"Satelita", map:"ESRI Satellite"},
    {label:"Nocna", map:"Dark Night"}
  ];
  buttons.forEach(cfg=>{
    const btn = document.createElement("div");
    btn.className = "basemap-btn";
    btn.innerText = cfg.label;
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".basemap-btn")
      .forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      SWITCH_BASEMAP(cfg.map);
    });
    container.appendChild(btn);
  });
  /* ustaw pierwszy jako aktywny */
  container.querySelector(".basemap-btn").classList.add("active");
}
/* ===============================
CONTRYBUTION
=============================== */
function UPDATE_BASEMAP_ATTRIBUTION(){
  const cfg = BASE_MAPS[CURRENT_BASEMAP];
  if(!cfg) return;
  let html = `© <a href="https://maplibre.org/" target="_blank">MapLibre</a> | ${cfg.attribution}`;
  /* sprawdzenie Geoportalu */
  const geoCheckboxes = document.querySelectorAll(
    'input[data-group="grn"], input[data-group="ew"]'
  );
  let geoActive = false;
  geoCheckboxes.forEach(chk=>{
    if(chk.checked) geoActive = true;
  });
  /* dodaj Geoportal tylko raz */
  if(geoActive){
    html += ' | Dane: <a href="https://www.geoportal.gov.pl" target="_blank">Geoportal</a>';
  }
  document.getElementById("mapAttribution").innerHTML = html;
}
function UPDATE_ATTRIBUTION_POSITION(){
  const attribution = document.getElementById("mapAttribution");
  const bottomPanel = document.getElementById("bottomPanel");
  if(!attribution || !bottomPanel) return;
  const panelRect = bottomPanel.getBoundingClientRect();
  const visibleHeight = window.innerHeight - panelRect.top;
  attribution.style.bottom = `${visibleHeight + 5}px`;
}
/* ===============================
INIT
=============================== */
function INIT_MAP_UI(){
  CREATE_BASEMAP_BUTTONS(map);
  document.getElementById("updateOverlay").innerText =
    "Aktualizacja: " + new Date().toLocaleString("pl-PL");
  UPDATE_BASEMAP_ATTRIBUTION();
  UPDATE_ATTRIBUTION_POSITION();
}

