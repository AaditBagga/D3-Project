document.addEventListener('DOMContentLoaded', function() {
    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = d3.csvParse(text, d3.autoType); // Using autoType for proper type conversion
                drawChart(data);
            };
            reader.readAsText(file);
        }
    }

    function drawChart(data) {
        // Setup dimensions and margins.
        const margin = {top: 20, right: 30, bottom: 30, left: 40},
            width = 928 - margin.left - margin.right,
            height = 720 - margin.top - margin.bottom;

        // Append the svg object to the div called 'chart'.
        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Add a group element that contains the elements to be drawn.
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Setup scales
        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        // Define the zoom behavior.
        const zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [width + 90, height + 100]])
            .on("zoom", zoomed);

        // Setup the axes.
        const xAxis = g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`);
        const yAxis = g.append("g")
            .attr("class", "y axis");

        // Setup the line.
        const line = d3.line()
            .curve(d3.curveCatmullRom)
            .x(d => x(d.miles))
            .y(d => y(d.gas));

        // Apply the zoom behavior to the svg.
        svg.call(zoom);

        function resetZoom() {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }

        svg.on("dblclick.zoom", resetZoom);

        // Function that updates the chart when zoomed.
        function zoomed(event) {
            const {transform} = event;
            const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
            const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
            g.selectAll('.line').attr("d", line);
            g.selectAll('circle').attr("cx", d => zx(d.miles)).attr("cy", d => zy(d.gas));
            g.selectAll('.label').attr("x", d => zx(d.miles)).attr("y", d => zy(d.gas));
            xAxis.call(d3.axisBottom(zx));
            yAxis.call(d3.axisLeft(zy));
        }

        // Load the data and draw the chart.
        x.domain(d3.extent(data, d => d.miles)).nice();
        y.domain(d3.extent(data, d => d.gas)).nice();

        // Draw the line path.
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("class", "line")
            .attr("d", line);

        // Draw the points.
        g.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", d => x(d.miles))
            .attr("cy", d => y(d.gas))
            .attr("r", 3);

        // Draw the labels.
        g.selectAll(".label")
            .data(data)
            .join("text")
            .attr("class", "label")
            .attr("x", d => x(d.miles))
            .attr("y", d => y(d.gas))
            .text(d => d.year)
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("opacity", 0) // Start the labels as invisible
            .each(function(d) {
                // Position labels based on the 'side' property.
                const t = d3.select(this);
                t.attr("text-anchor", getAnchor(d.side))
                 .attr("dx", getDx(d.side))
                 .attr("dy", getDy(d.side));
            });

        // Function to determine text-anchor based on the 'side' property.
        function getAnchor(side) {
            if (side === 'right') return "start";
            if (side === 'left') return "end";
            return "middle";
        }

        // Function to determine dx based on the 'side' property.
        function getDx(side) {
            if (side === 'right') return "0.5em";
            if (side === 'left') return "-0.5em";
            return 0;
        }

        // Function to determine dy based on the 'side' property.
        function getDy(side) {
            if (side === 'top') return "-0.7em";
            if (side === 'bottom') return "1.4em";
            return "0.32em";
        }

        // Fade in the labels after the transition.
        g.selectAll(".label")
            .transition()
            .duration(5000)
            .attr("opacity", 1);

        // Draw the axes.
        xAxis.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        yAxis.call(d3.axisLeft(y).ticks(null, "$.2f").tickSizeOuter(0));

        // Label the axes.
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
    }

    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
});
