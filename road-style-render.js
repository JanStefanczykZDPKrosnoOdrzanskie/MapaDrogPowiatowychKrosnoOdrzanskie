// ======================================================
// ZDP ROAD RENDERER - FINAL VERSION
// MapLibre GL JS production-safe styling
// ======================================================

function ZDP_RENDER_ROAD_STYLES(map){

    // ===============================
    // DK + DW layer (Adm classification)
    // ===============================

    if(!map.getLayer("DK_i_DW_layer")){

        map.addLayer({
            id: "DK_i_DW_layer",
            type: "line",
            source: "zdp_roads_main",

            paint: {

                "line-color":[
                    "match",
                    ["get","Adm"],

                    1, "#FF0000",   // DK
                    2, "#08FF00",   // DW

                    "#FF0000"
                ],

                "line-width":3
            }
        });
    }

// ======================================================
// DP LAYER - FULL CLASSIFICATION LOGIC
// ======================================================

if(!map.getLayer("DP_layer")){

    map.addLayer({
        id: "DP_layer",
        type: "line",
        source: "zdp_roads_dp",

        paint: {

            "line-color":[
                "case",

                // ===============================
                // Priority 1 — ZUD classification
                // ===============================

                ["==", ["get","ZUD"], 2], "#FFEE00",
                ["==", ["get","ZUD"], 3], "#00FFFF",
                ["==", ["get","ZUD"], 4], "#FA9EFF",
                ["==", ["get","ZUD"], 6], "#A1A1A1",

                // ===============================
                // Priority 2 — Adm classification
                // (DK + DW + DP handling)
                // ===============================

                ["==", ["get","Adm"], 1], "#FF0000",   // DK
                ["==", ["get","Adm"], 2], "#08FF00",   // DW
                ["==", ["get","Adm"], 3], "#A500AD",   // DP

                // ===============================
                // Default safety color
                // ===============================

                "#A500AD"
            ],

            "line-width":3
        }
    });
}
