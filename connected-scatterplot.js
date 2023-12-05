document.addEventListener('DOMContentLoaded', function() {
    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = d3.csvParse(text, d3.autoType); // Use autoType for proper type conversion
                drawChart(data);
            };
            reader.readAsText(file);
        }
    }

    function drawChart(data) {
        const width = 928;
        const height = 720;
        const marginTop = 20;
        const marginRight = 30;
        const marginBottom = 30;
        const marginLeft = 40;

        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.miles)).nice()
            .range([marginLeft, width - marginRight]);

        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d.gas)).nice()
            .range([height - marginBottom, marginTop]);

        const svg = d3.select("#chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        const line = d3.line()
            .curve(d3.curveCatmullRom)
            .x(d => x(d.miles))
            .y(d => y(d.gas));

        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80))
            .call(g => g.append("text")
                .attr("x", width - marginRight)
                .attr("y", marginBottom - 4)
                .attr("fill", "currentColor")
                .attr("text-anchor", "end")
                .text("Miles per person per year"));

        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).ticks(null, "$.2f"))
            .call(g => g.append("text")
                .attr("x", 4)
                .attr("y", marginTop)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("Cost per gallon"));

        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);

        const totalLength = path.node().getTotalLength();

        path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(5000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", d => x(d.miles))
            .attr("cy", d => y(d.gas))
            .attr("r", 3);

        const labels = svg.selectAll("text.label")
            .data(data)
            .join("text")
            .attr("class", "label")
            .attr("x", d => x(d.miles))
            .attr("y", d => y(d.gas))
            .text(d => d.year)
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("fill-opacity", 0)
            .each(function(d) {
                switch (d.side) {
                    case "top": d3.select(this).attr("dy", "-0.7em").attr("text-anchor", "middle"); break;
                    case "right": d3.select(this).attr("dx", "0.5em").attr("text-anchor", "start"); break;
                    case "bottom": d3.select(this).attr("dy", "1.4em").attr("text-anchor", "middle"); break;
                    case "left": d3.select(this).attr("dx", "-0.5em").attr("text-anchor", "end"); break;
                }
            });

        labels.transition()
            .duration(5000)
            .delay((d, i) => (totalLength * i / data.length) / totalLength * 5000)
            .attr("fill-opacity", 1);
    }

    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
});
