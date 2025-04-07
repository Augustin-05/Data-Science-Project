const dimensions = [
  { key: "HDI", label: "HDI", max: 1 },
  { key: "GDP_per_Capita", label: "GDP per Capita", max: 80000 },
  { key: "Carbon_Footprint", label: "CO₂ Footprint", max: 12 },
  { key: "Total_Ecological_Footprint", label: "Total Footprint", max: 12 },
  { key: "Total_Biocapacity", label: "Biocapacity", max: 10 },
  { key: "Earths_Required", label: "Earths Needed", max: 6 }
];

const svg = d3.select("#radarChart"),
      width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2 - 60,
      center = { x: width / 2, y: height / 2 };

const angleSlice = (2 * Math.PI) / dimensions.length;

function drawRadar(countryData) {
  svg.selectAll("*").remove();

  // Axes
  dimensions.forEach((dim, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const end = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };

    svg.append("line")
      .attr("x1", center.x).attr("y1", center.y)
      .attr("x2", end.x).attr("y2", end.y)
      .attr("stroke", "#ccc");

    svg.append("text")
      .attr("x", end.x).attr("y", end.y)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text(dim.label);
  });

  // Points
  const radarPoints = dimensions.map((dim, i) => {
    const value = parseFloat(countryData[dim.key]);
    const scaled = d3.scaleLinear().domain([0, dim.max]).range([0, radius])(value);
    const angle = i * angleSlice - Math.PI / 2;
    return [
      center.x + scaled * Math.cos(angle),
      center.y + scaled * Math.sin(angle)
    ];
  });

  svg.append("polygon")
    .attr("points", radarPoints.map(p => p.join(",")).join(" "))
    .attr("class", "radar-area");
}

// Load CSV using your actual dataset
d3.csv("countries.csv").then(data => {
  const select = d3.select("#countrySelect");
  data.forEach(d => {
    select.append("option")
      .attr("value", d.Country)
      .text(d.Country);
  });

  drawRadar(data[0]); // initial

  select.on("change", function() {
    const selected = this.value;
    const countryData = data.find(d => d.Country === selected);
    drawRadar(countryData);
  });
});
