/*
PURPOSE:
    Energy engineers spend x hours per building processing energy data into graphs in order to understand energy consumption and provide 
    a list of energy conservation measures (ECMs). The intent is to reduce energy engineer's time processing data and allow them to focus, and spend more time, 
    on the important task of interpreting the data and making recommendations to save enegry. This webapp is a one step, drag & drop, tool for all your 
    building energy visualization needs.

TODO: 
        General refactor code with a professional 
        Data processing refactor to use unpack function to make cleaner

        Optimization
                Calendar profile view - Graph hourly data rather than quarterly data to make it go quicker.
        
        Add the following plots/Sections
                Add analytics sections                
                Overtime - Monthly summary bar chart
                Overtime - Calendar graph: https://github.com/DKirwan/calendar-heatmap (low priority.. may be harder)
                Time of day - sub plotbar graph: https://plotly.com/javascript/bar-charts/

        Add the following funcationality:
                Make content hidden before CSV is uploaded. Once uploaded, then graphs appear below. 
                Calendar profile view - Add button selector for month        
                2 more buttons linked to different facility datasets e.g., Office, Lab, production
                Button to export CSV of data

        Stretch TODOs
                Add a custom graph module like: https://www.csvplot.com/
                Add a module for AHU analysis
                Add a module for VAV box analysis


    Reference:
        --Plotly.js reference documentation: https://plotly.com/javascript/reference/ 
        --Calendar profile dropdown menu for month: https://plotly.com/javascript/dropdowns/

*/

CSV_JSON = [];


//Import CSV
function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ",";
  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    // Delimiters.
    "(\\" +
      strDelimiter +
      "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      "\\r\\n]*))",
    "gi"
  );
  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];
  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while ((arrMatches = objPattern.exec(strData))) {
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }
    // Now that we have our delimiter out of the way,
    // var's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    }
    // Now that we have our value string, var's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  // Return the parsed data.
  return arrData;
}

//Convert from csv file input to JSON array output
function CSV2JSON(csv) {
  var array = CSVToArray(csv);
  var objArray = [];
  for (var i = 1; i < array.length; i++) {
    objArray[i - 1] = {};
    for (var k = 0; k < array[0].length && k < array[i].length; k++) {
      var key = array[0][k];
      objArray[i - 1][key] = array[i][k];
    }
  }

  var json = JSON.stringify(objArray);
  var str = json.replace(/},/g, "},\r\n");
  return JSON.parse(str);
}

function handleOther(e) {
  e.preventDefault();
}

// Take dropped file and convert text csv to JSON.
async function handleDrop(event) {
  //e is short for "event".
  event.preventDefault();
  handleCSV(event.dataTransfer.files[0]);
}

// Animate loading, convert csv to JSON, loadCharts, end animation
async function handleCSV(file) {
    document.getElementById("file-ui").classList.add("hidden"); // hide load buttons and text in the load box and display loading icon
    document.getElementById("file-text").classList.add("hidden");
    document.getElementById("file-ui2").classList.add("hidden");
    document.getElementById("file-text2").classList.add("hidden");
    document.getElementById("wait-ui").classList.remove("hidden");
    const csv = await (file.text ? file.text() : file);
    CSV_JSON = CSV2JSON(csv);
    document.getElementById("data-visuals").classList.remove("hidden"); // show visuals. e.g., data and graphs
    
    loadCharts(); //run this function after the csv is imported
    document.getElementById("file-ui").classList.remove("hidden"); // Show loading buttons after file is loaded
    document.getElementById("file-text").classList.remove("hidden");
    document.getElementById("file-ui2").classList.remove("hidden");
    document.getElementById("file-text2").classList.remove("hidden");
    document.getElementById("wait-ui").classList.add("hidden");
    
    //document.getElementById("data-visuals").classList.add("js-plotly-plot");
    document.getElementById("splash-ui").classList.add("hidden"); // hide loading box
}

// Listen for the file drop
var dropArea = document.getElementById("file-load");
dropArea.addEventListener("dragenter", handleOther, false);
dropArea.addEventListener("dragleave", handleOther, false);
dropArea.addEventListener("dragover", handleOther, false);
dropArea.addEventListener("drop", handleDrop, false);

// Listen for mouse over and animate drag&drop box
dropArea.addEventListener(
  "dragover",
  () => document.getElementById("file-load").classList.add("over"),
  false
);
dropArea.addEventListener(
  "drop",
  () => document.getElementById("file-load").classList.remove("over"),
  false
);
dropArea.addEventListener(
  "dragleave",
  () => document.getElementById("file-load").classList.remove("over"),
  false
);

