/* ===============================
APP STATE
Centralny stan aplikacji
=============================== */

let ZDP_ALL_FEATURES = [];

let CURRENT_BASEMAP = "osm";

let KM_MEASURE_ENABLED = false;
let KM_INTERMEDIATE_LOADED = false;
let CURRENT_KM_MARKER = null;

let PR_SELECTED_TYPES = {
  MOTO: true,
  SOMB: true,
  LSMC: true,
  SCBP: true,
  SCZP: true,
  ATBS: true,
  CGNR: true
};

let PR_LAST_ROW = null;
let PR_CSV_RAW = null;

let PR_SPEED_HIST = {};
let PR_TIME_HIST = {};
