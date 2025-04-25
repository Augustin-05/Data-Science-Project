// Base dimensions
const width = 960, height = 500;
const tooltip = d3.select("#tooltip");

// Loading GeoJSON and CSV data
Promise.all([
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
d3.csv("countries.csv", d => {
return {
Country: d.Country,
GDP: +d["GDP per Capita"].replace(/[$,]/g, '') || null,
HDI: +d.HDI || null,
Carbon: +d["Carbon Footprint"] || null,
Eco: +d["Total Ecological Footprint"] || null,
Bio: +d["Total Biocapacity"] || null,
Earths: +d["Earths Required"] || null,
Region: d.Region || null,
Efficiency: (+d["Carbon Footprint"] / +d["GDP per Capita"].replace(/[$,]/g, ''))*10000 || null
};
})
]).then(([mapData, data]) => {
const dataMap = Object.fromEntries(data.map(d => [d.Country, d]));

// MAP: Carbon Footprint per GDP
const svgMap = d3.select("#map").append("svg")
.attr("width", 800)
.attr("height", 500);

const projection = d3.geoMercator().scale(130).translate([width / 2.35, height / 1.5]);
const path = d3.geoPath().projection(projection);
const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, 10]);

svgMap.selectAll("path")
.data(mapData.features)
.join("path")
.attr("d", path)
.attr("fill", d => {
const val = dataMap[d.properties.name]?.Efficiency;
return val != null ? colorScale(val) : "#eee";
})
.attr("stroke", "#999")
.on("mouseover", (event, d) => {
const val = dataMap[d.properties.name]?.Efficiency;
tooltip.html(`<strong>${d.properties.name}</strong><br/>Carbon/GDP: ${val ? val.toFixed(6) : 'N/A'}`)
.style("left", event.pageX + 10 + "px")
.style("top", event.pageY - 28 + "px")
.style("opacity", 1);
})
.on("mouseout", () => tooltip.style("opacity", 0));

// SCATTER: HDI vs GDP
const svgScatter = d3.select("#scatter").append("svg")
.attr("width", width)
.attr("height", 600);

const margin = { top: 50, right: 60, bottom: 30, left: 60 };
const innerWidth = 800 - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const xGDP = d3.scaleLinear().domain([0, 100000]).range([0, innerWidth]);
const yHDI = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

const gScatter = svgScatter.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

gScatter.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xGDP));
gScatter.append("g").call(d3.axisLeft(yHDI));

gScatter.selectAll("circle")
.data(data.filter(d => d.HDI && d.GDP))
.join("circle")
.attr("cx", d => xGDP(d.GDP))
.attr("cy", d => yHDI(d.HDI))
.attr("r", 5)
.attr("fill", "#3498db")
.on("mouseover", (event, d) => {
tooltip.html(`<strong>${d.Country}</strong><br/>HDI: ${d.HDI}<br/>GDP: $${d.GDP.toLocaleString()}`)
.style("left", event.pageX + 10 + "px")
.style("top", event.pageY - 28 + "px")
.style("opacity", 1);
})
.on("mouseout", () => tooltip.style("opacity", 0));

// BUBBLE: Ecological Footprint vs Biocapacity
const svgBubble = d3.select("#bubble").append("svg")
.attr("width", width)
.attr("height", 600);

const xEco = d3.scaleLinear().domain([0, 10]).range([0, innerWidth]);
const yBio = d3.scaleLinear().domain([0, 10]).range([innerHeight, 0]);
const radiusScale = d3.scaleSqrt().domain([0, 10]).range([2, 30]);

const gBubble = svgBubble.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

gBubble.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xEco));
gBubble.append("g").call(d3.axisLeft(yBio));

gBubble.selectAll("circle")
.data(data.filter(d => d.Eco && d.Bio))
.join("circle")
.attr("cx", d => xEco(d.Eco))
.attr("cy", d => yBio(d.Bio))
.attr("r", d => radiusScale(d.Eco))
.attr("fill", "#2ecc71")
.attr("opacity", 0.7)
.on("mouseover", (event, d) => {
tooltip.html(`<strong>${d.Country}</strong><br/>Ecological Footprint: ${d.Eco}<br/>Biocapacity: ${d.Bio}`)
.style("left", event.pageX + 10 + "px")
.style("top", event.pageY - 28 + "px")
.style("opacity", 1);
})
.on("mouseout", () => tooltip.style("opacity", 0));

