let ZDP_ALL_FEATURES = [];
let PR_CSV_DATA = {};
/* ===============================
GEOJSON SOURCE LOADER
=============================== */
async function ZDP_LOAD_GEO_SOURCES(map){
  const pr_csv = await fetch("PR.csv").then(r => r.text());
  const parsed = Papa.parse(pr_csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });
  PR_CSV_DATA = {};
  parsed.data.forEach(row => {
    const key = row.PR;
    if (!key) return;
    PR_CSV_DATA[key] = row;
  });
  const [
    DK, DW, DP, DG, DWew,
    pr_data,
    zud_data,
    DP_NAW,
    DP_KL
  ] = await Promise.all([
    fetch("GEOJSON/ADM_i_NR/DK.geojson").then(r=>r.json()),
    fetch("GEOJSON/ADM_i_NR/DW.geojson").then(r=>r.json()),
    fetch("GEOJSON/ADM_i_NR/DP.geojson").then(r=>r.json()),
    fetch("GEOJSON/ADM_i_NR/DG.geojson").then(r=>r.json()),
    fetch("GEOJSON/ADM_i_NR/DWew.geojson").then(r=>r.json()),
    fetch("PR.geojson").then(r=>r.json()),
    fetch("GEOJSON/ZUD/ZUD_2025.geojson").then(r=>r.json()),
    fetch("GEOJSON/DP_NAW.geojson").then(r=>r.json()),
    fetch("GEOJSON/DP_KL.geojson").then(r=>r.json())
    ]);
  const merged_roads = {
    type:"FeatureCollection",
    features:[
      ...(DK?.features || []),
      ...(DW?.features || []),
      ...(DP?.features || []),
      ...(DG?.features || []),
      ...(DWew?.features || []),
      ...(pr_data?.features || []),
      ...(zud_data?.features || []),
      ...(DP_NAW?.features || []),
      ...(DP_KL?.features || [])
    ]
  };
  ZDP_ALL_FEATURES = merged_roads.features;
  if(map.getSource("zdp_roads")){
    map.removeSource("zdp_roads");
  }
  map.addSource("zdp_roads",{
    type:"geojson",
    data:merged_roads
  });
  try{
    const admin_files = await Promise.all([
      fetch("GEOJSON/GRN/GRN_Powiat.geojson").then(r=>r.json()),
      fetch("GEOJSON/GRN/GRN_Gminy.geojson").then(r=>r.json()),
      fetch("GEOJSON/GRN/GRN_Miasta.geojson").then(r=>r.json()),
      fetch("GEOJSON/EW/EW_Jednostki.geojson").then(r=>r.json()),
      fetch("GEOJSON/EW/EW_Obręby.geojson").then(r=>r.json())
    ]);
    const admin_merged = {
      type:"FeatureCollection",
      features:[
        ...admin_files.flatMap(f => f.features || [])
        ]
    };
    if(map.getSource("admin_boundaries")){
        map.removeSource("admin_boundaries");
    }
    map.addSource("admin_boundaries",{
      type:"geojson",
      data:admin_merged
    });
  }
  catch(e){
    console.error("admin boundaries load error:",e);
  }
}
