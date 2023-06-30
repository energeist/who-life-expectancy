// Question 3: Is there a correlation between vaccination rates for one-year-olds against polio and death rates in children under five years old?

// No, there does not seem to be a strong correlation and increased mortality rates among children under 5YO probably has a different root cause

// Just using year 2000 data for this one - dataset is a mess and had lots of numbers that were incorrect/out of place


async function loadMap() {
  let data = await d3.csv('../who-life-expectancy.csv');

  data.map(d => {
    d.year = +d.year;
    d.lifeExpectancy = +d.lifeExpectancy;
    d.population = +d.population;
    d.polio = +d.polio
    d.underFiveDeaths = +d.underFiveDeaths;
    d.infantDeaths = +d.infantDeaths;
    d.country = d.country;
  });

  const years = [...new Set(data.map(d => d.year))].reverse();
  const dataByYear = {};
  years.forEach(year => {
    dataByYear[year] = data.filter(d => d.year === year && d.lifeExpectancy && (d.population > 0) && d.underFiveDeaths && d.polio)
  });

  // Define some variables for width and height
  const width = 1300;
  const height = 700;

  // Set up SVG
  const svg = d3.select('#svg')
    .attr('width', width)
    .attr('height', height);

  // Make a group to hold the chart
  const g = svg.append('g');

  const xExtent = d3.extent(data, d => d.polio);
  const yExtent = d3.extent(data, d => d.underFiveDeaths);
  const rExtent = d3.extent(data, d => d.population);

  const xScale = d3.scaleLinear()
    .domain(xExtent)
    .range([100, 1200]);
  
  const yScale = d3.scaleLinear()
    .domain(yExtent) 
    .range([600, 100]);

  const popScale = d3.scaleSqrt()
    .domain(rExtent)
    .range([0, 300])
    
  // Add chart title
  const chartTitle = svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '24px')
    .text('');

  const minPolio = xExtent[0];
  const maxPolio = xExtent[1];
  const minUnderFiveDeaths = yExtent[0];
  const maxUnderFiveDeaths = yExtent[1];
  
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  function update(year) {
    filteredData = dataByYear[year];

    filteredData.sort((a,b) => b.underFiveDeaths - a.underFiveDeaths)
    modifiedData = filteredData.slice(0,15).map(d => ({
      ...d,
      unvaccinatedPolio: 100 - d.polio // number in original dataset is vaccination rate, let's change to unvaccinated rate
    }))

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRainbow)
      .domain([0, modifiedData.length])

    chartTitle.text(`Vaccination rate of one-year-olds against polio vs. under-five mortality rate in ${year}`);
    
    svg
      .style('border', '1px solid')

    circles = g.selectAll('circle')
      .data(modifiedData)
    
    circles
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.unvaccinatedPolio))
      .attr('cy', d => yScale(d.underFiveDeaths))
      .attr('opacity', 0.35)
      .attr('r', d => popScale(d.population))
      .attr('fill', (d, i) => colorScale(i))
      .on("mouseover", function(d) {
        var coords = d3.pointer(event)
        console.log(d)
        tooltip.transition()
          .duration(200)
          .style("opacity", .8);
        tooltip.html(
            `Country: ${d.target.__data__.country}
            <br>1YO children unvaccinated vs polio: ${d.target.__data__.unvaccinatedPolio}%
            <br>Mortality rate of < 5YO children per 1000 pop.: ${d.target.__data__.underFiveDeaths}
            <br>Population: ${d.target.__data__.population}
          `)
          .style("left", (coords[0] + 15) + "px")
          .style("top", (coords[1] + 15) + "px");
      })
      .on("mousemove", function(d) {
        coords = d3.pointer(event)
        tooltip.style("left", (coords[0] + 15) + "px")
          .style("top", (coords[1] + 15) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  let currentYearIndex = 0;
  update(years[currentYearIndex]);
}

loadMap();