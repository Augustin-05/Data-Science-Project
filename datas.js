d3.csv("countries.csv").then(data => {
    data.forEach(d => {
      d.Carbon_Footprint = +d.Carbon_Footprint;
      d.GDP_per_Capita = +d.GDP_per_Capita;
      d.ratio = d.Carbon_Footprint / d.GDP_per_Capita;
    });
  
    const avgRatio = d3.mean(data, d => d.ratio);
  
    // Dégradé de couleur basé sur le ratio CO₂/PIB
    const colorScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.ratio), avgRatio, d3.max(data, d => d.ratio)])
      .range(["green", "orange", "red"]);
  
    const svg = d3.select("#ecochart"),
          margin = { top: 30, right: 20, bottom: 120, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleBand()
      .domain(data.map(d => d.Country))
      .range([0, width])
      .padding(0.2);
  
    const y = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.Carbon_Footprint) * 1.1,
        d3.max(data, d => d.Carbon_Footprint) * 1.1
      ])
      .range([height, 0]);
  
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  
    chart.append("g")
      .call(d3.axisLeft(y));
  
    // Barres avec couleur dynamique selon le ratio
    chart.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Country))
      .attr("y", d => y(Math.max(0, d.Carbon_Footprint)))
      .attr("height", d => Math.abs(y(d.Carbon_Footprint) - y(0)))
      .attr("width", x.bandwidth())
      .attr("fill", d => colorScale(d.ratio))
      .on("click", function(event, d) {
        d3.select("#info").html(`
          <strong>${d.Country}</strong><br>
          Empreinte carbone : ${d.Carbon_Footprint.toFixed(2)}<br>
          PIB par habitant : $${d.GDP_per_Capita.toLocaleString()}<br>
          Ratio CO₂/PIB : ${d.ratio.toFixed(4)}
        `);
      });
  
    chart.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "black");
  });
  
  