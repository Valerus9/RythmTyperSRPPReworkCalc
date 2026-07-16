//let songNames = [];
//let difficultyNames = [];
//let BPMs = [];
//let DrainTimes = [];
//let NoteCounts = [];
//let TypingSectionCounts = [];
//let Stars = [];
//let ODs = [];
//let PPs = [];
//let StarDTNCs = [];
//let PPDTNCs = [];
//let StarHTDCs = [];
//let PPHTDCs = [];



let buildUpsOfMaps = [];
let buildUpsOfMapsDTNC = [];
let buildUpsOfMapsHTDC = [];
let buildUpSelectedLeaderboard = 0;

function LoadBuildUpLeaderboard() {
    document.getElementById("container").innerHTML = 
    "<select id=\"ppsrbuildupselect\">"
    +"</select>"
    +"<table id=\"buildupleaderboard\"></table>";
    CreateMissingBuildUps();
    let ppsrbuildupselect = document.getElementById("ppsrbuildupselect");
    let ppsrbuildupselectText = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i], "buildup"))
            continue;
        if (i == 0) {
            ppsrbuildupselectText += "<option value=\"" + (i + 1) + "\" selected>" + reworks[i].name + "</option>\n";
        }
        else {
            ppsrbuildupselectText += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
    }
    document.getElementById("ppsrbuildupselect").addEventListener("change", async (event) => {
        buildUpSelectedLeaderboard = event.target.value - 1;
        CreateBuildUpLeaderBoard();
    });
    ppsrbuildupselect.innerHTML = ppsrbuildupselectText;
}

function CreateMissingBuildUps()
{
    if (buildUpsOfMaps.length == 0)
    {
        for (let i = 0; i < reworks.length; ++i)
        {
            if (!ObjectHasVariable(reworks[i], "buildup"))
                continue;
            buildUpsOfMaps.push([]);
            buildUpsOfMapsDTNC.push([]);
            buildUpsOfMapsHTDC.push([]);
        }
    }
    if (buildUpsOfMaps[0].length < songNames.length)
    {
        for (let i = buildUpsOfMaps[0].length; i < songNames.length; ++i)
        {
            for (let j = 0; j < reworks.length; ++j)
            {
                if (!ObjectHasVariable(reworks[j], "buildup"))
                    continue;
                buildUpsOfMaps[j].push(reworks[j].buildup.calculate(scaleDifficultySpeed(difficultyList[i],1)));
                buildUpsOfMapsDTNC[j].push(reworks[j].buildup.calculate(scaleDifficultySpeed(difficultyList[i],0.75)));
                buildUpsOfMapsHTDC[j].push(reworks[j].buildup.calculate(scaleDifficultySpeed(difficultyList[i],1.5)));
            }
        }
    }
}

function CreateBuildUpLeaderBoard()
{
    let buildUpTableColumnNames = ["Song name", "Difficulty name", "Total PP"];
    let buildUpTableColumnIds = ["songname", "difficultyname", "totalpp"];
    let buildUpTableColumnTypes = ["string", "string", "float"];
    let buildUpTableColumnWidths = [300, 160, 70];
    let buildUpTableColumnCompare = [-1, -1, -1];

    for (let i = 0; i < buildUpsOfMaps[buildUpSelectedLeaderboard][0][2].length + 1; ++i)
    {
        if (i == 0)
        {
            buildUpTableColumnNames.push("base PP");
            buildUpTableColumnIds.push("basepp");
            buildUpTableColumnTypes.push("float");
            buildUpTableColumnWidths.push("base PP".length * 8);
            buildUpTableColumnCompare.push(-1);
            continue;    
        }
        let multiplierName = buildUpsOfMaps[buildUpSelectedLeaderboard][0][2][i-1];
        buildUpTableColumnNames.push(multiplierName + " PP");
        buildUpTableColumnIds.push(multiplierName);
        buildUpTableColumnTypes.push("float");
        buildUpTableColumnWidths.push(multiplierName.length * 8);
        buildUpTableColumnCompare.push(-1);
    }

    CreateTable("Build up list", "buildupleaderboard", buildUpTableColumnNames, buildUpTableColumnIds, buildUpTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateBuildUpTableValues(), buildUpTableColumnCompare, buildUpTableColumnTypes, 0);
}

