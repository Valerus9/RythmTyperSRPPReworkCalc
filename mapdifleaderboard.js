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

let mapDifModselect = 0

let TableCreation = () => {
        let createdTableValues = CreateDiffTableValues(true, mapDifModselect, false);
        CreateTable("Difficulty list", "diffList", difTableColumnNames, difTableColumnIds, difTableColumnWidths, CreateDefaultRowIds(createdTableValues[0].length), createdTableValues, difTableColumnCompare, difTableColumnTypes, 0)
    };

function CreateSelectContentBeatmap() {
    let selectsrFirst = document.getElementById("srcalcselectfirst");
    let selectsrtextFirst = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"sr"))
            continue;
        if (i == 0) {
            selectsrtextFirst += "<option selected value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
        else {
            selectsrtextFirst += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
    }
    selectsrFirst.innerHTML = selectsrtextFirst;
    let selectsrSecond = document.getElementById("srcalcselectsecond");
    let selectsrtextSecond = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"sr"))
            continue;
        if (i == 1) {
            selectsrtextSecond += "<option value=\"" + (i + 1) + "\" selected>" + reworks[i].name + "</option>\n";
        }
        else {
            selectsrtextSecond += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
    }
    selectsrSecond.innerHTML = selectsrtextSecond;
    let selectppFirst = document.getElementById("ppcalcselectfirst");
    let selectpptextFirst = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"pp"))
            continue;
        if (i == 0) {
            selectpptextFirst += "<option selected value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
        else {
            selectpptextFirst += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
    }
    selectppFirst.innerHTML = selectpptextFirst;
    let selectppSecond = document.getElementById("ppcalcselectsecond");
    let selectpptextSecond = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"pp"))
            continue;
        if (i == 1) {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\" selected>" + reworks[i].name + "</option>\n";
        }
        else {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
    }
    selectppSecond.innerHTML = selectpptextSecond;
    let modSelect = document.getElementById("modselect");
    let modSelectText = "";
    modSelectText += "<option value=\"" + 0 + "\" selected>All mods</option>\n";
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
        TableCreation();
    });
    document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
        srReworkSecond = event.target.value - 1;
        TableCreation();
    });
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
        ppReworkFirst = event.target.value - 1;
        TableCreation();
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;
        TableCreation();
    });
    document.getElementById("modselect").addEventListener("change", async (event) => {
        mapDifModselect = event.target.value - 1;
        TableCreation();
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
        TableCreation();
    });
    document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
        srReworkSecond = event.target.value - 1;
        TableCreation();
    });
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
        ppReworkFirst = event.target.value - 1;
        TableCreation();
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;        
        TableCreation();
    });
    CreateSelectContentBeatmap();
    TableCreation();

    document.getElementById("clearrtms").addEventListener("click", async (event) => {
        ClearLoadedRTMS();
        document.getElementById("clearrtms").style.display = "none";
        document.getElementById("clearcachertms").style.display = "none";
        document.getElementById("cacheMessage").style.display = "none";
        document.getElementById("changemenudifferentodCalc").disabled = true;
        document.getElementById("changemenugraphviewofrework").disabled = true;
        TableCreation();
    });
    document.getElementById("clearcachertms").addEventListener("click", async (event) => {
        ClearCachedRTMS();
        UpdateClearButtons();
        TableCreation();
    });

    document.getElementById("zipInput").addEventListener("change", async (event) => {
        const files = [...event.target.files].filter(f => f.name.endsWith(".rtm"));
        await CreateMapDataFromFiles(files).then(data => {
            ClearCacheIfMapIsInThem(data).then(data2=>{
                LoadMapDataValues(data);
            });
            
        });
            
        document.getElementById("warningcacheonly").style.display = "none";
        document.getElementById("changemenudifferentodCalc").disabled = false;
        document.getElementById("changemenugraphviewofrework").disabled = false;
        document.getElementById("changemenubuildupleaderboard").disabled = false;
    });
}

