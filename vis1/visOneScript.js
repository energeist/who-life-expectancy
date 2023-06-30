// Question 1: Can we visualize how global life expectancies have changed between 2000-2015?
// We can see that life expectancies among countries in the developed world are largely static but those
// in the developing world tend to shift over time.

// Question 2: Which countries have the highest average life expectancies?  Which countries have the lowest?
// From the map we can see that countries like Canada, Japan, Australia and the Scandinavian countries 
// have the highest average life expectancies, while countries in sub-Saharan Africa have the lowest average 
// life expectancies.

async function loadMap() {
  let data = await d3.csv('../who-life-expectancy.csv');

  data.map(d => {
    d.year = +d.year;
    d.lifeExpectancy = +d.lifeExpectancy;
  })

  const years = [...new Set(data.map(d => d.year))].reverse();
  const dataByYear = {};
  years.forEach(year => {
    dataByYear[year] = data.filter(d => d.year === year && d.lifeExpectancy)
  })

  // Define some variables for width and height
  const width = 1600
  const height = 950

  // Set up SVG
  const svg = d3.select('#svg')
    .attr('width', width)
    .attr('height', height);

  // Make a group to hold the map
  const g = svg.append('g');

  // Define a projection
  const projection = d3.geoMercator()
    .center([-50, 70])
    .scale(200)
    .rotate([0, 0]);

  // Create a path
  const path = d3.geoPath()
    .projection(projection);

  const topology = await d3.json('world-110m2.json');

  // Add chart title
  const chartTitle = svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '24px')
    .text('');
  
  function update(year) {
    data = dataByYear[year];

    const minLifeExpectancy = d3.min(data, d => d.lifeExpectancy);
    const maxLifeExpectancy = d3.max(data, d => d.lifeExpectancy);

    // Color scale 
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain([maxLifeExpectancy, minLifeExpectancy]);

    yearData = dataByYear[year];

    // Update existing paths
    paths = g.selectAll('path')
      .data(topology.features)

    // Remove paths that are no longer needed
    paths.exit().remove();

    // Append new paths for the enter selection
    paths.enter()
      .append('path')
      .attr("transform", `translate(0, 50)`)
      .attr('d', path)
      .attr('fill', 'gray')
      .attr('stroke', 'white')
      .attr('stroke-width', 0.25)
      .merge(paths)
      .transition()
      .duration(1000)
      .attr('fill', (d) => {
          const countryData = yearData.find((item) => item.country === d.properties.name);
          if (countryData) {
            return colorScale(countryData.lifeExpectancy);
          }
          return 'gray';
        })
      .attr('stroke', 'white')
      .attr('stroke-width', 0.25)

    chartTitle.text(`WHO life expectancy by country for the year ${year}`);
    
    // Add a legend
    if (year === 2000) {
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 200}, ${height - 300})`);
    
      const legendScale = d3.scaleLinear()
        .domain([minLifeExpectancy, maxLifeExpectancy])
        .range([0, 200])
        .nice();
    
      const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickSize(0)
        .tickPadding(30);
    
      legend.append("g")
        .call(legendAxis);
    
      legend.append("rect")
        .attr("width", 20)
        .attr("height", 200)
        .attr("fill", "url(#legend-gradient)");
    
      // Create gradient for the legend
      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("gradientTransform", "rotate(90)");
    
      gradient.append("stop")
        .attr("offset", "15%")
        .attr("stop-color", colorScale.range()[1]);
    
      gradient.append("stop")
        .attr("offset", "85%")
        .attr("stop-color", colorScale.range()[0]);

      // Add legend title
      const legendTitle = svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width - 190)
        .attr('y', height - 330)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .text('Average life expectancy');
    }
  }

  let currentYearIndex = 0;
  update(years[currentYearIndex]);

  const interval = setInterval(() => {
    currentYearIndex++;
    if (currentYearIndex < years.length) {
      update(years[currentYearIndex]);
    } else {
      clearInterval(interval);
    }
  }, 2500);
}

loadMap();