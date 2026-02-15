let odtableSelectedDif = -1;
let odtableNotCachedDifIds = [];
let odtableFilteredText = "";
let odtablePreviousFilteredText = "";
let odtableCursorPosition = 0;

function LoadDifODCalc() {
    document.getElementById("container").innerHTML = "<div id=\"datadisplay\" style=\"display:flex; width:100%\">"
    + "<div id=\"beatmapdiflist\" style=\"display:flex; flex-direction:column; align-self:left;\"></div>"
    + "<div id=\"tabledisplay\">"
    + "<div id=\"beatmapdifdata\"></div>"
    +"<table id=\"odchangesdisplay\"></table>"
    +"</div>"
    
    + "</div>";
    LoadDifs();
    
}

function LoadDifs()
{
    odtableNotCachedDifIds = [];
    let diflisttext = "<input type=\"text\" name=\"odtablemapsearch\" placeholder=\"Search for song titles...\" id=\"odtablemapsearch\" value=\""+odtableFilteredText+"\">";
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i] || (odtableFilteredText != "" && !songNames[i].toLowerCase().includes(odtableFilteredText.toLowerCase())))
            continue;
        odtableNotCachedDifIds.push(i);
        diflisttext += "<div id=\"mapdiff"+(odtableNotCachedDifIds.length-1)+"\" class=\"buttonstyle\" style=\"width:400px; margin-top:5px\">";
        diflisttext += "<div>"+songNames[i]+"</div>"
        diflisttext += "<div>"+difficultyNames[i]+"</div>"
        diflisttext += "</div>"
    }
    if (odtableSelectedDif >= odtableNotCachedDifIds.length)
        odtableSelectedDif = -1;
    document.getElementById("beatmapdiflist").innerHTML = diflisttext;
    if (odtablePreviousFilteredText != odtableFilteredText)
    {
        document.getElementById("odtablemapsearch").focus();
        odtablePreviousFilteredText = odtableFilteredText;
        document.getElementById("odtablemapsearch").setSelectionRange(odtableCursorPosition, odtableCursorPosition);
    }
    document.getElementById("odtablemapsearch").addEventListener("input", (e) => {
        odtableFilteredText = e.target.value;
        odtableCursorPosition = e.target.selectionStart;
        LoadDifs();
    });
    for (let i = 0; i < odtableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).addEventListener("click", async (event) => {
            ClearSelection();
            document.getElementById(buttonId).className += " selected";
            odtableSelectedDif = odtableNotCachedDifIds[i];
            document.getElementById("beatmapdifdata").scrollIntoView({
                behavior: "instant"
              });
            document.getElementById("beatmapdifdata").innerHTML = songNames[odtableNotCachedDifIds[i]] + "<br>"+ difficultyNames[odtableNotCachedDifIds[i]] 
            + "<br>Original OD: "+ODs[odtableNotCachedDifIds[i]];
            CreateODTable();
        });        
    }
}

function ClearSelection()
{
    for (let i = 0; i < odtableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).className = document.getElementById(buttonId).className.replace(" selected", "");
    }
}

function CreateODTable()
{
    let originalOD = difficultyList[odtableSelectedDif].overallDifficulty;
    difficultyList[odtableSelectedDif].overallDifficulty = -0.5;
    let localODs = [];
    let localStars = [];
    let localPPs = [];
    let localODTableRowIds = [];
    for (let i = 0; i < starFormulaKeys.length; ++i) {
        localStars.push([]);
    }

    for (let i = 0; i < ppFormulaKeys.length; ++i) {
        localPPs.push([]);
    }
    for (let i = 0; i < 23; ++i)
    {
        difficultyList[odtableSelectedDif].overallDifficulty = difficultyList[odtableSelectedDif].overallDifficulty + 0.5;
        localODs.push(difficultyList[odtableSelectedDif].overallDifficulty);        
        localODTableRowIds.push(i);
        for (let i = 0; i < starFormulaKeys.length; ++i) {

            let star = starFormulas[starFormulaKeys[i]](difficultyList[odtableSelectedDif]);
            localStars[i].push(Math.round(star*100)/100);

        }

        for (let i = 0; i < ppFormulaKeys.length; ++i) {

            let pp = ppFormulas[ppFormulaKeys[i]](difficultyList[odtableSelectedDif]);
            localPPs[i].push(pp);
        }
    }    
    let oldSRMax = 0;
    let newSRMax = 0;
    let oldPPMax = 0;
    let newPPMax = 0;
    for (let i = 0; i < localStars[srReworkFirst].length; ++i)
    {
        if (oldSRMax < localStars[srReworkFirst][i])
            oldSRMax = localStars[srReworkFirst][i];
        if (newSRMax < localStars[srReworkSecond][i])
            newSRMax = localStars[srReworkSecond][i];
        if (oldPPMax < localPPs[ppReworkFirst][i])
            oldPPMax = localPPs[ppReworkFirst][i];
        if (newPPMax < localPPs[ppReworkSecond][i])
            newPPMax = localPPs[ppReworkSecond][i];
    }
    let oldSRPercentage = [];
    let newSRPercentage = [];
    let oldPPPercentage = [];
    let newPPPercentage = [];
    for (let i = 0; i < localStars[srReworkFirst].length; ++i)
    {
        oldSRPercentage.push(localStars[srReworkFirst][i] / oldSRMax);
        newSRPercentage.push(localStars[srReworkSecond][i] / newSRMax);
        oldPPPercentage.push(localPPs[ppReworkFirst][i] / oldPPMax);
        newPPPercentage.push(localPPs[ppReworkSecond][i] / newPPMax);
    }

    //tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, columnTypes
    let localODTableNames = ["OD", "Old sr", "New sr", "Old PP", "New PP", "Old perc sr", "New perc sr", "Old perc PP", "New perc PP"];
    let localODTableIDs = ["od", "oldsr", "newsr", "oldpp", "newpp", "oldpercsr", "newpercsr", "oldpercpp", "newpercpp"];
    let localODTableWidths = [60, 60, 60, 60, 60, 60, 60, 60, 60];    
    let localODTableValues = [localODs, localStars[srReworkFirst], localStars[srReworkSecond], localPPs[ppReworkFirst], localPPs[ppReworkSecond], oldSRPercentage, newSRPercentage, oldPPPercentage, newPPPercentage];
    let localODTableCompares = [-1, -1, 1, -1, 3, -1, 5, -1, 7];
    let localODTableTypes = ["float", "float", "float", "integer", "integer", "percentage", "percentage", "percentage", "percentage"];
    CreateTable("odchangesdisplay", localODTableNames, localODTableIDs, localODTableWidths, localODTableRowIds, localODTableValues, localODTableCompares, localODTableTypes, 0);
    difficultyList[odtableSelectedDif].overallDifficulty = originalOD;
}