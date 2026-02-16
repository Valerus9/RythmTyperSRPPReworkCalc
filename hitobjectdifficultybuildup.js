/*
    usually a hit object diff will look something like this:
    baseValue * multiplier1 * multiplier2 * ... * multiplierN
    to calculate the contribution of each multiplier we first calculate
    the maximumBaseValue (basically basevalue multiplied by all multipliers
    which are larger than 1) and then negate the original basevalue from it
    so that we only distributing the non base amounts between the multipliers
    then we add all of those multipliers up and negate N from them and also 1 
    from each of them when we calculate the percentage they contributed. 
    And finally calculate the contributed values.

    For multipliers that are lower than 1 you have to take the maximumBaseValue
    multiply it by these multipliers to get the calculatedValue and use that to calculate
    the difference, impact of these multipliers by subtracting it from maximumBaseValue
    Then finally we divide up this difference between these multipliers by first subtracting
    each from 1 and then add them up to get the percentage.

    Last step is to multiply each higher than 1 multipliers impact by the less than 1 multipliers
    so we get their actual contribution.

    Simple example
    baseValue: 100
    multipliers: 1.15, 1.30, 0.75, 0.50
    maximumBaseValue = 149,5
    difference = 49,5
    calculatedValue = 56,0625
    difference = 93,5
    impacts: 0,33 0,66 0,33 0,66
    values: 16,5 33  31,16  62,33
    final: 6,18  12,37 -31,16 -62,33
*/

function calculateDifficultyObjectBuildUp(baseValue, multipliers) {
    let maximumBaseValue = baseValue;
    let positiveSum = 0;
    let negativeSum = 0;
    let buildUp = [];
    buildUp.push(0);
    for (let i = 0; i < multipliers.length; ++i) {
        if (multipliers[i] > 1) {
            positiveSum += multipliers[i] - 1;
            maximumBaseValue *= multipliers[i];
        }
        if (multipliers[i] < 1) {
            negativeSum += 1 - multipliers[i];
        }
        buildUp.push(0);
    }
    let positiveDifference = maximumBaseValue - baseValue;
    let negativeDifference = maximumBaseValue;
    let caulculatedValue = maximumBaseValue;
    for (let i = 0; i < multipliers.length; ++i) {
        if (multipliers[i] < 1) {
            negativeDifference *= multipliers[i];
            positiveDifference *= multipliers[i];
            caulculatedValue *= multipliers[i];
        }
    }
    negativeDifference = maximumBaseValue - negativeDifference;
    for (let i = 0; i < multipliers.length; ++i) {
        if (multipliers[i] > 1) {            
            buildUp[i + 1] = ((multipliers[i] - 1) / positiveSum) * positiveDifference;
            //buildUp[i + 1] = buildUp[i + 1] * (caulculatedValue / maximumBaseValue)
        }
        if (multipliers[i] < 1) {
            buildUp[i + 1] = ((1 - multipliers[i]) / negativeSum) * negativeDifference;
            //buildUp[i + 1] = buildUp[i + 1] * (negativeDifference / caulculatedValue)
        }
    }
    buildUp[0] = caulculatedValue;
    for (let i = 1; i < buildUp.length;++i)
    {
        if (multipliers[i - 1] > 1)
            buildUp[0] -= buildUp[i];
    }
    return buildUp;
}

let builduptableSelectedDif = -1;
let builduptableNotCachedDifIds = [];
let builduptableFilteredText = "";
let builduptablePreviousFilteredText = "";
let builduptableCursorPosition = 0;
let buildupshowdistance = false;
let buildupScaleValues = false;
let buildupTimeMultiplier = 1.0;

let buildupNoteMultiplierColors = [];
let buildupShowMultipliers = [];
let buildupShowLessThanOne = true;

