// Load data, set variables 

d3.json("data.json", function (data) {
     
    var bubbleChart = dc.bubbleChart("#dc-bubble-graph");
    var q1pieChart = dc.pieChart("#q1-pie-graph");
    var q2pieChart = dc.pieChart("#q2-pie-graph");
    var q3pieChart = dc.pieChart("#q3-pie-graph");
    // var volumeChart = dc.barChart("#dc-volume-chart");
    // var lineChart = dc.lineChart("#dc-line-chart");
    var dataTable = dc.dataTable("#dc-table-graph");
    var overallLineChart = dc.lineChart("#overall-line-chart");
         

    // Setting dimensions 
    // Data fields: 
    //      ClientID, Date (m/d/y), location, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10

    var dateFormat = d3.time.format("%m/%d/%Y");
    data.forEach(function(e) { e.dd = dateFormat.parse(e.Date); });

    // add data to crossfilter 
    var ndx = crossfilter(data);

    // define group all for counting
    var all = ndx.groupAll();

/* Define dimensions and group */
    // Overall by month
    var overallByMonth = ndx.dimension(function(d) {return d3.time.day(d.dd);}),
        overallByMonthGroup = overallByMonth.group().reduceSum(function(d) {
            var overall = d.q1 + d.q2 + d.q3 + d.q4 + d.q5 + d.q6 + d.q7 + d.q8 + d.q9; 
            return overall; 
        });

    // Overall by Neighborhood
    var overallByNeighborhood = ndx.dimension(function(d){return d.location;}),
        overallByNeighborhoodGroup = overallByNeighborhood.group().reduce(
            //add
            function (p, v) {
                ++p.count;
                p.overall += v.q1 + v.q2 + v.q3 + v.q4 + v.q5 + v.q6 + v.q7 + v.q8 + v.q9;
                p.overall_avg = p.overall / p.count;
                return p;
            },
            //remove
            function (p, v) {
                --p.count;
                p.overall -= d.q1 + d.q2 + d.q3 + d.q4 + d.q5 + d.q6 + d.q7 + d.q8 + d.q9;
                p.overall_avg = p.overall / p.count;
                return p;
            },
            //init
            function () {
                return {count: 0, overall: 0, overall_avg: 0};
            }
        );        

    // High Low Pie charts
    var q1highLow = ndx.dimension(function(d) {
        return +d.q1 > 3 ? "Low" : "High"; }),
        q1highLowGroup = q1highLow.group();

    var q2highLow = ndx.dimension(function(d) {
        return +d.q2 > 3 ? "Low" : "High"; }),
        q2highLowGroup = q2highLow.group();

    var q3highLow = ndx.dimension(function(d) {
        return +d.q3 > 3 ? "Low" : "High"; }),
        q3highLowGroup = q3highLow.group();                

/* Build Charts */

overallLineChart.width(650) // (optional) define chart width, :default = 200
    .height(300) // (optional) define chart height, :default = 200
    .transitionDuration(500) // (optional) define chart transition duration, :default = 500
    .dimension(overallByMonth) // set dimension
    .group(overallByMonthGroup) // set group
    // (optional) whether chart should rescale x axis to fit data, :default = false
    .x(d3.time.scale().domain([new Date(2012, 6, 1), new Date(2012, 7, 19)]))
    // (optional) set filter brush rounding
    .round(d3.time.day.round)
    // define x axis units
    .xUnits(d3.time.days)
    // (optional) render horizontal grid lines, :default=false
    .renderArea(true)
    // (optional) add stacked group and custom value retriever
    .brushOn(true)
    // (optional) whether dot and title should be generated on the line using
    // the given function, :default=no
    .renderTitle(true)
    // (optional) radius used to generate title dot, :default = 5
    .dotRadius(8);

bubbleChart.width(650)
    .height(300)
    .dimension(overallByNeighborhood)
    .group(overallByNeighborhoodGroup)
    .transitionDuration(1500)
    .colors(["#a60000","#ff0000", "#ff4040","#ff7373","#67e667","#39e639","#00cc00"])
    .colorDomain([-12000, 12000])

    .x(d3.scale.linear().domain([25, 30]))
    .y(d3.scale.linear().domain([0, 100]))
    .r(d3.scale.linear().domain([0, 500]))
    .keyAccessor(function (p) {
        return p.value.overall_avg;
    })
    .valueAccessor(function (p) {
        return p.value.overall;
    })
    .radiusValueAccessor(function (p) {
        return p.value.count;
    })
    .transitionDuration(1500)
    .elasticY(true)
    .yAxisPadding(1)
    .xAxisPadding(1)
    .label(function (p) {
        return p.key;
        })
    .renderLabel(true)
    ;

q1pieChart.width(180)
    .height(180)
    .radius(80)
    .dimension(q1highLow)
    .group(q1highLowGroup)
    .label(function (d) {
        if(q1pieChart.hasFilter() && !pieChart.hasFilter(d.data.key))
            return d.data.key + "(0%)";
        return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)";
    });

q2pieChart.width(180)
    .height(180)
    .radius(80)
    .dimension(q2highLow)
    .group(q2highLowGroup)
    .label(function (d) {
        if(q2pieChart.hasFilter() && !pieChart.hasFilter(d.data.key))
            return d.data.key + "(0%)";
        return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)";
    });

q3pieChart.width(180)
    .height(180)
    .radius(80)
    .dimension(q3highLow)
    .group(q3highLowGroup)
    .label(function (d) {
        if(q3pieChart.hasFilter() && !pieChart.hasFilter(d.data.key))
            return d.data.key + "(0%)";
        return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)";
    });    

// Data table    
dataTable.width(800).height(800)
    .dimension(overallByNeighborhood)
    .group(function(d) { return "List of all Restaurants"})
    .size(100)
    .columns([
        function(d) { return 'Restaurant ' + d.ClientID; },
        function(d) { return d.location; },
        function(d) { return d.q1; },
        function(d) { 
            var overall = d.q1 + d.q2 + d.q3 + d.q4 + d.q5 + d.q6 + d.q7 + d.q8 + d.q9;
            return overall; },
        function(d) { return d.q10; }
    ])
    .sortBy(function(d){ 
                var overall = d.q1 + d.q2 + d.q3 + d.q4 + d.q5 + d.q6 + d.q7 + d.q8 + d.q9;
                return overall;
            })
    // (optional) sort order, :default ascending
    .order(d3.descending);        



    // Formatting charts
    dc.renderAll();
});