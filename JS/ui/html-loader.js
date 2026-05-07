async function LOAD_HTML(containerId, path){
  const container = document.getElementById(containerId);
  if(!container){
    console.warn("Brak kontenera:", containerId);
    return;
  }
  try{
    const res = await fetch(path);
    if(!res.ok){
      throw new Error(`HTTP ${res.status}`);
    }
    container.innerHTML = await res.text();
  }catch(err){
    console.error("HTML load error:", path, err);
  }
}