function LoadDiffGraph() {
    document.getElementById("container").innerHTML = 
    "<div style=\"display:flex; flex-direction:row; justify-content:center; width:100%;\">"
    +"<input type=\"button\" id=\"applynomod\" value=\"No mod\">"
    +"<input type=\"button\" id=\"applydoubletimenightcore\" value=\"DT/NC\">"
    +"<input type=\"button\" id=\"applyhalftimedaycore\" value=\"HT/DC\">"
    +"</div>"
    +"<div style=\"display:flex; flex-direction:column;\">"
    +"Speed (1.5 is DT/NC, 0.75 HT/DC)"
    +"<input type=\"number\" name=\"odtabletimescale\" id=\"builduptimescale\" step=\"0.05\" value=\"1\"></input>"    
    +"</div>"
    +"<div style=\"display:flex; flex-direction:row;\"><input id=\"showdistance\" type=\"checkbox\"> Show distance</div>"
    +"<div style=\"display:flex; flex-direction:row;\"><input id=\"scalegraphvalues\" type=\"checkbox\" checked> Scale values</div>"
    +"<div id=\"diffgraphdatadisplay\" style=\"display:flex; align-items: flex-start; width:100%;\">"   
    + "<div id=\"beatmapdiflist\" style=\"display:flex; flex-direction:column; align-self:left;\"></div>"
    + "<div id=\"graphdisplay\" style=\" overflow-x: auto;\">"
    + "<div id=\"beatmapdifdata\"></div>"
    + "<div id=\"graphlabels\" style=\"display:flex; flex-wrap:wrap;\"></div>"
    +"<div id=\"linegraph\"></div>"
    +"</div>"
    
    + "</div>";
    LoadDiffGraphDifs();
    document.getElementById("showdistance").addEventListener("change", async (event) => {
        buildupshowdistance = document.getElementById("showdistance").checked;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("showdistance").checked = buildupshowdistance;
    document.getElementById("scalegraphvalues").addEventListener("change", async (event) => {
        buildupScaleValues = document.getElementById("scalegraphvalues").checked;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("scalegraphvalues").checked = buildupScaleValues;
    document.getElementById("builduptimescale").addEventListener("change", async (event) => {
        buildupTimeMultiplier = document.getElementById("builduptimescale").value;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("applynomod").addEventListener("click", async (event) => {
        buildupTimeMultiplier = 1.0;
        document.getElementById("builduptimescale").value = 1.0;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("applydoubletimenightcore").addEventListener("click", async (event) => {
        buildupTimeMultiplier = 1.5;
        document.getElementById("builduptimescale").value = 1.5;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("applyhalftimedaycore").addEventListener("click", async (event) => {
        buildupTimeMultiplier = 0.75;
        document.getElementById("builduptimescale").value = 0.75;
        if (builduptableSelectedDif != -1)
        {
            Createbuilduptable();
        }
    });
    document.getElementById("builduptimescale").value = buildupTimeMultiplier;
}

function LoadDiffGraphDifs()
{
    builduptableNotCachedDifIds = [];
    let diflisttext = "<input type=\"text\" name=\"builduptablemapsearch\" placeholder=\"Search for song titles...\" id=\"builduptablemapsearch\" value=\""+builduptableFilteredText+"\">";
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i] || (builduptableFilteredText != "" && !songNames[i].toLowerCase().includes(builduptableFilteredText.toLowerCase())))
            continue;
        builduptableNotCachedDifIds.push(i);
        diflisttext += "<div id=\"mapdiff"+(builduptableNotCachedDifIds.length-1)+"\" class=\"buttonstyle\" style=\"width:400px; margin-top:5px\">";
        diflisttext += "<div>"+songNames[i]+"</div>"
        diflisttext += "<div>"+difficultyNames[i]+"</div>"
        diflisttext += "</div>"
    }
    if (builduptableSelectedDif >= builduptableNotCachedDifIds.length)
        builduptableSelectedDif = -1;
    document.getElementById("beatmapdiflist").innerHTML = diflisttext;
    if (builduptablePreviousFilteredText != builduptableFilteredText)
    {
        document.getElementById("builduptablemapsearch").focus();
        builduptablePreviousFilteredText = builduptableFilteredText;
        document.getElementById("builduptablemapsearch").setSelectionRange(builduptableCursorPosition, builduptableCursorPosition);
    }
    document.getElementById("builduptablemapsearch").addEventListener("input", (e) => {
        builduptableFilteredText = e.target.value;
        builduptableCursorPosition = e.target.selectionStart;
        LoadDiffGraphDifs();
    });
    for (let i = 0; i < builduptableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).addEventListener("click", async (event) => {
            HitObjectClearSelection();
            document.getElementById(buttonId).className += " selected";
            builduptableSelectedDif = builduptableNotCachedDifIds[i];
            document.getElementById("beatmapdifdata").scrollIntoView({
                behavior: "instant"
              });
            document.getElementById("beatmapdifdata").innerHTML = songNames[builduptableNotCachedDifIds[i]] + "<br>"+ difficultyNames[builduptableNotCachedDifIds[i]] 
            + "<br>OD: " +Math.round(scaleDifficultySpeed(difficultyList[builduptableNotCachedDifIds[i]],buildupTimeMultiplier).overallDifficulty * 100) / 100;
            Createbuilduptable();
        });        
    }
}

function HitObjectClearSelection()
{
    for (let i = 0; i < builduptableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).className = document.getElementById(buttonId).className.replace(" selected", "");
    }
}

function Createbuilduptable()
{
    document.getElementById("beatmapdifdata").innerHTML = songNames[builduptableSelectedDif] + "<br>"+ difficultyNames[builduptableSelectedDif] 
    + "<br>OD: " +Math.round(scaleDifficultySpeed(difficultyList[builduptableSelectedDif],buildupTimeMultiplier).overallDifficulty * 100) / 100;
    previousGraphRandomNumber = 0;
    let localbuildupvalues=valerusReworkBuildup(scaleDifficultySpeed(difficultyList[builduptableSelectedDif],buildupTimeMultiplier));
    let localNoteStartTimes = localbuildupvalues[0];
    let localNoteBaseValues = localbuildupvalues[1];

    let localNoteMultiplierNames = localbuildupvalues[2];
    let localNoteMultiplierValues = localbuildupvalues[3];
    buildupNoteMultiplierColors = localbuildupvalues[4]
    //if (buildupNoteMultiplierColors.length == 0)
    //{
    //    for (let i = 0; i < localNoteMultiplierNames.length+1; ++i)
    //    {
    //        buildupShowMultipliers.push(true);
    //        let localColor = GenerateColor();
    //        let localPossibleR = localColor[0];
    //        let localPossibleG = localColor[1];
    //        let localPossibleB = localColor[2];
    //        let notGoodColor = false;
    //        for (let j = 0; j < i; ++j)
    //        {
    //            let localR = buildupNoteMultiplierColors[0];
    //            let localG = buildupNoteMultiplierColors[1];
    //            let localB = buildupNoteMultiplierColors[2];
    //            if (Math.abs(localR - localPossibleR) < 50 && Math.abs(localG - localPossibleG) < 50
    //            && Math.abs(localB - localPossibleB) < 50)
    //            {
    //                i--;
    //                notGoodColor = true;
    //                break;
    //            }
    //        }
    //        if (notGoodColor)
    //            continue;
    //        buildupNoteMultiplierColors.push(localColor);
    //    }
    //}
    if (buildupShowMultipliers.length == 0)
    {
        for (let i = 0; i < buildupNoteMultiplierColors.length; ++i)
        {
            buildupShowMultipliers.push(true);
        }
    }
    let localNoteBuildUps = [];
    let localNoteBaseValueMax = 0;
    for (let i = 0; i < localNoteBaseValues.length; ++i)
    {
        let localSingleNoteMultiplierValues = [];
        for (let j = 0; j < localNoteMultiplierValues.length; ++j)
        {
            localSingleNoteMultiplierValues.push(localNoteMultiplierValues[j][i]);
        }
        localNoteBuildUps.push(calculateDifficultyObjectBuildUp(localNoteBaseValues[i], localSingleNoteMultiplierValues));
        let sum = 0;
        for (let j = 0; j < localNoteBuildUps[localNoteBuildUps.length - 1].length; ++j)
        {
            if (buildupShowMultipliers[j] || !buildupScaleValues)
                sum += localNoteBuildUps[localNoteBuildUps.length - 1][j];
        }
        if (sum > localNoteBaseValueMax)
            localNoteBaseValueMax = sum;
    }

    let localTypingSectionBaseValues = localbuildupvalues[5];
    let localTypingSectionMultiplierNames = localbuildupvalues[6];
    let localTypingSectionMultiplierValues = localbuildupvalues[7];
    let localTypingSectionMultiplierColors = [];    
    //for (let i = 0; i < localTypingSectionMultiplierNames.length+1; ++i)
    //{
    //    let localColor = GenerateColor();
    //    let localPossibleR = localColor[0];
    //    let localPossibleG = localColor[1];
    //    let localPossibleB = localColor[2];
    //    let notGoodColor = false;
    //    for (let j = 0; j < i; ++j)
    //    {
    //        let localR = localTypingSectionMultiplierColors[0];
    //        let localG = localTypingSectionMultiplierColors[1];
    //        let localB = localTypingSectionMultiplierColors[2];
    //        if ((Math.abs(localR - localPossibleR) < 80 && Math.abs(localG - localPossibleG) < 80
    //        && Math.abs(localB - localPossibleB) < 80) 
    //        || (Math.abs(localR - localPossibleR) < 90 && Math.abs(localG - localPossibleG) < 90) 
    //        || (Math.abs(localR - localPossibleR) < 90 && Math.abs(localB - localPossibleB) < 90) 
    //        || (Math.abs(localG - localPossibleG) < 90 && Math.abs(localB - localPossibleB) < 90)
    //        )
    //        {
    //            i--;
    //            notGoodColor = true;
    //            break;
    //        }
    //    }
    //    if (notGoodColor)
    //        continue;
    //    localTypingSectionMultiplierColors.push(localColor);
    //}

    
    let localNegateBorderWidths = 1;
    let labelText = "";
    let baseValueColor = buildupNoteMultiplierColors[0];
    let stringBaseValueColor = baseValueColor[0] + ","+baseValueColor[1]+","+baseValueColor[2];
    labelText += "<div id=\"basevalue\" style=\"display:flex; flex-direction:row;\"><div style=\"width:30px; height:30px; background-color:rgb("+stringBaseValueColor+")\"></div><div>baseValue</div></div>"
    for (let i = 0; i < localNoteMultiplierNames.length; ++i)
    {
        labelText += "<div id=\""+localNoteMultiplierNames[i]+"\" style=\"display:flex; flex-direction:row;\"><div style=\"width:30px; height:30px; background-color:rgb("+buildupNoteMultiplierColors[i+1]+")\"></div><div>"+localNoteMultiplierNames[i]+"</div></div>";
    }
    labelText += "<div id=\"lessthanonemultiplier\" style=\"display:flex; flex-direction:row;\"><div style=\"width:"+(30-2*localNegateBorderWidths)+"px; height:"+(30-2*localNegateBorderWidths)+"px; border: "+localNegateBorderWidths+"px solid rgb(230,60,60)\"></div><div>LessThanOneModifierEffect</div></div>"
    document.getElementById("graphlabels").innerHTML = labelText;
    for (let i = 0; i < localNoteMultiplierNames.length; ++i)
    {
        document.getElementById(localNoteMultiplierNames[i]).addEventListener("click", async (event) => {
            buildupShowMultipliers[i+1] = !buildupShowMultipliers[i+1];
            Createbuilduptable();
        });
    }
    document.getElementById("basevalue").addEventListener("click", async (event) => {
        buildupShowMultipliers[0] = !buildupShowMultipliers[0];
        Createbuilduptable();
    });
    document.getElementById("lessthanonemultiplier").addEventListener("click", async (event) => {
        buildupShowLessThanOne = !buildupShowLessThanOne;
        Createbuilduptable();
    });
    let graphText = "";
    let localMaxHeight = 300;
    let localColumnWidths = 10;
    if (!buildupshowdistance)
        localColumnWidths = 8;
    for (let i = 0; i < localNoteBaseValues.length; ++i)
    {
        if (i != 0 && buildupshowdistance)
        {
            let localDurationWidth = Math.floor((localNoteStartTimes[i] - localNoteStartTimes[i - 1])/1000 * localColumnWidths);
            if (localDurationWidth > 0)
                graphText += "<div style=\"height:"+localMaxHeight+"px; width:"+localDurationWidth+"px;\"></div>"; 
        }
        graphText += "<div style=\"height:"+localMaxHeight+"px; padding:0; width:"+localColumnWidths+"px; display:flex; flex-direction:column-reverse\">";
        
        for (let j = 0; j < localNoteBuildUps[i].length; ++j)
        {
            let localColor = buildupNoteMultiplierColors[j];
            let localColorString = localColor[0]+","+localColor[1]+","+localColor[2];
            if (!buildupShowMultipliers[j])
                continue;
            if (localNoteBuildUps[j] == 0)
                continue;
            if (j == 0 || localNoteMultiplierValues[j-1][i] > 1)
                graphText += "<div style=\"background-color:rgb("+localColorString+"); padding:0; width:"+localColumnWidths+"px; height:"+Math.round(localMaxHeight * (localNoteBuildUps[i][j]/localNoteBaseValueMax))+"px;\"></div>"
        }
        let isThereLessThanOneToShow = false;
        for (let j = 0; j < localNoteBuildUps[i].length; ++j)
        {
            if (!buildupShowMultipliers[j])
                continue;
            if (localNoteBuildUps[j] == 0)
                continue;
            if (j != 0 && localNoteMultiplierValues[j-1][i] < 1)
            {
                isThereLessThanOneToShow = true;
                break;
            }                
        }
        if (buildupShowLessThanOne && isThereLessThanOneToShow)
            graphText += "<div style=\"display:flex; flex-wrap:nowrap; padding:0; flex-direction:column-reverse; border: "+localNegateBorderWidths+"px solid rgb(230,60,60);\">"
        for (let j = 0; j < localNoteBuildUps[i].length; ++j)
        {
            let localColor = buildupNoteMultiplierColors[j];
            let localColorString = localColor[0]+","+localColor[1]+","+localColor[2];
            if (!buildupShowMultipliers[j])
                continue;
            if (localNoteBuildUps[j] == 0)
                continue;
            let localmarginleft = 0;
            let localNoteWidth = localColumnWidths - 2* localNegateBorderWidths;
            if (!buildupShowLessThanOne)
            {
                localmarginleft = localNegateBorderWidths;
            }
            if (j != 0 && localNoteMultiplierValues[j-1][i] < 1)
                graphText += "<div style=\"background-color:rgb("+localColorString+");  padding:0; margin-left:"+localmarginleft+"px; width:"+localNoteWidth+"px; height:"+Math.round(localMaxHeight * (localNoteBuildUps[i][j]/localNoteBaseValueMax))+"px;\"></div>"
        }
        if (buildupShowLessThanOne)
            graphText += "</div>"
        graphText += "</div>"
    }
    document.getElementById("linegraph").innerHTML = graphText;
}


/*let hashValue = 2;
function HashFunction()
{
    hashValue *= 6408713;
    hashValue ^= 5330797;
    hashValue *= 4574741;
    hashValue ^= 7192349;
    hashValue = Math.abs(hashValue);
    hashValue += 2663461;
    return (hashValue % 8486771) / 8486771;
}
for (let i = 0; i < 100;  ++i)
{
    HashFunction();
}

function GenerateColor()
{
    let g = 0;
    let r = 0;
    let b = 0;
    let randomNumber = Math.floor(Math.random() * 1000);
    if (randomNumber % 3 == 0)
        g = Math.floor(HashFunction() * 70) + 185;
    else
        g = Math.floor(HashFunction() * 80) + 100;
    if (randomNumber % 3 == 1)
        r = Math.floor(HashFunction() * 70) + 185;
    else
        r = Math.floor(HashFunction() * 80) + 100;
    if (randomNumber % 3 == 2)
        b = Math.floor(HashFunction() * 70) + 185;
    else
        b = Math.floor(HashFunction() * 80) + 100;
   
    
    return [r, g, b];
}*/