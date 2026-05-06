let PR_LAST_ROW = null;
let PR_CHART_MODE = "A"; // "A" | "B" | "C"
let PR_CHART_INSTANCE_MAIN = null;
let PR_CHART_INSTANCE_SUB = null;

let PR_SELECTED_TYPES = {
  MOTO: true,
  SOMB: true,
  LSMC: true,
  SCBP: true,
  SCZP: true,
  ATBS: true,
  CGNR: true
};

const PR_TYPE_META = {
  MOTO: { label: "Motocykle", color: "#1f77b4" },
  SOMB: { label: "Sam. os. i Mikrobusy", color: "#ff7f0e" },
  LSMC: { label: "Lekkie Sam. Ciężarowe", color: "#2ca02c" },
  SCBP: { label: "Sam. Ciężarowe bez przycz.", color: "#d62728" },
  SCZP: { label: "Sam. Ciężarowe z przycz.", color: "#9467bd" },
  ATBS: { label: "Autobusy", color: "#8c564b" },
  CGNR: { label: "Ciągniki rolne", color: "#e377c2" },
  OTHER:{ label: "Pozostałe", color: "#7f7f7f" }
};

function RENDER_PR_LEGEND(containerId, entries){
  const container = document.getElementById(containerId);
  if(!container) return;

  container.innerHTML = "";

  const title = document.createElement("div");
  title.style.fontWeight = "bold";
  title.style.marginBottom = "10px";
  title.style.paddingBottom = "6px";
  title.style.borderBottom = "1px solid #ddd";
  title.style.fontSize = "12px";
  title.innerText =
    containerId === "prLegendMain"
      ? "Udział rodzaju pojazdów"
      : "Pozostałe";

  container.appendChild(title);

  entries.forEach(e => {
    const meta = PR_TYPE_META[e.type] || PR_TYPE_META.OTHER;

    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.marginBottom = "6px";
    el.innerHTML = `
      <div style="
        width:12px;
        height:12px;
        background:${meta.color};
        margin-right:8px;
        border-radius:2px;
        flex-shrink:0;
      "></div>
      <div style="flex:1">${meta.label}</div>
      <div>${e.val}</div>
    `;

    container.appendChild(el);
  });
}

