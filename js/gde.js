//dashboard queries
$(document).on('ready', function() {
    //for getting data
    $('a').on('click', function(c) {
        c.preventDefault();
        console.log('button "' + c.toElement.id + '" clicked')
    })

    console.log('doc loaded!')
    $('#makeQuery').on('click', doTheQuery)

    //mixpanel auth
    //MP.api.setCredentials('APISECRET')

    //VIEWS (via plotly)
    function chartOne(data) {
        var x1 = data.map(function(elem) {
            return elem.$count
        });


        var y1 = data.map(function(elem) {
            return elem.converted
        });
        var y2 = data.map(function(elem) {
            return elem['not converted']
        });

        var y3 = data.map(function(elem) {
            return elem['rate of conversion'] * 100;
        });

        var trace1 = {
            x: x1,
            y: y1,
            type: "bar",
            marker: {
                color: '#1d6fa6',
            },
            name: "Converted"
        };
        var trace2 = {
            x: x1,
            y: y2,
            type: "bar",
            marker: {
                color: '#79caed'
            },
            name: "Non-Converted"
        };

        var trace3 = {
            x: x1,
            y: y3,
            type: 'scatter',
            text: 'percent converted',
            name: 'conversion',
            marker: {
                color: '#5dbb5a'
            },

        };

        var data = [trace1, trace2];
        var lineConv = [trace3]

        var layout1 = {
            barmode: "stack",
            xaxis: { 'title': "num of times user did KPI" },
            yaxis: { 'title': "population of users" },
            bargap: .20,
            bargroupgap: 0.1,
        };

        var layout2 = {
            yaxis: { 'title': "conversion percentage by cohort" },


        };
        Plotly.newPlot("chartBar", data, layout1, { displaylogo: false });
        Plotly.newPlot("chartLine", lineConv, layout2, { displaylogo: false });
    }




    //mixpanel datepicker
    $('#datePicker').MPDatepicker().on('change', function(event, dateRange) {

    });

    //decorate mixpanel event controls
    $('#eventClosedWon').MPEventSelect()
    $('#eventLead').MPEventSelect();

    //hack to change default text of event selectors
    function setDefaultText() {
        $('#eventLead span').text('Select KPI event')
        $('#eventClosedWon span').text('Select "user born" event')

    }
    setTimeout(setDefaultText, 750);

    // querying, grab values from DOM
    var predictions = {
        two_week_retention: "two_week_retention"
    }

    function doTheQuery() {
        // validation
        if ($('#eventLead span').text() === "Select KPI event" || $('#eventClosedWon') === 'Select "user born" event') {
            alert("you' didn't give me a conversion or KPI event")
            return;
        }

        // expand view
        $('#chartBar').css('height', 500)
        $('#chartBar').css('width', '100%')
        $('#chartLine').css('height', 500)
        $('#chartLine').css('width', '90%')

        // setup query
        var jqlParams = {
            SIGNUP_EVENT: $('#eventClosedWon span').text(),
            EVENT: $('#eventLead span').text(),
            WITHIN_DAYS: 7,
            PREDICT: "two_week_retention",
            FROM_DATE: $('#datePicker').MPDatepicker().val().from.toISOString().split('T')[0],
            TO_DATE: $('#datePicker').MPDatepicker().val().to.toISOString().split('T')[0]
        }

        // tim's awesome GDE JQL query
        MP.api.jql(
            function main() {
                //values from DOM
                var SIGNUP_EVENT = params.SIGNUP_EVENT;
                var EVENT = params.EVENT;
                var WITHIN_DAYS = params.WITHIN_DAYS;
                var PREDICT = params.PREDICT
                var FROM_DATE = params.FROM_DATE;
                var TO_DATE = params.TO_DATE;


                //helper methods for JQL query
                function calc_end_date() {
                    var to_date = new Date(TO_DATE);
                    to_date.setDate(to_date.getDate() + WITHIN_DAYS + 14);
                    return to_date;
                }

                function matches(event, desired) {
                    if (typeof desired == "string") {
                        return event.name == desired
                    }
                    if (typeof desired == "function") {
                        return desired(event)
                    }
                    throw "invalid use of matches()"
                }

                //jql query
                return Events({
                        from_date: FROM_DATE,
                        to_date: calc_end_date().toISOString().split('T')[0]
                    })
                    .groupByUser(function(state, events) {
                        state = state || {
                            count: 0,
                            signup_date: undefined,
                            active_window_end: undefined,
                            conversion_window_start: undefined,
                            conversion_window_end: undefined,
                            converted: false
                        }
                        for (var i = 0; i < events.length; i++) {
                            var e = events[i];
                            if (state.signup_date === undefined && matches(e, SIGNUP_EVENT)) {
                                state.signup_date = new Date(e.time);
                                state.active_window_end = e.time + WITHIN_DAYS * 86400000;
                                state.conversion_window_start = e.time + 7 * 86400000;
                                state.conversion_window_end = e.time + 14 * 86400000;
                            }
                            if (state.signup_date !== undefined) {
                                if (matches(e, EVENT) && e.time < state.conversion_window_end) {
                                    state.count++;
                                }
                                if (!state.converted && e.time >= state.conversion_window_start && e.time < state.conversion_window_end) {
                                    state.converted = true;
                                }
                            }
                        }
                        return state;
                    })
                    .filter(function(item) {
                        return item.value.signup_date
                    })
                    .groupBy(["value.count"], function(accumulators, items) {
                        var resp = {
                            "converted": {
                                false: 0,
                                true: 0
                            }
                        }

                        _.each(items, item => {
                            resp.converted[item.value.converted]++;
                        })

                        accumulators.push(resp);
                        return mixpanel.reducer.object_merge()(accumulators, []);
                    })
                    .map(row => {
                        return {
                            $count: row.key[0],
                            "converted": row.value.converted.true,
                            "not converted": row.value.converted.false,
                            "rate of conversion": (row.value.converted.true / (row.value.converted.true + row.value.converted.false)).toFixed(2)
                        }
                    })
            }, jqlParams
        ).done(function(data) {
            var trimmedData = []
            for (var i = 0; i < 12; i++) {
                trimmedData.push(data[i])
            }
            console.log('query finished!')
            console.log(JSON.stringify(data, null, 2))
            chartOne(trimmedData)

        })
    };
});
