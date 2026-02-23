// legend-control.js

function ZDP_LEGEND_INIT(){

    document.querySelectorAll('#legend input').forEach(chk=>{

        chk.addEventListener('change',e=>{

            if(!window.map_instance) return;

            const map = window.map_instance;

            const layers = e.target.dataset.layers.split(',');

            layers.forEach(layerId=>{

                if(!map.getLayer(layerId)) return;

                map.setLayoutProperty(
                    layerId,
                    'visibility',
                    e.target.checked ? 'visible':'none'
                );

            });

        });

    });

    console.log("✅ Legend controller initialized");
}

window.ZDP_LEGEND_INIT = ZDP_LEGEND_INIT;
