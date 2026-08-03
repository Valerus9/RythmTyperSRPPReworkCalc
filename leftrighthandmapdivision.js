let leftrighthandtableSelectedDif = -1;
let leftrighthandtableNotCachedDifIds = [];
let leftrighthandtableFilteredText = "";
let leftrighthandtablePreviousFilteredText = "";
let leftrighthandtableCursorPosition = 0;
let leftrighthandshowdistance = false;
let leftrighthandScaleValues = false;
let leftrighthandScaleColumnWidth = true;
let leftrighthandTimeMultiplier = 1.0;

let leftrighthandNoteMultiplierColors = [];
let leftrighthandShowMultipliers = [];
let leftrighthandShowLessThanOne = true;
let leftrighthandSelectedBuildup = 0;

function loadLeftRightHand() {
    document.getElementById("container").innerHTML = 
    "<div style=\"display:flex; flex-direction:row; width:100%;\">"
    +"<div>"
    +"<div id=\"beatmapdiflist\"></div>"
    +"</div>"
    +"<div style=\"flex-grow: 1;\">"
    +"<div class=\"neededpadding\" style=\"display:flex; flex-direction:row; justify-content:center; width:100%;\">"
    +"<select id=\"ppsrleftrighthandselect\">"
    +"</select>"
    +"</div>"
    +"<div id=\"beatmapdifdata\" class=\"neededpadding\"></div>"
    +"<div id=\"beatmaptimehoverdata\" class=\"neededpadding\"></div>"
    +"<div id=\"graphlabels\" style=\"display:flex; flex-direction:row; flex-wrap:wrap;\"></div>"
    +"</div>"
    +"</div>"
    +"<div class=\"neededpadding\">Each vertical line is one tap/hold note. Typing sections aren't shown.</div>"
    +"<div id=\"linegraph\" style=\"display:flex; flex-direction:row; overflow-x:auto; width:100%;\"></div>"
    let ppsrleftrighthandselect = document.getElementById("ppsrleftrighthandselect");
    let ppsrleftrighthandselectText = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    let leftrighthandCounter = 0;
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i], "handseparation"))
            continue;
        if (leftrighthandCounter == 0) {
            ppsrleftrighthandselectText += "<option value=\"" + (i + 1) + "\" selected>" + reworks[i].name + "</option>\n";
            leftrighthandSelectedBuildup = i;
        }
        else {
            ppsrleftrighthandselectText += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
        leftrighthandCounter++;
    }
    ppsrleftrighthandselect.innerHTML = ppsrleftrighthandselectText;
    document.getElementById("ppsrleftrighthandselect").addEventListener("change", async (event) => {
        leftrighthandSelectedBuildup = event.target.value - 1;
        if (leftrighthandtableSelectedDif != -1)
        {
            Createleftrighthandseparation();
        }
    });
    LoadListLeftRightHand();
}

function LoadListLeftRightHand()
{
    leftrighthandtableNotCachedDifIds = [];
    let diflisttext = "<input type=\"text\" name=\"leftrighthandtablemapsearch\" placeholder=\"Search for song titles...\" id=\"leftrighthandtablemapsearch\" value=\""+leftrighthandtableFilteredText+"\">";
    diflisttext += "<div style=\"height:400px; overflow-y:auto;\">";
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i] || (leftrighthandtableFilteredText != "" && !songNames[i].toLowerCase().includes(leftrighthandtableFilteredText.toLowerCase())))
            continue;
        leftrighthandtableNotCachedDifIds.push(i);
        diflisttext += "<div class=\"neededpadding buttonstyle\" id=\"mapdiff"+(leftrighthandtableNotCachedDifIds.length-1)+"\"  style=\"width:400px; margin-top:5px\">";
        diflisttext += "<div>"+songNames[i]+"</div>"
        diflisttext += "<div>"+difficultyNames[i]+"</div>"
        diflisttext += "</div>"
    }
    diflisttext += "</div>";
    if (leftrighthandtableSelectedDif >= leftrighthandtableNotCachedDifIds.length)
        leftrighthandtableSelectedDif = -1;
    document.getElementById("beatmapdiflist").innerHTML = diflisttext;
    if (leftrighthandtablePreviousFilteredText != leftrighthandtableFilteredText)
    {
        document.getElementById("leftrighthandtablemapsearch").focus();
        leftrighthandtablePreviousFilteredText = leftrighthandtableFilteredText;
        document.getElementById("leftrighthandtablemapsearch").setSelectionRange(leftrighthandtableCursorPosition, leftrighthandtableCursorPosition);
    }
    document.getElementById("leftrighthandtablemapsearch").addEventListener("input", (e) => {
        leftrighthandtableFilteredText = e.target.value;
        leftrighthandtableCursorPosition = e.target.selectionStart;
        LoadListLeftRightHand();
    });
    for (let i = 0; i < leftrighthandtableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).addEventListener("click", async (event) => {
            HitObjectClearSelection();
            document.getElementById(buttonId).className += " selected";
            leftrighthandtableSelectedDif = leftrighthandtableNotCachedDifIds[i];
            document.getElementById("beatmapdifdata").scrollIntoView({
                behavior: "instant"
              });
            document.getElementById("beatmapdifdata").innerHTML = songNames[leftrighthandtableNotCachedDifIds[i]] + "<br>"+ difficultyNames[leftrighthandtableNotCachedDifIds[i]] 
            + "<br>OD: " +Math.round(scaleDifficultySpeed(difficultyList[leftrighthandtableNotCachedDifIds[i]],leftrighthandTimeMultiplier).overallDifficulty * 100) / 100;
            Createleftrighthandseparation();
        });        
    }
}

