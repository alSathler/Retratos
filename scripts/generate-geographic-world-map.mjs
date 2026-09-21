import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { geoPath, geoProjection } from "d3-geo";
import { feature } from "topojson-client";

const view = { minX: 30.767, minY: 241.591, width: 784.077, height: 458.627 };
const centerX = view.minX + view.width / 2;
const centerY = view.minY + view.height / 2;
const topology = JSON.parse(
    await readFile(resolve("node_modules/world-atlas/countries-110m.json"), "utf8")
);

// Plate carrée: this is intentionally the same conversion used by the atlas
// pins, so every longitude/latitude point shares the land geometry's grid.
const projection = geoProjection((longitude, latitude) => [
    (longitude * view.width) / (2 * Math.PI),
    // geoProjection performs the SVG y-axis inversion itself.
    (latitude * view.height) / Math.PI,
])
    .scale(1)
    .translate([centerX, centerY]);

const countries = feature(topology, topology.objects.countries);
const path = geoPath(projection)(countries);
const svg = `<!-- Geographic world map: Natural Earth via world-atlas, rendered in plate carree. -->\n<path d="${path}" />\n`;

await writeFile(resolve("src/assets/world-land-geographic.svg"), svg, "utf8");
