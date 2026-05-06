function INIT_ZOOM_UI(){
  const zoomSlider = document.getElementById("zoomSlider");
  const zoomValue = document.getElementById("zoomValue");

  if(!zoomSlider || !zoomValue) return;

  let isSyncingZoom = false;

  noUiSlider.create(zoomSlider, {
    start: map.getZoom(),
    orientation: "vertical",
    direction: "rtl",
    step: 0.1,
    range: {
      min: 9.5,
      max: 22
    }
  });

  zoomSlider.noUiSlider.on("slide", function(values){
    const zoom = parseFloat(values[0]);
    map.setZoom(zoom);
    zoomValue.innerText = "Zoom: " + zoom.toFixed(1);
  });

  map.on("zoom", () => {
    if(isSyncingZoom) return;

    isSyncingZoom = true;

    const z = map.getZoom();
    zoomSlider.noUiSlider.set(z);
    zoomValue.innerText = "Zoom: " + z.toFixed(1);

    isSyncingZoom = false;
  });
}
