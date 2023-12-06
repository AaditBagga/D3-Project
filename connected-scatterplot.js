document.addEventListener('DOMContentLoaded', function() {
    let svg, x, y, xAxis, yAxis, line, highlightLine, tooltip, zoom;

    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = d3.csvParse(text, d3.autoType);
                initializeChart(data);
                initializeSliders(data);
            };
            reader.readAsText(file);
        }
    }

    function initializeSliders(data) {
        const years = data.map(d => d.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const startYearInput = d3.select('#startYear');
        const endYearInput = d3.select('#endYear');
        const startYearLabel = d3.select('#startYearLabel');
        const endYearLabel = d3.select('#endYearLabel');

        startYearInput
            .attr('min', minYear)
            .attr('max', maxYear)
            .attr('value', minYear)
            .on('input', function() {
                startYearLabel.text(this.value);
                updateHighlight(data, this.value, endYearInput.property('value'));
            });

        endYearInput
            .attr('min', minYear)
            .attr('max', maxYear)
            .attr('value', maxYear)
            .on('input', function() {
                endYearLabel.text(this.value);
                updateHighlight(data, startYearInput.property('value'), this.value);
            });

        startYearLabel.text(startYearInput.property('value'));
        endYearLabel.text(endYearInput.property('value'));
    }

    function updateHighlight(data, startYear, endYear) {
        const highlightedData = data.filter(d => d.year >= startYear && d.year <= endYear);
        highlightLine
            .datum(highlightedData)
            .attr("d", line);
    }

    function getColor(data, index) {
        if (index === 0) return "black"; // Default color for the first point
    
        const deltaMiles = data[index].miles - data[index - 1].miles;
        const deltaGas = data[index].gas - data[index - 1].gas;
    
        // Example color coding (you can modify this logic based on your color mapping strategy)
        if (deltaMiles > 0 && deltaGas > 0) return "green"; // Both increased
        if (deltaMiles < 0 && deltaGas < 0) return "red";   // Both decreased
        if (deltaMiles > 0 && deltaGas < 0) return "blue";  // Miles increased, Gas decreased
        if (deltaMiles < 0 && deltaGas > 0) return "orange";// Miles decreased, Gas increased
        return "grey"; // No significant change
    }
    

    function initializeChart(data) {
        const margin = { top: 20, right: 30, bottom: 30, left: 40 },
              width = 928 - margin.left - margin.right,
              height = 720 - margin.top - margin.bottom;

        svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        x = d3.scaleLinear().range([0, width]);
        y = d3.scaleLinear().range([height, 0]);

        xAxis = g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`);
        yAxis = g.append("g")
            .attr("class", "y axis");

        line = d3.line()
            .curve(d3.curveCatmullRom)
            .x(d => x(d.miles))
            .y(d => y(d.gas));

        zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [width + 90, height + 100]])
            .on("zoom", zoomed);

        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("text-align", "center")
            .style("width", "120px")
            .style("height", "42px")
            .style("padding", "2px")
            .style("font", "12px sans-serif")
            .style("background", "lightsteelblue")
            .style("border", "0px")
            .style("border-radius", "8px")
            .style("pointer-events", "none");

        svg.call(zoom);

        function resetZoom() {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }

        svg.on("dblclick.zoom", resetZoom);

        x.domain(d3.extent(data, d => d.miles)).nice();
        y.domain(d3.extent(data, d => d.gas)).nice();

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("class", "line")
            .attr("d", line);

        highlightLine = g.append("path")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("class", "highlight-line");

        g.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", (d, i) => getColor(data, i))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", d => x(d.miles))
            .attr("cy", d => y(d.gas))
            .attr("r", 3)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        g.selectAll(".label")
            .data(data)
            .join("text")
            .attr("class", "label")
            .attr("x", d => x(d.miles))
            .attr("y", d => y(d.gas))
            .text(d => d.year)
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("opacity", 0)
            .each(function(d) {
                const t = d3.select(this);
                t.attr("text-anchor", getAnchor(d.side))
                 .attr("dx", getDx(d.side))
                 .attr("dy", getDy(d.side));
            });

        g.selectAll(".label")
            .transition()
            .duration(5000)
            .attr("opacity", 1);

        xAxis.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        yAxis.call(d3.axisLeft(y).ticks(null, "$.2f").tickSizeOuter(0));

        xAxis.append("text")
            .attr("fill", "currentColor")
            .attr("x", width)
            .attr("dy", "-0.5em")
            .attr("text-anchor", "end")
            .text("Miles per person per year");

        yAxis.append("text")
            .attr("fill", "currentColor")
            .attr("transform", "rotate(-90)")
            .attr("y", 15)
            .attr("dy", "0.75em")
            .attr("text-anchor", "end")
            .text("Cost per gallon");

        updateHighlight(data, d3.min(data, d => d.year), d3.max(data, d => d.year));
    }

    function zoomed(event) {
        const { transform } = event;
        const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
        svg.selectAll('.line').attr("d", line);
        svg.selectAll('.highlight-line').attr("d", highlightLine.attr("d"));
        svg.selectAll('circle').attr("cx", d => zx(d.miles)).attr("cy", d => zy(d.gas));
        svg.selectAll('.label').attr("x", d => zx(d.miles)).attr("y", d => zy(d.gas));
        xAxis.call(d3.axisBottom(zx));
        yAxis.call(d3.axisLeft(zy));
    }

    function mouseover(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html("Year: " + d.year + "<br/>Miles: " + d.miles.toFixed(2) + "<br/>Cost: $" + d.gas.toFixed(2))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function mouseout() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
});

function getAnchor(side) {
    if (side === 'right') return "start";
    if (side === 'left') return "end";
    return "middle";
}

function getDx(side) {
    if (side === 'right') return "0.5em";
    if (side === 'left') return "-0.5em";
    return 0;
}

function getDy(side) {
    if (side === 'top') return "-0.7em";
    if (side === 'bottom') return "1.4em";
    return "0.32em";
}
