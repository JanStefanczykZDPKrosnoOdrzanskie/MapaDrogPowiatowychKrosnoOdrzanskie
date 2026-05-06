let pulseAnimationFrame = null;
let pulseRadius = 0;
let pulseGrowing = true;
function START_PULSE_ANIMATION(){
  STOP_PULSE_ANIMATION();
  pulseRadius = 4;
  pulseGrowing = true;
  function animate(){
    if(!map.getLayer("search_pulse_layer")){
      pulseAnimationFrame = requestAnimationFrame(animate);
      return;
    }
    if(pulseGrowing){
      pulseRadius += 0.4;
      if(pulseRadius > 18) pulseGrowing = false;
    } else {
      pulseRadius -= 0.4;
      if(pulseRadius < 4) pulseGrowing = true;
    }
    map.setPaintProperty(
      "search_pulse_layer",
      "line-width",
      pulseRadius
    );
    pulseAnimationFrame = requestAnimationFrame(animate);
  }
  pulseAnimationFrame = requestAnimationFrame(animate);
}
function STOP_PULSE_ANIMATION(){
  if(pulseAnimationFrame){
    cancelAnimationFrame(pulseAnimationFrame);
    pulseAnimationFrame = null;
  }
  if(map.getLayer("search_pulse_layer")){
    map.removeLayer("search_pulse_layer");
  }
}
