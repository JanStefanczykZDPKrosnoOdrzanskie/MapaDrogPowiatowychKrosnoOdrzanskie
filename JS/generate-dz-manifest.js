const fs = require("fs");
const path = require("path");

const folder = path.join(__dirname, "../GEOJSON/EW/DZ");

const files = fs.readdirSync(folder)
  .filter(f => f.endsWith(".geojson"));

const manifest = {
  files
};

fs.writeFileSync(
  path.join(folder, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log("DZ manifest generated:", manifest);
