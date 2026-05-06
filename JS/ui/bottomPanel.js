function INIT_BOTTOM_PANEL(){
  const bottomPanel = document.getElementById("bottomPanel");
  const bottomPanelHeader = document.getElementById("bottomPanelHeader");
  if(!bottomPanel || !bottomPanelHeader) return;
  bottomPanelHeader.addEventListener("click", () => {
    bottomPanel.classList.toggle("open");
    UPDATE_ATTRIBUTION_POSITION();
  });
  window.addEventListener("resize", UPDATE_ATTRIBUTION_POSITION);
}
function UPDATE_BOTTOM_PANEL_BASIC({ roadNr, kmText, geometryHtml, paramsHtml }){
  document.getElementById("selectedRoad").innerText =
    `Wybrana droga: ${roadNr ?? "-"}`;
  document.getElementById("selectedKm").innerText =
    `KM: ${kmText}`;
  document.getElementById("bpGeometry").innerHTML = geometryHtml;
  document.getElementById("bpParams").innerHTML = paramsHtml;
}
function UPDATE_BOTTOM_PANEL_PR_EMPTY(){
  document.getElementById("bpRuch").innerHTML = `Brak danych pomiaru ruchu`;
  document.getElementById("bpCharts").innerHTML = "";
  document.getElementById("prLegendMain").style.display = "none";
  document.getElementById("prLegendSub").style.display = "none";
}
function UPDATE_BOTTOM_PANEL_PR(sum){
  document.getElementById("bpRuch").innerHTML = `
    <b>SDR:</b> ${sum}<br><br>
  `;
  document.getElementById("bpCharts").className = "mode-a";
  document.getElementById("bpCharts").innerHTML = `
    <div class="pr-chart-slot">
      <canvas id="prMainChart"></canvas>
    </div>
    <div class="pr-chart-slot">
      <canvas id="prSubChart"></canvas>
    </div>
  `;
}
