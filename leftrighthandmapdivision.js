function loadLeftRightHand()
{
    document.getElementById("container").innerHTML =     
    "<div style=\"display:flex; flex-direction:row;\">"
    + "<div class=\"neededpadding\" id=\"beatmapdiflist\" style=\"display:flex; flex-direction:column; align-self:left;\"></div>"
    + "<div>"
    +"<div class=\"neededpadding\" style=\"display:flex; flex-direction:row; justify-content:center; width:100%;\">"
    +"<input type=\"button\" id=\"applynomod\" value=\"No mod\">"
    +"<input type=\"button\" id=\"applydoubletimenightcore\" value=\"DT/NC\">"
    +"<input type=\"button\" id=\"applyhalftimedaycore\" value=\"HT/DC\">"
    +"</div>"
    +"<div class=\"neededpadding\" style=\"display:flex; flex-direction:column;\">"
    +"Speed (1.5 is DT/NC, 0.75 HT/DC)"
    +"<input type=\"number\" name=\"odtabletimescale\" id=\"odtabletimescale\" step=\"0.05\" value=\"1\"></input>"
    +"</div>"
    +"<div class=\"neededpadding\" id=\"datadisplay\" style=\"display:flex; width:100%\">"
    + "<div id=\"tabledisplay\">"
    + "<div id=\"beatmapdifdata\"></div>"
    +"<table id=\"odchangesdisplay\"></table>"
    +"</div>"
    + "</div>"
    + "</div>"
    + "</div>"
    + "</div>";
    LoadDifs();
    document.getElementById("odtabletimescale").addEventListener("change", async (event) => {
        odtableMultiplier = document.getElementById("odtabletimescale").value;
        if (odtableSelectedDif != -1)
        {
            CreateBeatmapViewer();
        }
    });
    document.getElementById("applynomod").addEventListener("click", async (event) => {
        odtableMultiplier = 1.0;
        document.getElementById("odtabletimescale").value = 1.0;
        if (odtableSelectedDif != -1)
        {
            CreateBeatmapViewer();
        }
    });
    document.getElementById("applydoubletimenightcore").addEventListener("click", async (event) => {
        odtableMultiplier = 1.5;
        document.getElementById("odtabletimescale").value = 1.5;
        if (odtableSelectedDif != -1)
        {
            CreateBeatmapViewer();
        }
    });
    document.getElementById("applyhalftimedaycore").addEventListener("click", async (event) => {
        odtableMultiplier = 0.75;
        document.getElementById("odtabletimescale").value = 0.75;
        if (odtableSelectedDif != -1)
        {
            CreateBeatmapViewer();
        }
    });
    document.getElementById("odtabletimescale").value = odtableMultiplier;
}

function LoadDifs()
{
    odtableNotCachedDifIds = [];
    let diflisttext = "<input type=\"text\" name=\"odtablemapsearch\" placeholder=\"Search for song titles...\" id=\"odtablemapsearch\" value=\""+odtableFilteredText+"\">";
    diflisttext += "<div style=\"height:400px; overflow-y:auto;\">";
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i] || (odtableFilteredText != "" && !songNames[i].toLowerCase().includes(odtableFilteredText.toLowerCase())))
            continue;
        odtableNotCachedDifIds.push(i);
        diflisttext += "<div class=\"neededpadding buttonstyle\" id=\"mapdiff"+(odtableNotCachedDifIds.length-1)+"\" style=\"width:400px; margin-top:5px\">";
        diflisttext += "<div>"+songNames[i]+"</div>"
        diflisttext += "<div>"+difficultyNames[i]+"</div>"
        diflisttext += "</div>"
    }
    diflisttext += "</div>"
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
            ClearBeatmapSelection();
            document.getElementById(buttonId).className += " selected";
            odtableSelectedDif = odtableNotCachedDifIds[i];
            document.getElementById("beatmapdifdata").scrollIntoView({
                behavior: "instant"
              });
            document.getElementById("beatmapdifdata").innerHTML = songNames[odtableNotCachedDifIds[i]] + "<br>"+ difficultyNames[odtableNotCachedDifIds[i]] 
            + "<br>Original OD: "+ODs[odtableNotCachedDifIds[i]];
            CreateBeatmapViewer();
        });        
    }
}

function ClearBeatmapSelection()
{
    for (let i = 0; i < odtableNotCachedDifIds.length; ++i)
    {
        let buttonId = "mapdiff"+i;
        document.getElementById(buttonId).className = document.getElementById(buttonId).className.replace(" selected", "");
    }
}

function CreateBeatmapViewer()
{
    
}