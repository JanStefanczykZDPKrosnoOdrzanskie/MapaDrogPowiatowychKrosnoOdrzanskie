/* ===============================
LEGEND CONTROL
=============================== */
function ZDP_LEGEND_INIT(){
  document.querySelectorAll('#legend input').forEach(chk=>{
    chk.addEventListener('change',e=>{
      // ===== PR KALKULACJA LABELA =====
      if(e.target.dataset.prType){
        const type = e.target.dataset.prType;
        PR_SELECTED_TYPES[type] = e.target.checked;
        UPDATE_PR_LABELS();
        return;
      }
      // ===== PR TOGGLE =====
      if(e.target.dataset.prSection === "true"){
        const visible = e.target.checked;
        if(map.getLayer("layer_pr")){
          map.setLayoutProperty(
            "layer_pr",
            "visibility",
            visible ? "visible" : "none"
          );
        }
        if(map.getLayer("pr_labels")){
          map.setLayoutProperty(
            "pr_labels",
            "visibility",
            visible ? "visible" : "none"
          );
        }
        return;
      }
      if(!e.target.dataset.layers) return;
      const layers = e.target.dataset.layers.split(',');
      layers.forEach(layerId=>{
        if(!map.getLayer(layerId)) return;
        map.setLayoutProperty(
          layerId,
          'visibility',
          e.target.checked ? 'visible':'none'
        );
      });
      UPDATE_LABEL_FILTER();
      UPDATE_EW_LABELS_VISIBILITY();
      UPDATE_BASEMAP_ATTRIBUTION();
    });
  });
}
function UPDATE_LABEL_FILTER(){
  if(!map.getLayer("road_id_labels")) return;
  const visibleAdm = [];
  if(map.getLayoutProperty("layer_adm_1","visibility") !== "none") visibleAdm.push("K");
  if(map.getLayoutProperty("layer_adm_2","visibility") !== "none") visibleAdm.push("W");
  if(map.getLayoutProperty("layer_adm_3","visibility") !== "none") visibleAdm.push("P");
  if(map.getLayoutProperty("layer_adm_4","visibility") !== "none") visibleAdm.push("G");
  if(map.getLayoutProperty("layer_adm_5","visibility") !== "none") visibleAdm.push("L");
  if(visibleAdm.length === 0){
    map.setFilter(
      "road_id_labels",
      ["==",["get","adm"],-999]
    );
  } else {
    map.setFilter(
      "road_id_labels",
      ["match",["get","adm"],visibleAdm,true,false]
    );
  }
}
function UPDATE_EW_LABELS_VISIBILITY(){
  if(!map.getLayer("ew_labels")) return;
  const ewCheckbox = document.querySelector(
    'input[data-group="ew"][data-layers="layer_ew_2"]'
  );
  if(!ewCheckbox) return;
  map.setLayoutProperty(
    "ew_labels",
    "visibility",
    ewCheckbox.checked ? "visible" : "none"
  );
}
/* ===============================
LEGEND COLAPSE
=============================== */
const legend = document.getElementById("legend");
const btn = document.getElementById("legendToggle");
btn.addEventListener("click", () => {
  document.body.classList.toggle("legend-collapsed");
  if (document.body.classList.contains("legend-collapsed")) {
    btn.innerHTML = "⮜";
  } else {
    btn.innerHTML = "⮞";
  }
});
document.querySelectorAll(".legend-section h3").forEach(header=>{
  header.addEventListener("click", (e)=>{
    if(e.target.tagName === "INPUT") return;
    const section = header.parentElement;
    section.classList.toggle("collapsed");
  });
});
document.querySelectorAll(".section-toggle").forEach(toggle=>{
  toggle.addEventListener("click", e=>{
    // blokada rozwijanie sekcji
    e.stopPropagation();
    const group = toggle.dataset.group;
    const checked = toggle.checked;
    const inputs = document.querySelectorAll(
      `.legend-section input[data-group="${group}"]:not(.section-toggle)`
    );
    inputs.forEach(input=>{
      input.checked = checked;
      const layers = input.dataset.layers.split(',');
      layers.forEach(layerId=>{
        if(!map.getLayer(layerId)) return;
        map.setLayoutProperty(
          layerId,
          'visibility',
          checked ? 'visible' : 'none'
        );
      });
    });
    UPDATE_EW_LABELS_VISIBILITY();
    UPDATE_LABEL_FILTER();
    UPDATE_BASEMAP_ATTRIBUTION();
  });
});
