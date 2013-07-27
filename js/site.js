/********************************************************
*                                                       *
*   dj.js example using Yelp Kaggle Test Dataset        *
*   Eamonn O'Loughlin 9th May 2013                      *
*                                                       *
********************************************************/
 
/********************************************************
*                                                       *
*   Step0: Load data from json file                     *
*                                                       *
********************************************************/
d3.json("data.json", function (test_data) {
     
/********************************************************
*                                                       *
*   Step1: Create the dc.js chart objects & ling to div *
*                                                       *
********************************************************/
var bubbleChart = dc.bubbleChart("#dc-bubble-graph");
var pieChart = dc.pieChart("#dc-pie-graph");
var volumeChart = dc.barChart("#dc-volume-chart");
var lineChart = dc.lineChart("#dc-line-chart");
var dataTable = dc.dataTable("#dc-table-graph");
var rowChart = dc.rowChart("#dc-row-graph");
 
/********************************************************
*                                                       *
*   Step2:  Run data through crossfilter                *
*                                                       *
********************************************************/
var ndx = crossfilter(test_data);
     
/********************************************************
*                                                       *
*   Step3:  Create Dimension that we'll need            *
*                                                       *
********************************************************/

/*
    {
        "ClientID": "1",
        "Date": "7/1/2012",
        "location": "Neighborhood 1",
        "q1": "1",
        "q2": "1",
        "q3": "1",
        "q4": "1",
        "q5": "1",
        "q6": "1",
        "q7": "1",
        "q8": "1",
        "q9": "1",
        "q10": "This is my comment."
    }
*/
 
    // for volumechart
    var locDimension = ndx.dimension(function (d) { return d.location; });
    var locGroup = locDimension.group();
    var locDimensionGroup = locDimension.group().reduce(
        //add
        function(p,v){
            ++p.count;
            p.overall += (v.q1 + v.q2 + v.q3 + v.q4 + v.q5 + v.q6 + v.q7 + v.q8 + v.q9);
            p.q1_sum += v.q1;
            p.overall_avg = p.overall / p.count;
            p.q1_avg = p.q1_sum / p.count;
            return p;
        },
        //remove
        function(p,v){
            --p.count;
            p.overall -= (v.q1 + v.q2 + v.q3 + v.q4 + v.q5 + v.q6 + v.q7 + v.q8 + v.q9);
            p.q1_sum -= v.q1;
            p.overall_avg = p.overall / p.count;
            p.q1_avg = p.q1_sum / p.count;
            return p;
        },
        //init
        function(p,v){
            return {count:0, overall: 0, q1_sum: 0, overall_avg: 0, q1_avg: 0};
        }
    );
 
    // for pieChart
    var startValue = ndx.dimension(function (d) {
        return d.q1*1.0;
    });
    var startValueGroup = startValue.group();
 
    // For datatable
    var businessDimension = ndx.dimension(function (d) { return d.ClientID; });
/********************************************************
*                                                       *
*   Step4: Create the Visualisations                    *
*                                                       *
********************************************************/
     
 bubbleChart.width(650)
            .height(300)
            .dimension(locDimension)
            .group(locDimensionGroup)
            .transitionDuration(1500)
            .colors(["#a60000","#ff0000", "#ff4040","#ff7373","#67e667","#39e639","#00cc00"])
            .colorDomain([-12000, 12000])
         
            .x(d3.scale.linear().domain([0, 5.5]))
            .y(d3.scale.linear().domain([0, 5.5]))
            .r(d3.scale.linear().domain([0, 2500]))
            .keyAccessor(function (p) {
                return p.value.q1_avg;
            })
            .valueAccessor(function (p) {
                return p.value.overall_avg;
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
            .renderlet(function (chart) {
                rowChart.filter(chart.filter());
            })
            .on("postRedraw", function (chart) {
                dc.events.trigger(function () {
                    rowChart.filter(chart.filter());
                });
                        });
            ;
 
 
pieChart.width(200)
        .height(200)
        .transitionDuration(1500)
        .dimension(startValue)
        .group(startValueGroup)
        .radius(90)
        .minAngleForLabel(0)
        .label(function(d) { return d.data.key; })
        .on("filtered", function (chart) {
            dc.events.trigger(function () {
                if(chart.filter()) {
                    console.log(chart.filter());
                    volumeChart.filter([chart.filter()-.25,chart.filter()-(-0.25)]);
                    }
                else volumeChart.filterAll();
            });
        });
 
volumeChart.width(230)
            .height(200)
            .dimension(startValue)
            .group(startValueGroup)
            .transitionDuration(1500)
            .centerBar(true)    
            .gap(17)
            .x(d3.scale.linear().domain([0.5, 5.5]))
            .elasticY(true)
            .on("filtered", function (chart) {
                dc.events.trigger(function () {
                    if(chart.filter()) {
                        console.log(chart.filter());
                        lineChart.filter(chart.filter());
                        }
                    else
                    {lineChart.filterAll()}
                });
            })
            .xAxis().tickFormat(function(v) {return v;});   
 
console.log(startValueGroup.top(1)[0].value);
 
lineChart.width(230)
        .height(200)
        .dimension(startValue)
        .group(startValueGroup)
        .x(d3.scale.linear().domain([0.5, 5.5]))
        .valueAccessor(function(d) {
            return d.value;
            })
            .renderHorizontalGridLines(true)
            .elasticY(true)
            .xAxis().tickFormat(function(v) {return v;});   ;
 
rowChart.width(340)
            .height(850)
            .dimension(locDimension)
            .group(locGroup)
            .renderLabel(true)
            .colors(["#a60000","#ff0000", "#ff4040","#ff7373","#67e667","#39e639","#00cc00"])
            .colorDomain([0, 0])
            .renderlet(function (chart) {
                bubbleChart.filter(chart.filter());
            })
            .on("filtered", function (chart) {
                dc.events.trigger(function () {
                    bubbleChart.filter(chart.filter());
                });
                        });
 
 
dataTable.width(800).height(800)
    .dimension(businessDimension)
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
/********************************************************
*                                                       *
*   Step6:  Render the Charts                           *
*                                                       *
********************************************************/
             
    dc.renderAll();
});