function UpdateClearButtons()
{   
    
    if (songNames.length == 0)
    {
        document.getElementById("clearrtms").style.display = "none";
    }
    let isThereCache = false;
    let isThereNotCache = false;
    for (let i = 0; i < isCache.length; ++i)
    {
        if (!isCache[i])
        {
            isThereNotCache = true;
            break;
        }
    }
    for (let i = 0; i < isCache.length; ++i)
    {
        if (isCache[i])
        {
            isThereCache = true;
            break;
        }
    }
    if (isThereCache)
    {
        document.getElementById("clearcachertms").style.display = "inline";
        document.getElementById("cacheMessage").style.display = "inline";
    }
    else
    {
        document.getElementById("clearcachertms").style.display = "none";
        document.getElementById("cacheMessage").style.display = "none";
    }
    if (isThereNotCache && songNames.length > 0)
    {
        document.getElementById("changemenudifferentodCalc").disabled = false;
        document.getElementById("changemenugraphviewofrework").disabled = false;
        document.getElementById("leftrighthandmenu").disabled = false;
    }
}

async function ClearCacheIfMapIsInThem(localValues)
{
    for (let i = 0; i < localValues[0].length; ++i)
    {
        if (songNames.includes(localValues[4][i]) && isCache[songNames.indexOf(localValues[4][i])])
        {
            ClearCachedRTMS();
        }
    }
}

async function LoadMapDataValues(localValues, loadMapDataIndexer = 0)
{   
    let loadingProgress = document.getElementById("loadingprogress");
    loadingProgress.innerHTML = "Progress: "+(loadMapDataIndexer+1)+"/"+localValues[0].length+" ("+(Math.round((loadMapDataIndexer+1)/localValues[0].length*10000)/100)+"%)";

    //LoadedBeatmapIds.push(localValues[0][loadMapDataIndexer].mapsetId);
    //LoadedDifficultyIds.push(localValues[1][loadMapDataIndexer].diffId);
    let localDifficultyValues = CreateDifficultyData([localValues[1][loadMapDataIndexer]]);
    for (let j = 0; j < localDifficultyValues[0].length; ++j)
    {
        for (let k = 0; k < localDifficultyValues[0][j].length; ++k)
        {
            Stars[j].push(localDifficultyValues[0][j][k]);
            StarDTNCs[j].push(localDifficultyValues[1][j][k]);
            StarHTDCs[j].push(localDifficultyValues[2][j][k]);
        }
    }
    for (let j = 0; j < localDifficultyValues[3].length; ++j)
    {    
        for (let k = 0; k < localDifficultyValues[3][j].length; ++k)
        {
            PPs[j].push(localDifficultyValues[3][j][k]);
            PPDTNCs[j].push(localDifficultyValues[4][j][k]);
            PPHTDCs[j].push(localDifficultyValues[5][j][k]);
        }
    }
    //beatmapList.push(localValues[0][loadMapDataIndexer]);
    difficultyList.push(localValues[1][loadMapDataIndexer]);
    LoadedBeatmapIds.push(localValues[2][loadMapDataIndexer]);
    LoadedDifficultyIds.push(localValues[3][loadMapDataIndexer]);
    songNames.push(localValues[4][loadMapDataIndexer]);
    difficultyNames.push(localValues[5][loadMapDataIndexer]);
    BPMs.push(localValues[6][loadMapDataIndexer]);
    DrainTimes.push(localValues[7][loadMapDataIndexer]);
    ODs.push(localValues[8][loadMapDataIndexer]);
    NoteCounts.push(localValues[9][loadMapDataIndexer]);
    TypingSectionCounts.push(localValues[10][loadMapDataIndexer]);
    isCache.push(false);
    oldStarRanks.push(0);
    newStarRanks.push(0);
    oldPPRanks.push(0);
    newPPRanks.push(0);
    loadMapDataIndexer++;
    if (loadMapDataIndexer < localValues[0].length)
        setTimeout(() => { LoadMapDataValues(localValues, loadMapDataIndexer) }, 0);
    else
    {
        loadingProgress.innerHTML = "Loaded "+ (loadMapDataIndexer) + " maps.";
        TableCreation();
        if (songNames.length == 0)
        {
            document.getElementById("clearrtms").style.display = "none";
        }
        else if (songNames.length > 0)
        {
            document.getElementById("clearrtms").style.display = "inline";
        }
        UpdateClearButtons();
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
    difficultyList = [];
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"pp"))
            continue;
        PPs.push([]);
        PPDTNCs.push([]);
        PPHTDCs.push([]);
    }
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i],"sr"))
            continue;
        Stars.push([]);
        StarDTNCs.push([]);
        StarHTDCs.push([]);
    }
}

