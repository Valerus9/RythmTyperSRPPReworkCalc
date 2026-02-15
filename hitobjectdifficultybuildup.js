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

let localNoteMultiplierColors = [];

function LoadDiffGraph() {
    document.getElementById("container").innerHTML = "<div id=\"diffgraphdatadisplay\" style=\"display:flex; align-items: flex-start; width:100%;\">"
    + "<div id=\"beatmapdiflist\" style=\"display:flex; flex-direction:column; align-self:left;\"></div>"
    + "<div id=\"graphdisplay\" style=\" overflow-x: auto;\">"
    + "<div id=\"beatmapdifdata\"></div>"
    + "<div id=\"graphlabels\" style=\"display:flex; flex-wrap:wrap;\"></div>"
    +"<div id=\"linegraph\"></div>"
    +"</div>"
    
    + "</div>";
    LoadDiffGraphDifs();
    
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
            document.getElementById("beatmapdifdata").innerHTML = songNames[builduptableNotCachedDifIds[i]] + "<br>"+ difficultyNames[builduptableNotCachedDifIds[i]];
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
    previousGraphRandomNumber = 0;
    let localbuildupvalues=valerusReworkBuildup(difficultyList[builduptableSelectedDif]);
    let localNoteStartTimes = localbuildupvalues[0];
    let localNoteBaseValues = localbuildupvalues[1];

    let localNoteMultiplierNames = localbuildupvalues[2];
    let localNoteMultiplierValues = localbuildupvalues[3];
    if (localNoteMultiplierColors.length == 0)
    {
        for (let i = 0; i < localNoteMultiplierNames.length+1; ++i)
        {
            localNoteMultiplierColors.push(GenerateColor());
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
            sum += localNoteBuildUps[localNoteBuildUps.length - 1][j];
        }
        if (sum > localNoteBaseValueMax)
            localNoteBaseValueMax = sum;
    }

    let localTypingSectionBaseValues = localbuildupvalues[4];
    let localTypingSectionMultiplierNames = localbuildupvalues[5];
    let localTypingSectionMultiplierValues = localbuildupvalues[6];
    let localTypingSectionMultiplierColors = [];
    for (let i = 0; i < localTypingSectionMultiplierNames.length+1; ++i)
    {
        localTypingSectionMultiplierColors.push(GenerateColor());
    }

    let labelText = "";
    labelText += "<div style=\"display:flex; flex-direction:row;\"><div style=\"width:30px; height:30px; background-color:rgb("+localNoteMultiplierColors[0]+")\"></div><div>baseValue</div></div>"
    for (let i = 0; i < localNoteMultiplierNames.length; ++i)
    {
        labelText += "<div style=\"display:flex; flex-direction:row;\"><div style=\"width:30px; height:30px; background-color:rgb("+localNoteMultiplierColors[i+1]+")\"></div><div>"+localNoteMultiplierNames[i]+"</div></div>";
    }
    document.getElementById("graphlabels").innerHTML = labelText;

    let graphText = "";
    let localMaxHeight = 300;
    let localColumnWidths = 10;
    let localNegateBorderWidths = 1;
    for (let i = 0; i < localNoteBaseValues.length; ++i)
    {
        if (i != 0)
        {
            let localDurationWidth = Math.floor((localNoteStartTimes[i] - localNoteStartTimes[i - 1])/1000 * localColumnWidths);
            if (localDurationWidth > 0)
                graphText += "<div style=\"height:"+localMaxHeight+"; width:"+localDurationWidth+";\"></div>"; 
        }
        graphText += "<div style=\"height:"+localMaxHeight+"; padding:0; width:"+localColumnWidths+"; display:flex; flex-direction:column-reverse\">";
        for (let j = 0; j < localNoteBuildUps[i].length; ++j)
        {
            if (localNoteBuildUps[j] == 0)
                continue;
            if (j == 0 || localNoteMultiplierValues[j-1][i] > 1)
                graphText += "<div style=\"background-color:rgb("+localNoteMultiplierColors[j]+"); padding:0; width:"+localColumnWidths+"px; height:"+Math.round(localMaxHeight * (localNoteBuildUps[i][j]/localNoteBaseValueMax))+"px;\"></div>"
        }
        graphText += "<div style=\"display:flex; flex-wrap:nowrap; padding:0; flex-direction:column-reverse; border: "+localNegateBorderWidths+"px solid rgb(230,60,60);\">"
        for (let j = 0; j < localNoteBuildUps[i].length; ++j)
        {
            if (localNoteBuildUps[j] == 0)
                continue;
            if (j != 0 && localNoteMultiplierValues[j-1][i] < 1)
                graphText += "<div style=\"background-color:rgb("+localNoteMultiplierColors[j]+");  padding:0; width:"+(localColumnWidths - 2* localNegateBorderWidths)+"px; height:"+Math.round(localMaxHeight * (localNoteBuildUps[i][j]/localNoteBaseValueMax))+"px;\"></div>"
        }
        graphText += "</div>"
        graphText += "</div>"
    }
    document.getElementById("linegraph").innerHTML = graphText;
}

let previousGraphRandomNumber = 0;
function CreateGraphRandomNumber(min, max)
{
    let a = (11+max-min)*3583;
    let c = (17+max-min) * 5849;
    let m = max * 7919;
    previousGraphRandomNumber = (((previousGraphRandomNumber * a + c) % m) % max) / max * (max-min) + min;
    return Math.round(previousGraphRandomNumber);
}

function GenerateColor()
{
    let g = 0;
    let r = 0;
    let b = 0;
    if (previousGraphRandomNumber % 3 == 0)
        g = CreateGraphRandomNumber(200, 240);
    else
        g = CreateGraphRandomNumber(60, 160);
    if (previousGraphRandomNumber % 3 == 1)
        r = CreateGraphRandomNumber(200, 240);
    else
        r = CreateGraphRandomNumber(60, 160);
    if (previousGraphRandomNumber % 3 == 2)
        b = CreateGraphRandomNumber(200, 240);
    else
        b = CreateGraphRandomNumber(60, 160);
   

    return r+","+g+","+b;
}