// Listen for the file load button click, grab the file and pass it to CSV parser
document
  .getElementById("load-file")
  .addEventListener("change", async function (event) {
    handleCSV(event.target.files[0]);
  });

// Listen for sample file click, grab sample csv document, and pass it to CSV parser
document
  .getElementById("do-demo-inefficient")
  .addEventListener("click", function () {
    sampleCSV = fetch(
      "https://raw.githubusercontent.com/JamesDevJim/james-energy-charts/master/Sample_efficient3_2019.csv"
    )
      .then((response) => response.text())
      .catch((err) => console.log(err));
    handleCSV(sampleCSV);
  });

document
  .getElementById("do-demo-efficient")
  .addEventListener("click", function () {
    sampleCSV = fetch(
      "https://media.githubusercontent.com/media/JamesDevJim/james-energy-charts/master/FullSample.csv"
    )
      .then((response) => response.text())
      .catch((err) => console.log(err));
    handleCSV(sampleCSV);
  });

document.getElementById("do-demo-solar").addEventListener("click", function () {
  sampleCSV = fetch(
    "https://raw.githubusercontent.com/JamesDevJim/james-energy-charts/master/Sample_Solar1_2020.csv"
  )
    .then((response) => response.text())
    .catch((err) => console.log(err));
  handleCSV(sampleCSV);
});

// Define global variables
const dateColumn = [],
    usageColumn = [],
    lineRows = [],
    lineDemandRows = [],
    lineUsageDemandRows = [],
    scatterRows = [],
    scatterWeekendRows = [],
    scatterWeekRows = [],
    scatterWorkRows = [],
    calendarRows = [],
    dailyUsageSum = [],
    dailyUsageSumTime = [],
    monthlyUsageSum = [],
    monthlyUsageSumTime = [],
    weekendUsage = [],
    hourlyRows = [];
    allMonths = [];