function MergeArrays(multipleArrays)
{
    let result = [];
    for (let i = 0; i <multipleArrays[0].length; ++i)
    {
        result.push([]);
    }
    for (let i = 0; i <multipleArrays.length; ++i) 
    {
        for (let j = 0; j < multipleArrays[i].length; ++j)
        {
            for (let k = 0; k < multipleArrays[i][j].length; ++k)
            {
                result[j].push(multipleArrays[i][j][k])
            }
        }
    }
    return result;
}

function CreateDiffTableValues(haveRanks, localSelectedMod, showModInName)
{
    if (songNames.length == 0)
    {
        return [[], [], [], [], [], [], [], [], [], [], [], [], [], []];
    }    

    let localOldStarRanks = [];
    let localNewStarRanks = [];
    let localOldPPRanks = [];
    let localNewPPRanks = [];

    if (localSelectedMod == -1)
    {
        let multipleModResult = [];
        for (let i = 0; i < modList.length; ++i)
        {
            multipleModResult.push(CreateDiffTableValues(haveRanks, i, true));
        }
        let allValues = MergeArrays(multipleModResult);
        if (haveRanks)
        {
            let rankResult = CreateRanks(allValues);
            localOldStarRanks = rankResult[0];
            localNewStarRanks = rankResult[1];
            localOldPPRanks = rankResult[2];
            localNewPPRanks = rankResult[3];
        }
        let resultAllValues = [];
        for (let i = 0; i < allValues.length; ++i)
        {
            resultAllValues.push(allValues[i]);
        }
        for (let i = 0; i < localOldStarRanks.length; ++i)
        {
            resultAllValues[0][i] = localOldStarRanks[i];
            resultAllValues[1][i] = localNewStarRanks[i];
            resultAllValues[2][i] = localOldPPRanks[i];
            resultAllValues[3][i] = localNewPPRanks[i];
        }
        return resultAllValues;
    }    

    let oldStars = [];
    let newStars = [];
    let oldPP = [];
    let newPP = [];
    let actualDrainTimes = [];
    let actualBPM = [];
    let actualODs = [];
    let modSpeed = GetModSpeed(modList[localSelectedMod]);

    for (let i = 0; i < Stars[srReworkFirst].length; ++i)
    {
        oldStars.push(Math.round(GetModdedStar(i, srReworkFirst, modList[localSelectedMod]) * 100)/100);
        newStars.push(Math.round(GetModdedStar(i, srReworkSecond, modList[localSelectedMod]) * 100)/100);
        oldPP.push(GetModdedPP(i, ppReworkFirst, modList[localSelectedMod]));
        newPP.push(GetModdedPP(i, ppReworkSecond, modList[localSelectedMod]));
        actualDrainTimes.push(Math.round(DrainTimes[i] / modSpeed));
        actualBPM.push(Math.round(BPMs[i] / modSpeed));
        actualODs.push(Math.round(GetModdedOD(ODs[i], modList[localSelectedMod]) * 100)/100);
    }
        

    let localSongNames = [];
    let localDifficultyNames = [];

    for (let i = 0; i < songNames.length; ++i)
    {
        let localSongName = songNames[i];
        if (localSelectedMod != 0 && showModInName)
            localSongName = modList[localSelectedMod]+" "+songNames[i];
        localSongNames.push(localSongName);
        localDifficultyNames.push(difficultyNames[i]);
    }

    if (haveRanks)
    {
        let rankResult = CreateRanks([oldStars, oldStars, oldStars, oldStars, oldStars, newStars, oldPP, newPP, localSongNames, localDifficultyNames, actualBPM, actualDrainTimes,
            actualODs, NoteCounts, TypingSectionCounts]);
        localOldStarRanks = rankResult[0];
        localNewStarRanks = rankResult[1];
        localOldPPRanks = rankResult[2];
        localNewPPRanks = rankResult[3];
    }

    if (localOldStarRanks.length < songNames.length)
    {        
        for (let i = 0; i < songNames.length;++i)
        {
            localOldStarRanks.push(i);
            localNewStarRanks.push(i);
            localOldPPRanks.push(i);
            localNewPPRanks.push(i);
        }
    }
    return [localOldStarRanks, localNewStarRanks, localOldPPRanks, localNewPPRanks, oldStars, newStars, oldPP, newPP, localSongNames, localDifficultyNames, actualBPM, actualDrainTimes,
        actualODs, NoteCounts, TypingSectionCounts]
}