function CreateBuildUpTableValues()
{
    let buildUpTableValues = [[], [], []];
    let buildUpOffset = buildUpTableValues.length;
    for (let i = 0; i < buildUpsOfMaps[buildUpSelectedLeaderboard][0][2].length + 1; ++i)
    {
        buildUpTableValues.push([]);
    }
    if (songNames.length == 0)
    {
        return buildUpTableValues;
    }

    for (let i = 0; i < songNames.length; ++i)
    {
        buildUpTableValues[0].push(songNames[i]);
        buildUpTableValues[1].push(difficultyNames[i]);
        buildUpTableValues[2].push(Math.round(PPs[buildUpSelectedLeaderboard][i]*100)/100);
        let sumOfValuesBuildUp = [];
        for (let j = 0; j < buildUpsOfMaps[buildUpSelectedLeaderboard][i][3].length + 1; ++j)
        {
            sumOfValuesBuildUp.push(0);
        }
        for (let j = 0; j < buildUpsOfMaps[buildUpSelectedLeaderboard][i][1].length; ++j)
        {
            let multiplierValues = [];
            for (let k = 0; k <buildUpsOfMaps[buildUpSelectedLeaderboard][i][3].length;++k)
            {
                multiplierValues.push(buildUpsOfMaps[buildUpSelectedLeaderboard][i][3][k][j]);
            }
            let buildUpOfPart = calculateDifficultyObjectBuildUp(buildUpsOfMaps[buildUpSelectedLeaderboard][i][1][j],
                multiplierValues);
            for (let k = 0; k < buildUpOfPart.length; ++k)
            {
                if (k==0)
                {
                    sumOfValuesBuildUp[k] += buildUpOfPart[k];
                    continue;
                }
                if (buildUpsOfMaps[buildUpSelectedLeaderboard][i][3][k - 1][j] > 1)
                {
                    sumOfValuesBuildUp[k] += buildUpOfPart[k];
                }
                else if (buildUpsOfMaps[buildUpSelectedLeaderboard][i][3][k -1][j] < 1)
                {
                    sumOfValuesBuildUp[k] -= buildUpOfPart[k];
                }
            }
        }
        let totalSum = 0;
        for (let j = 0; j < sumOfValuesBuildUp.length; ++j)
        {
            totalSum += sumOfValuesBuildUp[j];
        }
        let ppScaler = 1;
        if (totalSum != 0)
            ppScaler = (Math.round(PPs[buildUpSelectedLeaderboard][i]*100)/100)/totalSum;
        else
            ppScaler = 0;
        for (let j = 0; j < buildUpsOfMaps[buildUpSelectedLeaderboard][i][3].length + 1; ++j)
        {
            buildUpTableValues[buildUpOffset + j].push(Math.round(Math.round(sumOfValuesBuildUp[j]*100)/100 * ppScaler*100)/100);
        }
        
        /*for (let j = 0; j < buildUpsOfMaps[buildUpSelectedLeaderboard][0][2].length + 1; ++j)
        {
            
            let sumOfValues = 0;
            if (j == 0)
            {
                for (let k = 0; k < buildUpsOfMaps[buildUpSelectedLeaderboard][0][1].length; ++k)
                {
                    sumOfValues += buildUpsOfMaps[buildUpSelectedLeaderboard][0][1][k];
                }
                buildUpTableValues[buildUpOffset + j].push(Math.round(sumOfValues*100)/100);
                continue;
            }
            for (let k = 0; k < buildUpsOfMaps[buildUpSelectedLeaderboard][0][3][j-1].length; ++k)
            {
                sumOfValues += buildUpsOfMaps[buildUpSelectedLeaderboard][0][3][j-1][k];
            }
            buildUpTableValues[buildUpOffset + j].push(Math.round(sumOfValues*100)/100);
        }*/
    }
    return buildUpTableValues;
}