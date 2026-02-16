let difTableColumnNames = ["Old star rank","New star rank", "Old PP rank", "New PP rank", "Old stars", "New stars", "Old PP", "New PP",
 "Song name", "Difficulty name", "BPM", "Drain time", "OD", "Note count", "TS count"];
let difTableColumnIds = ["oldStarRank","newStarRank","oldPPrank","newPPrank", "oldStars", "newStars", "oldPP", "newPP",
"songNames", "difficultyNames", "BPMs", "DrainTimes", "OverallDifficulty", "NoteCounts", "TypingSectionCounts"];
let difTableColumnTypes = ["rank","rank","rank","rank", "float", "float", "integer", "integer",
"search", "string", "integer", "time", "float", "integer", "integer"];
let difTableColumnWidths = [40, 100, 40, 100, 40, 40, 40, 40, 300, 160, 40, 40, 40, 40, 40];
let difTableColumnCompare = [-1, 0, -1, 2,  -1, 4, -1, 6,  -1, -1, -1, -1,  -1, -1, -1];

let oldStarRanks = [];
let newStarRanks = [];
let oldPPRanks = [];
let newPPRanks = [];

function CreateSelectContentBeatmap() {
    let selectsrFirst = document.getElementById("srcalcselectfirst");
    let selectsrtextFirst = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
    let srReworkKeys = Object.keys(starFormulas);
    for (let i = 0; i < srReworkKeys.length; ++i) {
        if (i == 0) {
            selectsrtextFirst += "<option selected value=\"" + (i + 1) + "\">" + srReworkKeys[i] + "</option>\n";
        }
        else {
            selectsrtextFirst += "<option value=\"" + (i + 1) + "\">" + srReworkKeys[i] + "</option>\n";
        }
    }
    selectsrFirst.innerHTML = selectsrtextFirst;
    let selectsrSecond = document.getElementById("srcalcselectsecond");
    let selectsrtextSecond = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
    for (let i = 0; i < srReworkKeys.length; ++i) {
        if (i == 1) {
            selectsrtextSecond += "<option value=\"" + (i + 1) + "\" selected>" + srReworkKeys[i] + "</option>\n";
        }
        else {
            selectsrtextSecond += "<option value=\"" + (i + 1) + "\">" + srReworkKeys[i] + "</option>\n";
        }
    }
    selectsrSecond.innerHTML = selectsrtextSecond;
    let selectppFirst = document.getElementById("ppcalcselectfirst");
    let selectpptextFirst = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    let ppReworkKeys = Object.keys(ppFormulas);
    for (let i = 0; i < ppReworkKeys.length; ++i) {
        if (i == 0) {
            selectpptextFirst += "<option selected value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }
        else {
            selectpptextFirst += "<option value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }
    }
    selectppFirst.innerHTML = selectpptextFirst;
    let selectppSecond = document.getElementById("ppcalcselectsecond");
    let selectpptextSecond = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < ppReworkKeys.length; ++i) {
        if (i == 1) {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\" selected>" + ppReworkKeys[i] + "</option>\n";
        }
        else {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }

    }
    selectppSecond.innerHTML = selectpptextSecond;
    let modSelect = document.getElementById("modselect");
    let modSelectText = "";
    for (let i = 0; i < modList.length; ++i) {
        if (i == 0) {
            modSelectText += "<option value=\"" + (i + 1) + "\" selected>" + modList[i] + "</option>\n";
        }
        else {
            modSelectText += "<option value=\"" + (i + 1) + "\">" + modList[i] + "</option>\n";
        }

    }
    modSelect.innerHTML = modSelectText;
    document.getElementById("srcalcselectfirst").addEventListener("change", async (event) => {
        srReworkFirst = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
        srReworkSecond = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
        ppReworkFirst = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("modselect").addEventListener("change", async (event) => {
        selectedMod = modList[event.target.value - 1];
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
}

function LoadMapDifLeaderboard() {
    document.getElementById("container").innerHTML = containerBody;

    let hasAnyCacheMaps = false;
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i])
        {
            hasAnyCacheMaps = true;
            break;
        }
    }

    if (!hasAnyCacheMaps)
    {
        document.getElementById("clearcachertms").style.display = "none";
        document.getElementById("cacheMessage").style.display = "none";
    }

    if (songNames.length == 0)
    {
        document.getElementById("clearrtms").style.display = "none";
    }
    else if (songNames.length > 0)
    {
        document.getElementById("clearrtms").style.display = "inline";
    }
    document.getElementById("srcalcselectfirst").addEventListener("change", async (event) => {
        srReworkFirst = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
        srReworkSecond = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
        ppReworkFirst = event.target.value - 1;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;        
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    CreateSelectContentBeatmap();
    CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);

    document.getElementById("clearrtms").addEventListener("click", async (event) => {
        ClearLoadedRTMS();
        document.getElementById("clearrtms").style.display = "none";
        document.getElementById("clearcachertms").style.display = "none";
        document.getElementById("cacheMessage").style.display = "none";
        document.getElementById("changemenudifferentodCalc").disabled = true;
        document.getElementById("changemenugraphviewofrework").disabled = true;
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });
    document.getElementById("clearcachertms").addEventListener("click", async (event) => {
        ClearCachedRTMS();
        document.getElementById("clearcachertms").style.display = "none";
        document.getElementById("cacheMessage").style.display = "none";
        if (songNames.length == 0)
        {
            document.getElementById("clearrtms").style.display = "none";
        }
        let isThereNotCache = false;
        for (let i = 0; i < isCache.length; ++i)
        {
            if (!isCache[i])
            {
                isThereNotCache = true;
                break;
            }
        }
        if (!isThereNotCache && songNames.length > 0)
        {
            document.getElementById("changemenudifferentodCalc").disabled = false;
            document.getElementById("changemenugraphviewofrework").disabled = false;
        }
        CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    });

    document.getElementById("zipInput").addEventListener("change", async (event) => {
        const files = [...event.target.files].filter(f => f.name.endsWith(".rtm"));
        await LoadMapDataValues(await CreateMapData(files));
        document.getElementById("warningcacheonly").style.display = "none";
        document.getElementById("changemenudifferentodCalc").disabled = false;
        document.getElementById("changemenugraphviewofrework").disabled = false;
    });
}

async function LoadMapDataValues(localValues)
{
    for (let i = 0; i < localValues[0].length; ++i)
    {
        if (LoadedBeatmapIds.includes(localValues[0][i].mapsetId))
        {
            for (let j = 0; j < LoadedBeatmapIds.length; ++j)
            {
                if (LoadedBeatmapIds[j] != localValues[0][i].mapsetId || LoadedDifficultyIds[j] != localValues[1][i].diffId || !isCache[j])
                    continue;
                LoadedBeatmapIds.splice(j, 1);
                LoadedDifficultyIds.splice(j, 1);
                beatmapList.splice(j, 1);
                difficultyList.splice(j, 1);
                LoadedBeatmapIds.splice(j, 1);
                LoadedDifficultyIds.splice(j, 1);
                songNames.splice(j, 1);
                difficultyNames.splice(j, 1);
                BPMs.splice(j, 1);
                DrainTimes.splice(j, 1);
                ODs.splice(j, 1);
                NoteCounts.splice(j, 1);
                TypingSectionCounts.splice(j, 1);
                isCache.splice(j, 1);
                oldStarRanks.splice(j, 1);
                newStarRanks.splice(j, 1);
                oldPPRanks.splice(j, 1);
                newPPRanks.splice(j, 1);
                for (let k = 0; k < Stars.length; ++k)
                {
                    Stars[k].splice(j, 1);
                    StarHTDCs[k].splice(j, 1);
                    StarDTNCs[k].splice(j, 1);
                }
                for (let k = 0; k < PPs.length; ++k)
                {
                    PPs[k].splice(j, 1);
                    PPHTDCs[k].splice(j, 1);
                    PPDTNCs[k].splice(j, 1);                        
                }
            }
        }
        LoadedBeatmapIds.push(localValues[0][i].mapsetId);
        LoadedDifficultyIds.push(localValues[1][i].diffId);
        localDifficultyValues = CreateDifficultyData([localValues[1][i]]);
        for (let i = 0; i < localDifficultyValues[0].length; ++i)
        {
            for (let j = 0; j < localDifficultyValues[0][i].length; ++j)
            {
                Stars[i].push(localDifficultyValues[0][i][j]);
                StarHTDCs[i].push(localDifficultyValues[1][i][j]);
                StarDTNCs[i].push(localDifficultyValues[2][i][j]);
            }
        }
        for (let i = 0; i < localDifficultyValues[3].length; ++i)
        {    
            for (let j = 0; j < localDifficultyValues[3][i].length; ++j)
            {
                PPs[i].push(localDifficultyValues[3][i][j]);
                PPHTDCs[i].push(localDifficultyValues[4][i][j]);
                PPDTNCs[i].push(localDifficultyValues[5][i][j]);
            }
        }
        beatmapList.push(localValues[0][i]);
        difficultyList.push(localValues[1][i]);
        LoadedBeatmapIds.push(localValues[2][i]);
        LoadedDifficultyIds.push(localValues[3][i]);
        songNames.push(localValues[4][i]);
        difficultyNames.push(localValues[5][i]);
        BPMs.push(localValues[6][i]);
        DrainTimes.push(localValues[7][i]);
        ODs.push(localValues[8][i]);
        NoteCounts.push(localValues[9][i]);
        TypingSectionCounts.push(localValues[10][i]);
        isCache.push(false);
        oldStarRanks.push(0);
        newStarRanks.push(0);
        oldPPRanks.push(0);
        newPPRanks.push(0);
    }

    CreateTable("diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(songNames.length), CreateDiffTableValues(true), difTableColumnCompare, difTableColumnTypes, 0);
    if (songNames.length == 0)
    {
        document.getElementById("clearrtms").style.display = "none";
    }
    else if (songNames.length > 0)
    {
        document.getElementById("clearrtms").style.display = "inline";
    }
    
}

function ClearCachedRTMS() {
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i])
        {
            LoadedBeatmapIds.splice(i, 1);
            LoadedDifficultyIds.splice(i, 1);
            songNames.splice(i, 1);
            difficultyNames.splice(i, 1);
            BPMs.splice(i, 1);
            DrainTimes.splice(i, 1);
            NoteCounts.splice(i, 1);
            TypingSectionCounts.splice(i, 1);
            for (let j = 0; j < Stars.length; ++j)
            {
                Stars[j].splice(i, 1);
                StarDTNCs[j].splice(i, 1);
                StarHTDCs[j].splice(i, 1);
            }
           
            for (let j = 0; j < PPs.length; ++j)
            {
                PPs[j].splice(i, 1);            
                PPDTNCs[j].splice(i, 1);            
                PPHTDCs[j].splice(i, 1);
            }
            

            isCache.splice(i, 1);
            ODs.splice(i, 1);
            beatmapList.splice(i, 1);
            difficultyList.splice(i, 1);
            --i;
        }
       
    }
    /*if (songNames.length == 0)
    {
        for (let i = 0; i < ppFormulaKeys.length; ++i) {
            PPs.push([]);
            PPDTNCs.push([]);
            PPHTDCs.push([]);
        }
        for (let i = 0; i < starFormulaKeys.length; ++i) {
            Stars.push([]);
            StarDTNCs.push([]);
            StarHTDCs.push([]);
        }
    }*/
    
}

function ClearLoadedRTMS() {
    LoadedBeatmapIds = [];
    LoadedDifficultyIds = [];
    songNames = [];
    difficultyNames = [];
    BPMs = [];
    DrainTimes = [];
    NoteCounts = [];
    TypingSectionCounts = [];
    Stars = [];
    PPs = [];
    StarDTNCs = [];
    PPDTNCs = [];
    StarHTDCs = [];
    PPHTDCs = [];
    difficultyList = [];
    beatmapList = [];
    ODs = [];
    isCache = [];
    beatmapList = [];
    difficultyList = [];
    for (let i = 0; i < ppFormulaKeys.length; ++i) {
        PPs.push([]);
        PPDTNCs.push([]);
        PPHTDCs.push([]);
    }
    for (let i = 0; i < starFormulaKeys.length; ++i) {
        Stars.push([]);
        StarDTNCs.push([]);
        StarHTDCs.push([]);
    }
}



function CreateDiffTableValues(haveRanks)
{
    if (songNames.length == 0)
    {
        return [[], [], [], [], [], [], [], [], [], [], [], [], [], []];
    }

    let oldStars = [];
    let newStars = [];
    let oldPP = [];
    let newPP = [];
    let actualDrainTimes = [];
    let actualBPM = [];
    let actualODs = [];
    let modSpeed = GetModSpeed(selectedMod);

    for (let i = 0; i < Stars[srReworkFirst].length; ++i)
    {
        oldStars.push(Math.round(GetModdedStar(i,srReworkFirst,selectedMod)*100)/100);
        newStars.push(Math.round(GetModdedStar(i,srReworkSecond,selectedMod)*100)/100);
        oldPP.push(GetModdedPP(i,ppReworkFirst,selectedMod));
        newPP.push(GetModdedPP(i,ppReworkSecond,selectedMod));
        actualDrainTimes.push(Math.round(DrainTimes[i] / modSpeed));
        actualBPM.push(Math.round(BPMs[i] / modSpeed));
        actualODs.push(Math.round(GetModdedOD(ODs[i], selectedMod)*100)/100);
    }
    
    if (haveRanks)
        CreateRanks();

    if (oldStarRanks.length < songNames)
    {        
        for (let i = 0; i < songNames.length;++i)
        {
            oldStarRanks.push(i);
            newStarRanks.push(i);
            oldPPRanks.push(i);
            newPPRanks.push(i);
        }
    }
    return [oldStarRanks, newStarRanks, oldPPRanks, newPPRanks, oldStars, newStars, oldPP, newPP, songNames, difficultyNames, BPMs, actualDrainTimes,
        actualODs, NoteCounts, TypingSectionCounts]
}



function CreateRanks() {
    //let difTableColumnNames = ["Song name", "Difficulty name", "BPM", "Drain time",
    //"Note count", "TS counts", "Old stars", "New stars", "Old PP", "New PP"];
    let oldSRIndex = difTableColumnNames.indexOf("Old stars");
    let newSRIndex = difTableColumnNames.indexOf("New stars");
    let oldPPIndex = difTableColumnNames.indexOf("Old PP");
    let newPPIndex = difTableColumnNames.indexOf("New PP");
    let sorts = [];
    for (let i = 0; i < difTableColumnNames.length; ++i)
    {
        sorts.push(0);
    }
    while (oldStarRanks.length < songNames.length)
    {
        oldStarRanks.push(0);
        newStarRanks.push(0);
        oldPPRanks.push(0);
        newPPRanks.push(0);
    }
    while (oldStarRanks.length > songNames.length)
    {
        oldStarRanks.splice(0, 1);
        newStarRanks.splice(0, 1);
        oldPPRanks.splice(0, 1);
        newPPRanks.splice(0, 1);
    }
    sorts[oldSRIndex] = 1;
    let tempValues = DoSort(sorts, CreateDiffTableValues(false), difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        oldStarRanks[tempValues[i]] = i; 
    }    
    sorts[oldSRIndex] = 0;
    sorts[newSRIndex] = 1;
    tempValues = DoSort(sorts, CreateDiffTableValues(false), difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        newStarRanks[tempValues[i]] = i; 
    }    
    sorts[newSRIndex] = 0;
    sorts[oldPPIndex] = 1;
    tempValues = DoSort(sorts, CreateDiffTableValues(false), difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        oldPPRanks[tempValues[i]] = i; 
    }    
    sorts[oldPPIndex] = 0;
    sorts[newPPIndex] = 1;
    tempValues = DoSort(sorts, CreateDiffTableValues(false), difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        newPPRanks[tempValues[i]] = i; 
    }    
    for (let i = 0; i < oldStarRanks.length;++i)
    {
        oldStarRanks[i]++;
        newStarRanks[i]++;
        oldPPRanks[i]++;
        newPPRanks[i]++;
    }
        
}

function CreateDefaultRowIds(rowidlength)
{
    let rowIds = [];
    for (let i = 0; i < rowidlength; ++i)
    {
        rowIds.push(i);
    }
    return rowIds;
}