function CreateRanks(tableValues) {
    //let difTableColumnNames = ["Song name", "Difficulty name", "BPM", "Drain time",
    //"Note count", "TS counts", "Old stars", "New stars", "Old PP", "New PP"];
    let oldSRIndex = difTableColumnNames.indexOf("Old stars");
    let newSRIndex = difTableColumnNames.indexOf("New stars");
    let oldPPIndex = difTableColumnNames.indexOf("Old PP");
    let newPPIndex = difTableColumnNames.indexOf("New PP");
    
    let localOldStarRanks = [];
    let localNewStarRanks = [];
    let localOldPPRanks = [];
    let localNewPPRanks = [];

    let sorts = [];
    for (let i = 0; i < difTableColumnNames.length; ++i)
    {
        sorts.push(0);
    }
    while (localOldStarRanks.length < songNames.length)
    {
        localOldStarRanks.push(0);
        localNewStarRanks.push(0);
        localOldPPRanks.push(0);
        localNewPPRanks.push(0);
    }
    while (localOldStarRanks.length > songNames.length)
    {
        localOldStarRanks.splice(0, 1);
        localNewStarRanks.splice(0, 1);
        localOldPPRanks.splice(0, 1);
        localNewPPRanks.splice(0, 1);
    }
    sorts[oldSRIndex] = 1;
    let tempValues = DoSort(sorts, tableValues, difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        localOldStarRanks[tempValues[i]] = i; 
    }    
    sorts[oldSRIndex] = 0;
    sorts[newSRIndex] = 1;
    tempValues = DoSort(sorts, tableValues, difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        localNewStarRanks[tempValues[i]] = i; 
    }    
    sorts[newSRIndex] = 0;
    sorts[oldPPIndex] = 1;
    tempValues = DoSort(sorts, tableValues, difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        localOldPPRanks[tempValues[i]] = i; 
    }    
    sorts[oldPPIndex] = 0;
    sorts[newPPIndex] = 1;
    tempValues = DoSort(sorts, tableValues, difTableColumnTypes);
    for (let i = 0; i < tempValues.length; ++i)
    {
        localNewPPRanks[tempValues[i]] = i; 
    }    
    for (let i = 0; i < localOldStarRanks.length;++i)
    {
        localOldStarRanks[i]++;
        localNewStarRanks[i]++;
        localOldPPRanks[i]++;
        localNewPPRanks[i]++;
    }
    return [localOldStarRanks, localNewStarRanks, localOldPPRanks, localNewPPRanks];
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

async function GetDataForMapLeaderboard(offset,limit)
{
    let apiMapDatas;
    await CreateRankedMapDataFromApi(offset,limit).then(x => {
        apiMapDatas = x;
    });
    if (apiMapDatas.length != 0)
        LoadMapDataValues(apiMapDatas)
}