function RENDER_PR_CHART(){
  const mainCtx = document.getElementById("prMainChart");
  const subCtx = document.getElementById("prSubChart");

  if(!mainCtx || !subCtx) return;

  CLEAR_PR_CHART();

  document.getElementById("prLegendMain").innerHTML = "";
  document.getElementById("prLegendSub").innerHTML = "";

  if(PR_CHART_MODE === "A" || !PR_CHART_MODE){
    const LABEL_MAP = {
      MOTO: "Motocykle",
      SOMB: "Sam. os. i Mikrobusy",
      LSMC: "Lekkie Sam. Ciężarowe",
      SCBP: "Sam. Ciężarowe bez przycz.",
      SCZP: "Sam. Ciężarowe z przycz.",
      ATBS: "Autobusy",
      CGNR: "Ciągniki rolne"
    };

    const row = PR_LAST_ROW;

    if(!row){
      document.getElementById("bpCharts").innerHTML = "Brak danych PR";
      document.getElementById("prLegendMain").style.display = "none";
      document.getElementById("prLegendSub").style.display = "none";
      return;
    }

    const entries = [];
    let total = 0;

    Object.keys(PR_SELECTED_TYPES).forEach(type => {
      if(PR_SELECTED_TYPES[type] && row[type] != null){
        const val = row[type];
        total += val;
        entries.push({ type, val });
      }
    });

    if(total === 0){
      document.getElementById("bpCharts").innerHTML = "Brak danych PR";
      document.getElementById("prLegendMain").style.display = "none";
      document.getElementById("prLegendSub").style.display = "none";
      return;
    }

    const threshold = total * 0.08;

    const mainLegendEntries = [];
    const subLegendEntries = [];

    const mainLabels = [];
    const mainValues = [];

    const otherLabels = [];
    const otherValues = [];

    let otherSum = 0;

    entries.forEach(e => {
      if(e.val < threshold){
        otherLabels.push(LABEL_MAP[e.type] ?? e.type);
        otherValues.push(e.val);
        otherSum += e.val;
        subLegendEntries.push(e);
      } else {
        mainLabels.push(LABEL_MAP[e.type] ?? e.type);
        mainValues.push(e.val);
        mainLegendEntries.push(e);
      }
    });

    if(otherSum > 0){
      mainLabels.push("Pozostałe");
      mainValues.push(otherSum);
      mainLegendEntries.push({ type: "OTHER", val: otherSum });
    }

    document.getElementById("prLegendMain").style.display = "block";
    document.getElementById("prLegendSub").style.display  = "block";

    RENDER_PR_LEGEND("prLegendMain", mainLegendEntries);
    RENDER_PR_LEGEND("prLegendSub", subLegendEntries);

    const mainColors = mainLabels.map(l => {
      const type = Object.keys(PR_TYPE_META).find(
        k => PR_TYPE_META[k].label === l
      );
      return PR_TYPE_META[type]?.color || PR_TYPE_META.OTHER.color;
    });

    PR_CHART_INSTANCE_MAIN = new Chart(mainCtx, {
      type: "pie",
      data: {
        labels: mainLabels,
        datasets: [{
          data: mainValues,
          backgroundColor: mainColors
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        }
      }
    });

    PR_CHART_INSTANCE_SUB = new Chart(subCtx, {
      type: "doughnut",
      data: {
        labels: otherLabels,
        datasets: [{
          data: otherValues,
          backgroundColor: subLegendEntries.map(e =>
            (PR_TYPE_META[e.type] || PR_TYPE_META.OTHER).color
          )
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        }
      }
    });

    return;
  }

  if (PR_CHART_MODE === "B") {
    if (Object.keys(PR_SPEED_HIST).length === 0) {
      document.getElementById("bpCharts").innerHTML = "brak pomiaru";
      return;
    }

    const parseRange = (key) => {
      const m = key.match(/(\d+)-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    };

    const sortedLabels = Object.keys(PR_SPEED_HIST)
      .sort((a, b) => parseRange(a) - parseRange(b));

    const values = sortedLabels.map(k => PR_SPEED_HIST[k]);

    PR_CHART_INSTANCE_MAIN = new Chart(mainCtx, {
      type: "bar",
      data: {
        labels: sortedLabels,
        datasets: [{
          label: "Prędkość (km/h)",
          data: values,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Przedziały prędkości"
            }
          },
          y: {
            title: {
              display: true,
              text: "Liczba pomiarów"
            },
            beginAtZero: true
          }
        }
      }
    });

    if(PR_CHART_INSTANCE_SUB){
      PR_CHART_INSTANCE_SUB.destroy();
      PR_CHART_INSTANCE_SUB = null;
    }

    return;
  }

  if(PR_CHART_MODE === "C"){
    if(Object.keys(PR_TIME_HIST).length === 0){
      document.getElementById("bpCharts").innerHTML = "brak pomiaru";
      return;
    }

    const labels = generateTimeBins();
    const values = labels.map(l => PR_TIME_HIST[l] || 0);

    PR_CHART_INSTANCE_MAIN = new Chart(mainCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Ruch (30 min)",
          data: values
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });

    if(PR_CHART_INSTANCE_SUB){
      PR_CHART_INSTANCE_SUB.destroy();
      PR_CHART_INSTANCE_SUB = null;
    }
  }
}

function INIT_PR_BUTTONS(){
  const setChartMode = (mode) => {
    PR_CHART_MODE = mode;
    if(!PR_LAST_ROW) return;

    const chartWrap = document.getElementById("bpCharts");
    chartWrap.className = (mode === "A") ? "mode-a" : "mode-bc";

    if(mode === "A"){
      chartWrap.innerHTML = `
        <div class="pr-chart-slot">
          <canvas id="prMainChart"></canvas>
        </div>
        <div class="pr-chart-slot">
          <canvas id="prSubChart"></canvas>
        </div>
      `;
    } else {
      chartWrap.innerHTML = `
        <canvas id="prMainChart"></canvas>
        <canvas id="prSubChart"></canvas>
      `;
    }

    const legendMain = document.getElementById("prLegendMain");
    const legendSub  = document.getElementById("prLegendSub");

    if(mode === "A"){
      legendMain.style.display = "block";
      legendSub.style.display = "block";
    } else {
      legendMain.style.display = "none";
      legendSub.style.display = "none";
    }

    RENDER_PR_CHART();
  };

  document.getElementById("prBtnA").addEventListener("click", () => setChartMode("A"));
  document.getElementById("prBtnB").addEventListener("click", () => setChartMode("B"));
  document.getElementById("prBtnC").addEventListener("click", () => setChartMode("C"));
}

function CLEAR_PR_CHART(){
  if(PR_CHART_INSTANCE_MAIN) PR_CHART_INSTANCE_MAIN.destroy();
  if(PR_CHART_INSTANCE_SUB) PR_CHART_INSTANCE_SUB.destroy();

  PR_CHART_INSTANCE_MAIN = null;
  PR_CHART_INSTANCE_SUB = null;
}
