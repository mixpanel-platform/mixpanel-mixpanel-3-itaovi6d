//dashboard queries
$(document).on('ready', function() {
    //for debugging
    $('a').on('click', function(c) {
        c.preventDefault();
        console.log('button "' + c.toElement.id + '" clicked')
    })

    //main shit
    chartOne();
    chartTwo();
    chartThree();

});



//Sample Data

// area charts
function chartOne() {
    var trace1 = {
        x: [1, 2, 3, 4],
        y: [0, 2, 3, 5],
        fill: 'tozeroy',
        type: 'scatter'
    };
    var trace2 = {
        x: [1, 2, 3, 4],
        y: [3, 5, 1, 7],
        fill: 'tonexty',
        type: 'scatter'
    };
    var data = [trace1, trace2];

    Plotly.newPlot('chart1', data);
}
//pie chart
function chartTwo() {
    var data = [{
        values: [19, 26, 55],
        labels: ['Residential', 'Non-Residential', 'Utility'],
        type: 'pie'
    }];

    var layout = {
        height: 400,
        width: 500
    };

    Plotly.newPlot('chart2', data);
}

//double imposed
function chartThree() {
    var trace1 = {
        x: [0, 1, 2, 3, 4, 5],
        y: [1.5, 1, 1.3, 0.7, 0.8, 0.9],
        type: 'scatter'
    };

    var trace2 = {
        x: [0, 1, 2, 3, 4, 5],
        y: [1, 0.5, 0.7, -1.2, 0.3, 0.4],
        type: 'bar'
    };

    var data = [trace1, trace2];

    Plotly.newPlot('chart3', data);
}
