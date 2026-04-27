function ADD_PR_LABELS() {
  if (map.getLayer("pr_labels")) return;
  map.addLayer({
    id: "pr_labels",
    type: "symbol",
    source: "zdp_roads",
    filter: ["has", "PR"],
    layout: {
      "symbol-placement": "line",
      "text-field": ["coalesce", ["get", "pr_sum"], ""],
      "text-size": 14,
      "text-anchor": "center",
      "visibility": "none"
    },
    paint: {
      "text-color": "#000000",
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 2
    }
  });
  map.moveLayer("pr_labels");
}
function UPDATE_PR_LABELS() {
  let min = Infinity;
  let max = -Infinity;
  const source = map.getSource("zdp_roads");
  if (!source) return;
  const data = source._data;
  data.features.forEach(f => {
    const pr = f.properties?.PR;
    if (!pr) return;
    const row = PR_CSV_DATA[pr];
    if (!row) return;
    // =====================
    // CHECK NULL VALUES
    // =====================
    if (
      (PR_SELECTED_TYPES.MOTO && row.MOTO == null) ||
      (PR_SELECTED_TYPES.SOMB && row.SOMB == null) ||
      (PR_SELECTED_TYPES.LSMC && row.LSMC == null) ||
      (PR_SELECTED_TYPES.SCBP && row.SCBP == null) ||
      (PR_SELECTED_TYPES.SCZP && row.SCZP == null) ||
      (PR_SELECTED_TYPES.ATBS && row.ATBS == null) ||
      (PR_SELECTED_TYPES.CGNR && row.CGNR == null)
    ){return;}
    // =====================
    // SUMA (tylko jeśli pełne dane)
    // =====================
    let sum = 0;
    if (PR_SELECTED_TYPES.MOTO) sum += row.MOTO;
    if (PR_SELECTED_TYPES.SOMB) sum += row.SOMB;
    if (PR_SELECTED_TYPES.LSMC) sum += row.LSMC;
    if (PR_SELECTED_TYPES.SCBP) sum += row.SCBP;
    if (PR_SELECTED_TYPES.SCZP) sum += row.SCZP;
    if (PR_SELECTED_TYPES.ATBS) sum += row.ATBS;
    if (PR_SELECTED_TYPES.CGNR) sum += row.CGNR;
    const allOff =
      !PR_SELECTED_TYPES.MOTO &&
      !PR_SELECTED_TYPES.SOMB &&
      !PR_SELECTED_TYPES.LSMC &&
      !PR_SELECTED_TYPES.SCBP &&
      !PR_SELECTED_TYPES.SCZP &&
      !PR_SELECTED_TYPES.ATBS &&
      !PR_SELECTED_TYPES.CGNR;
    if (allOff) {
      f.properties.pr_sum = undefined;
      f.properties.pr_color = undefined;
      return;
    }
    f.properties.pr_sum = sum;
    if (sum < min) min = sum;
    if (sum > max) max = sum;
  });
  data.features.forEach(f => {
    const val = f.properties?.pr_sum;
    if (val === undefined) {
      f.properties.pr_color = undefined;
      return;
    }
    let t = 0;
    if (max !== min) {
      t = (val - min) / (max - min);
    }
    let r, g;
    if (t <= 0.5) {
      // zielony -> żółty (środek 255/255/40)
      const tt = t * 2;
      r = Math.round(255 * tt);
      g = 255;
    } else {
      // żółty -> czerwony
      const tt = (t - 0.5) * 2;
      r = 255;
      g = Math.round(255 * (1 - tt));
    }
    const b = 40;
    f.properties.pr_color = `rgb(${r},${g},${b})`;
  });
  source.setData(data);
}
function INIT_PR_LAYER(map){
  ADD_PR_LABELS();
  UPDATE_PR_LABELS();
}
