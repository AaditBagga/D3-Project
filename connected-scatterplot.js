document.addEventListener('DOMContentLoaded', function() {
    let svg, x, y, xAxis, yAxis, line, tooltip, isDrivingData, dataFields;

    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = d3.csvParse(text, d3.autoType);
                isDrivingData = data[0].hasOwnProperty('miles') && data[0].hasOwnProperty('gas');
                dataFields = isDrivingData ? { x: 'miles', y: 'gas', label: 'year' } : { x: 'Revenue', y: 'Expenses', label: 'Year' };
                initializeChart(data);
            };
            reader.readAsText(file);
        }
    }


    function getColor(data, index) {
        if (index === 0) return "grey"; 
        const current = data[index];
        const previous = data[index - 1];
        const deltaMiles = current[dataFields.x] - previous[dataFields.x];
        const deltaGas = current[dataFields.y] - previous[dataFields.y];
    
        if (deltaMiles > 0 && deltaGas > 0) return "green";
        if (deltaMiles < 0 && deltaGas < 0) return "red";
        if (deltaMiles > 0 && deltaGas < 0) return "blue";
        if (deltaMiles < 0 && deltaGas > 0) return "orange";
        return "grey";
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
            .x(d => x(d[dataFields.x]))
            .y(d => y(d[dataFields.y]));


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

        x.domain(d3.extent(data, d => d[dataFields.x])).nice();
        y.domain(d3.extent(data, d => d[dataFields.y])).nice();

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("class", "line")
            .attr("d", line);

        g.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", (d, i) => getColor(data, i))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", d => x(d[dataFields.x]))
            .attr("cy", d => y(d[dataFields.y]))
            .attr("r", 3)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        g.selectAll(".label")
            .data(data)
            .join("text")
            .attr("class", "label")
            .attr("x", d => x(d[dataFields.x]+10))
            .attr("y", d => y(d[dataFields.y]))
            .text(d => d[dataFields.label])
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("opacity", 0)



        g.selectAll(".label")
            .transition()
            .duration(5000)
            .attr("opacity", 1);

        xAxis.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        yAxis.call(d3.axisLeft(y).ticks(null, isDrivingData ? "$.2f" : ".2f"));

        xAxis.append("text")
            .attr("fill", "currentColor")
            .attr("x", width)
            .attr("dy", "-0.5em")
            .attr("text-anchor", "end")
            .text(isDrivingData ? "Miles per person per year" : "Revenue (millions)");

        yAxis.append("text")
            .attr("fill", "currentColor")
            .attr("transform", "rotate(-90)")
            .attr("y", 15)
            .attr("dy", "0.75em")
            .attr("text-anchor", "end")
            .text(isDrivingData ? "Cost per gallon" : "Expenses (millions)");
        
        addLegend(isDrivingData, width);

    }

    function addLegend(isDrivingData, width) {
        const legendData = isDrivingData ? [
            { color: "green", description: "Both Increased" },
            { color: "red", description: "Both Decreased" },
            { color: "blue", description: "Miles Increased, Gas Decreased" },
            { color: "orange", description: "Miles Decreased, Gas Increased" },
            { color: "grey", description: "No Significant Change" }
        ] : [
            { color: "green", description: "Both Increased" },
            { color: "red", description: "Both Decreased" },
            { color: "blue", description: "Revenue Increased, Expenses Decreased" },
            { color: "orange", description: "Revenue Decreased, Expenses Increased" },
            { color: "grey", description: "No Significant Change" }
        ];

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 350},${20})`);

        legend.selectAll("legend-entries")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-entry")
            .each(function(d, i) {
                const g = d3.select(this);
                g.append("rect")
                    .attr("x", 0)
                    .attr("y", i * 25)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", d.color);

                g.append("text")
                    .attr("x", 30)
                    .attr("y", i * 25 + 15)
                    .attr("text-anchor", "start")
                    .text(d.description)
                    .attr("font-size", "12px");
            });
    }

    function mouseover(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html("Year: " + d[dataFields.label] + "<br/>" + 
                     dataFields.x + ": " + d[dataFields.x].toFixed(2) + "<br/>" + 
                     dataFields.y + ": " + d[dataFields.y].toFixed(2))
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