function HitObjectClearSelection()
{
    for (let i = 0; i < leftrighthandtableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).className = document.getElementById(buttonId).className.replace(" selected", "");
    }
}

function Createleftrighthandseparation()
{
    let leftRightHand = reworks[leftrighthandSelectedBuildup].handseparation.calculate(ConvertDifficultyData([difficultyList[leftrighthandtableSelectedDif]])[0]);
    let leftRightHandDifficulty = difficultyList[leftrighthandtableSelectedDif];
    let copiedNotes = [];
    for (let i = 0; i < leftRightHandDifficulty.notes.length; ++i)
    {
        if (leftRightHandDifficulty.notes[i].type == "tap")
        {
            let tempTap = {
                key: leftRightHandDifficulty.notes[i].key,
                time: leftRightHandDifficulty.notes[i].time,
                type: leftRightHandDifficulty.notes[i].type,
                layer: leftRightHandDifficulty.notes[i].layer,
            }
            copiedNotes.push(tempTap);
        }
        if (leftRightHandDifficulty.notes[i].type == "hold")
        {
            let tempHold = {
                key: leftRightHandDifficulty.notes[i].key,
                startTime: leftRightHandDifficulty.notes[i].startTime,
                endTime: leftRightHandDifficulty.notes[i].endTime,
                type: leftRightHandDifficulty.notes[i].type,
                layer: leftRightHandDifficulty.notes[i].layer,
            }
            copiedNotes.push(tempHold);
        }
    }
    for (let i = 0; i <copiedNotes.length; ++i)
    {
        if (leftRightHand.leftHandIds.includes(i))
        {
            copiedNotes[i].layer = "lefthand";
        }
        if (leftRightHand.rightHandIds.includes(i))
        {
            copiedNotes[i].layer = "righthand";
        }
        if (!leftRightHand.leftHandIds.includes(i)  && !leftRightHand.rightHandIds.includes(i))
        {
            copiedNotes[i].layer = "undecided";
        }
    }
    let copiedDifficulty = {
        mapsetId: leftRightHandDifficulty.mapsetId,
        diffId: leftRightHandDifficulty.diffId,
        name: leftRightHandDifficulty.name + " LRHand",
        overallDifficulty: leftRightHandDifficulty.overallDifficulty,
        customKeysEnabled: leftRightHandDifficulty.customKeysEnabled,
        numberRowEnabled: leftRightHandDifficulty.numberRowEnabled,
        spacebarEnabled: leftRightHandDifficulty.spacebarEnabled,
        layersEnabled: true,
        layers: [{id: "lefthand", name: "Left hand"},{id: "righthand", name: "Right hand"},{id: "undecided", name: "Undecided"}],
        bgFile: leftRightHandDifficulty.bgFile,
        bookmarks: leftRightHandDifficulty.bookmarks,
        notes: copiedNotes,
        typingSections: leftRightHandDifficulty.typingSections,
    }
    const json = JSON.stringify(copiedDifficulty,null, 2);

    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = leftRightHandDifficulty.name + " LRHand.rtm.json";
    a.click();

    URL.revokeObjectURL(url);
}