// Country Comparison (inchangé)
const countries = data.map(d => d.Country).sort();
const selectorHTML = `
<div class="compare-box">
<select id="countryA">
${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
</select>
<span>vs</span>
<select id="countryB">
${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
</select>
</div>
</div class="comparison-wrapper">
<div id="compare-output"></div>
<div id="radar-chart"></div>
`;

d3.select("#comparison").html("<h2>Country Comparison</h2>" + selectorHTML);

function updateRadar(countryA, countryB) {
const metrics = ['GDP', 'HDI', 'Carbon', 'Eco', 'Bio', 'Earths'];
const maxValues = {
GDP: 100000,
HDI: 1,
Carbon: 10,
Eco: 10,
Bio: 10,
Earths: 5,
};
const radarA = metrics.map(m => ({ axis: m, value: countryA[m] ? countryA[m] / maxValues[m] : 0 }));
const radarB = metrics.map(m => ({ axis: m, value: countryB[m] ? countryB[m] / maxValues[m] : 0 }));
d3.select("#radar-chart").html("");

const rWidth = 500, rHeight = 500, radius = 130;
const svg = d3.select("#radar-chart")
.append("svg")
.attr("viewBox", "-200 -200 400 400")
.attr("preserveAspectRatio", "xMidYMidmeet")
.style("width", "500px")
.style("height", "500px")
.append("g");
const angleSlice = Math.PI * 2 / metrics.length;
const allValues = radarA.concat(radarB).map(d => d.value);
const maxValue = d3.max(allValues);
const scale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
metrics.forEach((d, i) => {
const angle = angleSlice * i - Math.PI / 2;
const lineCoord = [Math.cos(angle) * radius, Math.sin(angle) * radius];
const labelCoord = [Math.cos(angle) * (radius + 20), Math.sin(angle) * (radius + 20)];
svg.append("line")
.attr("x1", 0).attr("y1", 0)
.attr("x2", lineCoord[0]).attr("y2", lineCoord[1])
.attr("stroke", "#ccc");
svg.append("text")
.attr("x", labelCoord[0])
.attr("y", labelCoord[1])
.attr("text-anchor", "middle")
.attr("dy", "0.35em")
.text(d);
});
const line = d3.lineRadial()
.radius(d => scale(d.value))
.angle((d, i) => i * angleSlice)
.curve(d3.curveLinearClosed);
svg.append("path").datum(radarA).attr("d", line).attr("fill", "#3498db").attr("fill-opacity", 0.5).attr("stroke", "#2980b9").attr("stroke-width", 2);
svg.append("path").datum(radarB).attr("d", line).attr("fill", "#2ecc71").attr("fill-opacity", 0.5).attr("stroke", "#27ae60").attr("stroke-width", 2);
svg.append("circle").attr("cx", -radius).attr("cy", radius + 30).attr("r", 6).style("fill", "#3498db");
svg.append("text").attr("x", -radius + 10).attr("y", radius + 34).text(countryA.Country).style("font-size", "12px").attr("alignment-baseline", "middle");
svg.append("circle").attr("cx", -radius).attr("cy", radius + 50).attr("r", 6).style("fill", "#2ecc71");
svg.append("text").attr("x", -radius + 10).attr("y", radius + 54).text(countryB.Country).style("font-size", "12px").attr("alignment-baseline", "middle");
}

function updateComparison() {
const a = data.find(d => d.Country === document.getElementById("countryA").value);
const b = data.find(d => d.Country === document.getElementById("countryB").value);
const metrics = ['GDP', 'HDI', 'Carbon', 'Eco', 'Bio', 'Earths'];

let html = `<table class="comparison-table"><thead><tr><th>Metric</th><th>${a.Country}</th><th>${b.Country}</th></tr></thead><tbody>`;
metrics.forEach(key => {
html += `<tr><td>${key}</td><td>${a[key] ?? 'N/A'}</td><td>${b[key] ?? 'N/A'}</td></tr>`;
});
html += `</tbody></table>`;
document.getElementById("compare-output").innerHTML = html;
updateRadar(a, b);
}

document.getElementById("countryA").addEventListener("change", updateComparison);
document.getElementById("countryB").addEventListener("change", updateComparison);
updateComparison();