// LOAD THE CHARTS
function loadCharts() {
    // Define variables
    let   momPreviousDate = moment(),
            momPreviousDailyDate = moment(),
            momPreviousDateForMax = moment(),
            momPreviousDateForMenu = moment();
            const hourLength = [];
            const hourWeekendLength = [];
            const hourWeekLength = [];
            const hourTime = [];
            const hourUsage = [];
            const day = [];
            const scatterWeekendTemp = [];
            const scatterWeekendDemand = [];
            const scatterWeekTemp = [];
            const scatterWeekDemand = [];
            const scatterBusinessTemp = [];
            const scatterBusinessDemand = [];
            const xaxis24Hours = [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                21, 22, 23,
            ];
    //const summedBarRows = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const summedWeekendBarRows = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
        [8, 0],
        [9, 0],
        [10, 0],
        [11, 0],
        [12, 0],
        [13, 0],
        [14, 0],
        [15, 0],
        [16, 0],
        [17, 0],
        [18, 0],
        [19, 0],
        [20, 0],
        [21, 0],
        [22, 0],
        [23, 0],
    ];
    const summedBarRows = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
        [8, 0],
        [9, 0],
        [10, 0],
        [11, 0],
        [12, 0],
        [13, 0],
        [14, 0],
        [15, 0],
        [16, 0],
        [17, 0],
        [18, 0],
        [19, 0],
        [20, 0],
        [21, 0],
        [22, 0],
        [23, 0],
    ];
    const summedWeekBarRows = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
        [8, 0],
        [9, 0],
        [10, 0],
        [11, 0],
        [12, 0],
        [13, 0],
        [14, 0],
        [15, 0],
        [16, 0],
        [17, 0],
        [18, 0],
        [19, 0],
        [20, 0],
        [21, 0],
        [22, 0],
        [23, 0],
    ];
    let hourlyDemandDataSummed = []; //[h1, h2, h3...]
    const barRows = [];
    var dateMax = [];
    var dateMin = moment();
    var usageTotal = 0;
    var sampleInterval = 0;
    var maxDemand = 0;
    var monthDayUsage = []; //y axis
    var monthDayTime = [];
    var monthDayUsage2 = []; //y axis
    var monthDayTime2 = [];
    var quarterHour = 0;
    let maxMonthlyDemand = [];
    let buttonOptions = [];

    let allDates = [],
        allMonths = [],
        allDays = [],
        allDemand = [],
        allUsage = [],
        allTemp = [];

    //initialize the multidimentional arrays for the calendar grid
    for (var i = 0; i < 50; i++) {
        monthDayTime[i] = [];
    }
    for (var i = 0; i < 50; i++) {
        monthDayUsage[i] = [];
    }

  // Loop through and create arrays for each chart
  for (const record of CSV_JSON) {
    const date = record["End Date Time"];
    const momDate = moment(date, "MM/DD/YYYY H:mm");
    const momDateDay = moment(date, "MM/DD/YYYY");
    const usage = parseFloat(record["Usage"]);
    const temp = parseInt(record["Avg. Temperature"]);
    const demand = parseInt(record["Peak Demand"]);
    //const AvgDemand = Would like to calculate (AvgDemand = Usage/4) this and put it on the "line demand chart with peak demand in two series"

    // push the data to arrays
    allDates.push(momDate.toDate());
    allDays.push(parseInt(momDate.format("D")));
    allMonths.push(momDate.format("MMM YYYY"));
    allDemand.push(demand);
    allUsage.push(usage);
    allTemp.push(temp);

    // create metric summary
    if (momDate > dateMax) {
      //find maximum date
      dateMax = momDate;
    }
    if (momDate < dateMin) {
      //find minimum date
      dateMin = momDate;
    }

    usageTotal += usage || 0; // Sum usage data. If value is not a number, then add 0.

    if (demand > maxDemand) {
      // find max demand value
      maxDemand = demand;
    }

    //TODO: fix this detection function
    // Detect sample interval
    if (sampleInterval == 0) {
        //If sample snterval as not been set

        if (previousDate == momDate.format("MM/DD/YYYY")) {
            quarterHour = quarterHour + 1;
        }

        if (quarterHour == 4) {
            sampleInterval = "15 minutes";
        }
        var previousDate = momDate.format("MM/DD/YYYY");
    }

    // Create time series chart data
    dateColumn.push(momDate.toDate());
    //usageColumn.push(usage);

    // Create scatter charts data
    scatterRows.push(temp); //All hours
    //demandData.push();

    if (momDate.day() == 6 || momDate.day() == 0) {
      //If weekend
      scatterWeekendTemp.push(temp);
      scatterWeekendDemand.push(demand);
    } else {
      scatterWeekTemp.push(temp); //if week
      scatterWeekDemand.push(demand);

      if (momDate.hour() >= 8 && momDate.hour() < 17) {
        //if week and during work hours (8am-5pm)
        scatterBusinessTemp.push(temp);
        scatterBusinessDemand.push(demand);
      }
    }

    // create daily bar chart data
    if (momPreviousDailyDate.isSame(momDate, "day")) {
        //if same month, then sum usage
        dailyUsageSum[dailyUsageSum.length - 1] += usage || 0; 
    } else {
        momPreviousDailyDate = momDate;
        dailyUsageSumTime.push(momDate.toDate() || "");
        //dailyUsageSumTime.push(momDate.format("MMM DD YYYY") || "");
        dailyUsageSum.push(usage || 0); // add another element to the array for the next month.
    }    
    

    // create monthly bar chart data
    if (momPreviousDate.isSame(momDate, "month")) {
        //if same month, then sum usage
        monthlyUsageSum[monthlyUsageSum.length - 1] += usage || 0; //add usage to the month index. "usage || 0 means: If usage is false, then use "0"
    } else {
        //once a new month comes, store that as the new "momPreviousDate", push the month to monthlyUsageSumTime.
        momPreviousDate = momDate;
        if(momDate.format("MMM YYYY") != "Invalid date"){
            monthlyUsageSumTime.push(momDate.format("MMM YYYY") || "");
            monthlyUsageSum.push(usage || 0); // add another element to the array for the next month.
        }
    }

    // create hourly bar chart data
    const hour = parseInt(momDate.format("H")); //grab the hour from the data record and make it an integer

    if (hourLength[hour]) {
      // count the total number of records for each hour. Divide by this number later to get an average value.
      hourLength[hour]++;
    } else {
      hourLength[hour] = 1; //Not sure what this does...
    }
    if (!isNaN(hour)) {
      // is the hour value is a valid number
      summedBarRows[hour][1] += usage || 0; //Sum all hours [row][column] "||" is the OR operator. Var += 1 is the same as Var = Var + 1
      //hourlyDemandDataSummed[hour][1] += demand;
    }

    if (momDate.day() == 6 || momDate.day() == 0) {
      if (hourWeekendLength[hour]) {
        // Count weekend hour length
        hourWeekendLength[hour]++;
      } else {
        hourWeekendLength[hour] = 1;
      }

      summedWeekendBarRows[hour][1] += usage || 0; //Sum weekend bar rows
    } else {
      if (hourWeekLength[hour]) {
        // Count week hour length
        hourWeekLength[hour]++;
      } else {
        hourWeekLength[hour] = 1;
      }
      if (!isNaN(hour)) {
        summedWeekBarRows[hour][1] += usage || 0; //Sum week bar rows
      }
    }

    //create hourly data for heat map
    if (momDate.format("m") == 15) {
      var hourQ1Usage = usage;
    }
    if (momDate.format("m") == 30) {
      var hourQ2Usage = usage;
    }
    if (momDate.format("m") == 45) {
      var hourQ3Usage = usage;
    }
    if (momDate.format("m") == 0) {
      var hourQ4Usage = usage;
      var hourSumUsage = hourQ1Usage + hourQ2Usage + hourQ3Usage + hourQ4Usage;
      //hourlyRows.push([momDate.toDate(),hourSumUsage]);
      hourUsage.push(hourSumUsage); // For the z axis
      day.push(momDateDay.toDate()); // For the y axis
      hourTime.push(momDate.format("H")); // For the x axis
    }

    // Create buttons for each calendar month profile

    if (
        momPreviousDateForMenu != momDate.format("MMM YYYY") &&
        momDate.format("MMM YYYY") != "Invalid date"
    ) {
        //create buttons
        let monthOfGraphs = momDate.format("MMM YYYY");
        buttonOptions.push(monthOfGraphs);
        momPreviousDateForMenu = momDate.format("MMM YYYY");
    }
  
    } // End of loop for creating data in each array

    usageTotal = Math.round(usageTotal);

    //console.log("maxMonthly", maxMonthlyDemand);
    //console.log("monthlyUsageSum", monthlyUsageSum);
    //console.log("monthlyUsageSumtime", monthlyUsageSumTime);

    // DATA INFORMATION DISPLAY
    document.getElementById("maxDateDiv").innerHTML =
        dateMax.format("MM/DD/YYYY hh:mm");
    document.getElementById("minDateDiv").innerHTML =
        dateMin.format("MM/DD/YYYY hh:mm");
    document.getElementById("dataDaysDiv").innerHTML = Math.round(
        (dateMax - dateMin) / (60 * 60 * 24 * 1000)
    );
    document.getElementById("sampleIntervalDiv").innerHTML = sampleInterval;
    document.getElementById("totalUsageDiv").innerHTML = usageTotal;
    document.getElementById("maxDemandDiv").innerHTML = maxDemand;

    // Takes CSV JSON input, makes the header a key to be pulled via unpack function. This essentially grabs the column
    function unpack(CSV_JSON, key) {
        return CSV_JSON.map(function (row) {
        return row[key];
        });
    }

    // LINE CHART
    var trace1 = {
        //x: unpack(CSV_JSON, "Start Date Time"), //Should look like ['2013-10-04 22:23:00', '2013-11-04 22:23:00', '2013-12-04 22:23:00'],
        x: dateColumn,
        y: unpack(CSV_JSON, "Peak Demand"), // Should look like [1, 3, 6],
        type: "scatter",
        mode: "lines",
        name: "Demand",
        line: { color: "#17BECF",
                width: 1
        },
    };

    var trace2 = {
        //x: unpack(CSV_JSON, "Start Date Time"), //Should look like ['2013-10-04 22:23:00', '2013-11-04 22:23:00', '2013-12-04 22:23:00'],
        x: dateColumn,
        y: unpack(CSV_JSON, "Avg. Temperature"), // Should look like [1, 3, 6],
        //type: "scatter",
        mode: "lines",
        name: "Outdoor Temp",
        line: {//color: '#AC351C',
            width: 1    
        },
        yaxis: "y2",
        type: "scatter",
    };
    var lineData = [trace1, trace2];

    var lineLayout = {
        autosize: true,
        xaxis: {
            title: "Date range selector",
            autorange: true,
            type: "date", // can be -, linear, log, date, category, or multicategory
            //dtick: 'tick0',
            //tickformat: "%b %d, %Y",

            rangeslider: {
                visible: true,
                autorange: true,
            },
            visible: true,
            rangeselector: {
                buttons: [
                {
                    count: 1,
                    label: "1m",
                    step: "month",
                    stepmode: "backward",
                },
                {
                    count: 6,
                    label: "6m",
                    step: "month",
                    stepmode: "backward",
                },
                { step: "all" },
                ],
            },
        },

        yaxis: {
            title: "Demand (kW)",
            autorange: true,
            type: "linear",
            autosize: true,
            height: 1000,
            titlefont: { size: 10 },
        },

        yaxis2: {
            autorange: true,
            autosize: true,
            title: "Temperature (F)",
            type: "linear",
            autosize: true,
            height: 1000,
            titlefont: { size: 10 },
        },

        grid: {
            rows: 2,
            columns: 1,
            pattern: "coupled",
            roworder: "top to bottom",
        },
    };

    var lineConfig = {
        responsive: true,
        maintainAspectRatio: false,
    };

    Plotly.newPlot("myDiv", lineData, lineLayout, lineConfig);

    
    // DAILY BAR CHART

    const dailyUsageData = [
        {
            type: "bar",
            //mode: "lines",
            name: "Peak Demand",
            x: dailyUsageSumTime,
            y: dailyUsageSum,
            line: { color: "#17BECF" },
        },
    ];

    const dailyUsageLayout = {
        title: "Daily",
        xaxis: {
            ticks: "",
            side: "bottom",
        },
        yaxis: {
            title: "Consumption (kWh)",
            type: "-",
            automargin: true,
        },
    };   

    const dailyUsageConfig = {
        responsive: true,
    };    

    Plotly.newPlot("dailyUsageChart", dailyUsageData, dailyUsageLayout, dailyUsageConfig);
  
    // MONTHLY BAR CHART
    const monthlyUsageData = [
        {
        type: "bar",
        //mode: "lines",
        name: "Peak Demand",
        x: monthlyUsageSumTime,
        y: monthlyUsageSum,
        line: { color: "#17BECF" },
        },
    ];

    const monthlyUsageLayout = {
        title: "Monthly",
        xaxis: {
            ticks: "",
            side: "bottom",
        },
        yaxis: {
        title: "Consumption (kWh)",
        type: "-",
        automargin: true,
        },
    };

    const monthlyUsageConfig = {responsive: true};

    Plotly.newPlot("monthlyUsageChart", monthlyUsageData, monthlyUsageLayout, monthlyUsageConfig);

  // SCATTER CHART
  var scatterData = [
    {
      x: unpack(CSV_JSON, "Avg. Temperature"),
      y: unpack(CSV_JSON, "Peak Demand"),
      mode: "markers",
      type: "scatter",
      marker: { opacity: 0.1 },
    },
  ];

  var scatterLayout = {
    //title: "Scatter Plot for energy",
    xaxis: {
      title: "Outdoor Air Temperature (F)",
      ticks: "",
      side: "bottom",
    },
    yaxis: {
      title: "Demand (kW)",
      range: [0,maxDemand],
      type: "-",
      automargin: true,
    },
  };

  var scatterConfig = { responsive: true };

  Plotly.newPlot("scatterChart", scatterData, scatterLayout, scatterConfig);

  // SCATTER SUBPLOT CHARTS

  var plotScatterWeek = {
    //chart week
    name: "Week",
    x: scatterWeekTemp,
    y: scatterWeekDemand,
    type: "scatter",
    mode: "markers",
    marker: { opacity: 0.1 },
  };

  var plotScatterWeekend = {
    //chart for weekend
    x: scatterWeekendTemp,
    y: scatterWeekendDemand,
    type: "scatter",
    name: "Weekend",
    mode: "markers",
    xaxis: "x2",
    yaxis: "y2",
    marker: { opacity: 0.1 },
  };

  var plotScatterBusiness = {
    x: scatterBusinessTemp,
    y: scatterBusinessDemand,
    type: "scatter",
    name: "Business",
    mode: "markers",
    xaxis: "x3",
    yaxis: "y3",
    marker: { opacity: 0.1 },
  };

  var scatterSubData = [
    plotScatterWeek,
    plotScatterWeekend,
    plotScatterBusiness,
  ];

  const xaxisValue = {
    title: "Outdoor Air Temp (F)",
    autorange: true,
    type: "scatter",
    titlefont: { size: 10 },
  };

  const yaxisValue = {
    title: "Demand (kW)",
    //autorange: true,
    range: [0,maxDemand],
    autosize: true,
    titlefont: { size: 10 },
  };

  var scatterSubLayout = {
    autosize: true,
    showlegend: false,

    xaxis: xaxisValue,
    xaxis2: xaxisValue,
    xaxis3: xaxisValue,

    yaxis: yaxisValue,
    yaxis2: yaxisValue,
    yaxis3: yaxisValue,

    grid: {
      rows: 1,
      columns: 3,
      pattern: "independent",
      //roworder: "top to bottom",
    },

    annotations: [
      {
        text: "Week",
        font: { size: 20 },
        showarrow: false,
        align: "center",
        //x: 0,
        xref: "x domain",
        y: 1.1,
        yref: "y domain",
      },
      {
        text: "Weekend",
        font: { size: 20 },
        showarrow: false,
        align: "center",
        //x: 0,
        xref: "x2 domain",
        y: 1.1,
        yref: "y2 domain",
      },
      {
        text: "Business Hours",
        font: { size: 20 },
        showarrow: false,
        align: "center",
        //x: 0,
        xref: "x3 domain",
        y: 1.1,
        yref: "y3 domain",
      },
    ],
  };

  Plotly.newPlot(
    "scatterSubChart",
    scatterSubData,
    scatterSubLayout,
    scatterConfig
  );

  // BAR CHART
  // Prepare the data
  let demandAvgHourlyMax = 0;
  for (const index in summedBarRows) {
    //make Total barRows an average by dividing by hourLength
    const i = parseInt(index);
    const summedRow = summedBarRows[i];
    //console.log(`summedRow`, summedRow);
    barRows[i] = summedRow[1] / (hourLength[i] / 4); //Need to divide by 4 because there are 4 quarters in 1 hour.
    if (barRows[i] > demandAvgHourlyMax) {
      // find maximum yaxis value to set all the yaxis to have the same range.
      demandAvgHourlyMax = barRows[i];
    }
  }

  const barWeekendRows = summedWeekendBarRows;
  for (const index in summedWeekendBarRows) {
    //make weekend barRows an average by dividing by hourLength
    const i = parseInt(index);
    const summedWeekendRow = summedWeekendBarRows[i];
    barWeekendRows[i] = summedWeekendRow[1] / (hourWeekendLength[i] / 4);
    if (barWeekendRows[i] > demandAvgHourlyMax) {
      // find maximum yaxis value to set all the yaxis to have the same range.
      demandAvgHourlyMax = barWeekendRows[i];
    }
  }

  const barWeekRows = summedWeekBarRows;
  for (const index in summedWeekBarRows) {
    //make week barRows an average by dividing by hourLength
    const i = parseInt(index);
    const summedWeekRow = summedWeekBarRows[i];
    barWeekRows[i] = summedWeekRow[1] / (hourWeekLength[i] / 4);
    if (barWeekRows[i] > demandAvgHourlyMax) {
      // find maximum yaxis value to set all the yaxis to have the same range.
      demandAvgHourlyMax = barWeekRows[i];
    }
  }

  barAvgRows = [];
  barAvgMaxRows = [];
  barAvgMinRows = [];
  for (var i = 0; i < barRows.length; i++) {
    barAvgRows.push([
      i,
      Math.round(barRows[i][1] / (CSV_JSON.length / 24)),
      Math.max(barRows[i][1] / (CSV_JSON.length / 24)),
      Math.max(barRows[i][1] / (CSV_JSON.length / 24)),
    ]); //Need to verify this is providing the correct value.
  }

  var barData = [
    {
      x: xaxis24Hours,
      y: barRows,
      //     x: unpack(CSV_JSON, "Avg. Temperature"),
      //     y: unpack(CSV_JSON, "Usage"),
      mode: "markers",
      type: "bar",
    },
  ];

  var barLayout = {
    //title: "Scatter Plot for energy",
    xaxis: {
      title: "Hour",
      ticks: "",
      side: "bottom",
    },
    yaxis: {
      title: "Avg Demand (kW)",
      type: "linear",
      automargin: true,
      range: [0, Math.ceil(demandAvgHourlyMax)],
    },
  };

  var barConfig = { responsive: true };

  Plotly.newPlot("barChart", barData, barLayout, barConfig);

  // BAR SUBPLOT CHART

  var plotBarWeek = {
    //Week data
    name: "Week",
    x: xaxis24Hours,
    y: barWeekRows,
    type: "bar",
    //mode: "markers",
  };

  var plotBarWeekend = {
    x: xaxis24Hours,
    y: barWeekendRows,
    type: "bar",
    xaxis: "x2",
    yaxis: "y2",
  };

  var barSubData = [plotBarWeek, plotBarWeekend];

  const xaxisBarValue = {
    title: "Hours",
    autorange: true,
    type: "bar",
    titlefont: { size: 10 },
  };

  const yaxisBarValue = {
    title: "Avg Demand (kW)",
    //autorange: true,
    autosize: true,
    titlefont: { size: 10 },
    range: [0, Math.ceil(demandAvgHourlyMax)],
  };

  var barSubLayout = {
    autosize: true,
    showlegend: false,

    xaxis: xaxisBarValue,
    xaxis2: xaxisBarValue,
    xaxis3: xaxisBarValue,

    yaxis: yaxisBarValue,
    yaxis2: yaxisBarValue,
    yaxis3: yaxisBarValue,

    grid: {
      rows: 1,
      columns: 2,
      pattern: "independent",
      //roworder: "top to bottom",
    },

    annotations: [
      {
        text: "Week",
        font: { size: 20 },
        showarrow: false,
        align: "center",
        //x: 0,
        xref: "x domain",
        y: 1.1,
        yref: "y domain",
      },
      {
        text: "Weekend",
        font: { size: 20 },
        showarrow: false,
        align: "center",
        //x: 0,
        xref: "x2 domain",
        y: 1.1,
        yref: "y2 domain",
      },
    ],
  };

  var barSubConfig = { responsive: true };

  Plotly.newPlot("barSubChart", barSubData, barSubLayout, barSubConfig);

  // HEAT MAP CHART (https://plotly.com/javascript/heatmaps/)
  const heatData = [
    {
      z: hourUsage,
      x: hourTime,
      y: day,
      type: "heatmap",
      legendgrouptitle: { text: "Demand (kW)" },
      zsmooth: "best",
      title: "Demand (kW)",
    },
  ];

  const heatLayout = {
    title: "Heat map",
    //font: { size: 20 },
    showlegend: true,
    autosize: true,
    //width: 500,
    height: 1400,
    xaxis: {
      title: "Hour",
      ticks: "",
      side: "bottom",
      tickvals: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23,
      ],
    },
    yaxis: {
      //title: "Day",
      type: "date",
      automargin: true,
    },
  };

  Plotly.newPlot("heatChart", heatData, heatLayout, { responsive: true });

  // CALENDAR PROFILE CHART

  let listofMonths = [];

  // create list of months from data i.e., remove duplicates and make sure no invalid date values
  for (var i = 0; i < allMonths.length; i++) {
    // make list of months i.e., remove duplicates.
    // indexOf is a method that returns position of first occurrence. Else returns -1 if the value is not found.
    if (
      listofMonths.indexOf(allMonths[i]) === -1 &&
      allMonths[i] != "Invalid date"
    ) {
      listofMonths.push(allMonths[i]);
    }
  }

  function getMonthTimeData(month, day) {
    currentDates = [];
    for (var i = 0; i < allMonths.length; i++) {
      if (allMonths[i] === month && allDays[i] === day) {
        currentDates.push(allDates[i]);
      }
    }
    return currentDates;
  }

  function getMonthDemandData(month, day) {
    currentDemand = [];
    for (var i = 0; i < allMonths.length; i++) {
      if (allMonths[i] === month && allDays[i] === day) {
        currentDemand.push(allDemand[i]);
      }
    }
    return currentDemand;
  }

  function getMonthMaxDemand(month) {
    let currentMonthMax = 0;
    for (var i = 0; i < allMonths.length; i++) {
      if (allMonths[i] === month && allDemand[i] > currentMonthMax) {
        currentMonthMax = allDemand[i];
      }
    }
    return currentMonthMax;
  }

  makeCalData(listofMonths[0]); // set default month data.

  // create each graph for each day of the month

  // make a trace for each day, based on the selected month
    function makeCalData(chosenMonth) {
        let calTrace = {},
        calData = [];

        // find first day of the week.
        let firstDayIndex = 0;
        for (let i = 0; i < 30; i++) {
        if (typeof getMonthTimeData(chosenMonth, i)[0] != "undefined") {
            firstDayIndex = i;
            break;
        }
        }

        let firstDayOfWeek = moment(
        getMonthTimeData(chosenMonth, firstDayIndex)[0]).day(); // find the first day of the week (sun = 0, sat = 6)
        if (firstDayOfWeek === 0) {
        firstDayOfWeek = 7;
        } // change 0 to 7 for easier manipulation (Mon = 1, Sun = 7)

        let monthDayCounter = 0;
        for (var i = 0; i < 43; i++) {
            if (i + 1 <= firstDayIndex) {
                calTrace[i] = {
                x: [], // make the graph blank untill the first day matches the day of the week
                y: [],
                type: "scatter",
                mode: "lines",
                xaxis: "x" + i,
                yaxis: "y" + i,
                };
                firstDayOfWeek--;
            } else {
                var dayVar = i - firstDayOfWeek;
                calTrace[i] = {
                x: getMonthTimeData(chosenMonth, dayVar),
                y: getMonthDemandData(chosenMonth, dayVar),
                type: "scatter",
                mode: "lines",
                xaxis: "x" + i,
                yaxis: "y" + i,
                };
            }
            // count the amount of days in this month
            if(calTrace[i].x.length>5){
                monthDayCounter++
            }
            
            //console.log("i:", i, "calTrace[i].x.length", calTrace[i].x.length);
            //console.log("i:", i, "calTrace[i].y.length", calTrace[i].y.length);
            calData.push(calTrace[i]); // place each trace object into the data array
        }
        //TODO: Fix date to match with correct calendar graph

        // do this again because we need the true first day of the week
        firstDayOfWeek = moment(
            getMonthTimeData(chosenMonth, firstDayIndex)[0]).day(); // find the first day of the week (sun = 0, sat = 6)
        if (firstDayOfWeek === 0) {
            firstDayOfWeek = 7;
        } // change 0 to 7 for easier manipulation (Mon = 1, Sun = 7)
        
        // Create annotation date title for each day of the month
        let dayOfWeek = ["Monday" ,"Tuesday" , "Wednesday" , "Thursday" ,"Friday" ,"Saturday" , "Sunday"];
        let annotationArray = []; //array
        let annotationObj = {}; //dictionary
        
        for (var i = 0; i < monthDayCounter; i++) {
        var addNum = i + firstDayOfWeek;
        let dayOfGraph = moment(getMonthTimeData(chosenMonth, i + firstDayIndex)[0]).format(
            "MMM DD YYYY");

        annotationObj[i] =
            // create each trace object with the following key value pairs
            {
            text: dayOfGraph,
            font: { size: 12 },
            showarrow: false,
            align: "center",
            //x: 0,
            xref: "x" + addNum + " domain",
            y: 1.2,
            yref: "y" + addNum + " domain",
            },
            annotationArray.push(annotationObj[i]); // place each trace object into the data array

            // make day of the week titles
            if(i<8 && i>0){
                annotationObj[i] =
                {
                    text: dayOfWeek[i-1],
                    font: { size: 20 },
                    showarrow: false,
                    align: "center",
                    //x: 0,
                    xref: "x" + i + " domain",
                    y: 1.5,
                    yref: "y" + i + " domain",
                },
                annotationArray.push(annotationObj[i]);    
            }

        }

        var calLayout = {
            title: 'Calendar Profile',
            font: { size: 20 },
            borderwidth: 3,
            autosize: true,
            showlegend: false,
            height: 1000,
            annotations: annotationArray,
            plot_bgcolor: "#dddddd",
            grid: {
                rows: 6,
                columns: 7,
                pattern: "independent",
            },
        };

        // add xaxis layout properties for each subplot
        for (var i = 1; i < 43 + 6; i++) {
        //should be number of grids. 43+6
        var xaxisObj = "xaxis" + i;
        var yaxisObj = "yaxis" + i;

            // if the plot is in the first column then show y axis, else do not.
            if (i == 1 || i == 8 || i == 15 || i == 22 || i == 29 || i == 36) {
                // if monday, then show yaxis labels, else do not.
                calLayout[xaxisObj] = {
                    showticklabels: false,
                    linecolor: "black",
                    linewidth: 1,
                    mirror: true,
                    zeroline: false,
                };
                calLayout[yaxisObj] = {
                    title: "Demand (kW)",
                    titlefont: { size: 15 },
                    showticklabels: true,
                    visible: true,
                    range: [0, getMonthMaxDemand(chosenMonth)], // set the range from 0 to maximum value of the month.
                    linecolor: "black",
                    linewidth: 1,
                    mirror: true,
                    zeroline: false,
                };
            } else {
                calLayout[xaxisObj] = {
                    showticklabels: false,
                    linecolor: "black",
                    linewidth: 1,
                    mirror: true,
                    zeroline: false,
                };
                calLayout[yaxisObj] = {
                    showticklabels: false,
                    range: [0, getMonthMaxDemand(chosenMonth)], // set the range from 0 t0 maximum value of the month.
                    linecolor: "black",
                    linewidth: 1,
                    mirror: true,
                    zeroline: false,
                };
            }
        }

        var calConfig = { responsive: true };

        updateChart(calData, calLayout, calConfig);

    }

    function updateChart(calData, calLayout, calConfig) {
        //console.log('updateCharts activated');
        Plotly.newPlot("calChart", calData, calLayout, calConfig);
    }

    var innerContainer = document.querySelector('[data-num="0"'),
    plotEl = innerContainer.querySelector(".plot"),
    monthSelector = innerContainer.querySelector(".monthDataList"); // grab the monthSelector and pass it to the assignOptions function

    // create the list of months on the web page
    function assignOptions(textArray, selector) {
        for (var i = 0; i < textArray.length; i++) {
        var currentOption = document.createElement("option");
        currentOption.text = textArray[i];
        selector.appendChild(currentOption);
        }
    }

    // call the function and push the list to the drop down menu
    assignOptions(listofMonths, monthSelector);

    monthSelector.addEventListener("change", updateMonth, false); // grab the month when selected on the page

    // run the function when menu selection is changed.
    function updateMonth() {
        makeCalData(monthSelector.value);
    }

}
