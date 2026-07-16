var isCache = [];
var beatmapList = [];
/*
artistName: 
audioFile:
backgroundFiles:
bpm:
description:
difficulties: 
explicit:
hasCustomHitsounds:
language:
mapper:
mapsetId:
offset:
previewTime: 
songName: 
tags: 
timingPoints: 
videoFile:
videoStartTime:
*/
var difficultyList = [];
/*
bgFile:
diffId:
mapsetId:
name:
notes: 
overallDifficulty: 
typingSections: 
(IN BEATMAP DIFF LIST ONLY) starRating:
*/
/*
note tap

hitsound: 
key:
time:
type: "tap"

note hold

endTime: 
hitsound: 
key:
startTime:
type: "hold"
*/
/*
type section

endTime:
startTime:
text:
*/
async function CreateMapDataFromFiles(files) {
    if (!files) return;
    const getStartTime = x => {
        if (x.type == "tap")
            return x.time;
        if (x.type == "hold")
            return x.startTime;
    }
    const getEndTime = x => {
        if (x.type == "tap")
            return x.time;
        if (x.type == "hold")
            return x.endTime;
    }
    let localDifficultyList = [];
    let localBeatmapList = [];
    for (const file of files) {

        const zip = await JSZip.loadAsync(file);
        let beatmapId = "0";
        if (String(file.name).includes('-'))
          beatmapId = file.name.split('-')[0];

        for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
                if (!filename.includes(".json"))
                    continue;
                const content = await zipEntry.async("string");
                const data = JSON.parse(content);
                const keys = Object.keys(data);
                let hasKey = false;
                for (const key of keys) {
                    if (key.includes("diffId")) {
                        hasKey = true;
                        break;
                    }
                }
                data.mapsetId = beatmapId;
                if (hasKey) {
                    localDifficultyList.push(data);
                }
                else {
                    localBeatmapList.push(data);
                }
            }
        }
    }

    let localBeatmapData = [];
    let localDifficultyData = [];
    let localLoadedBeatmapIds = [];
    let localLoadedDifficultyIds = [];
    let localSongNames = [];
    let localDifficultyNames = [];
    let localBPMs = [];
    let localDrainTimes = [];
    let localNoteCounts = [];
    let localTypingSectionCounts = [];
    let localODs = [];
    
    for (const difficulty of localDifficultyList) {
        let mapSongName = "";
        let mapBpm = 0;
        for (const beatmap of localBeatmapList) {
            if (beatmap.mapsetId == difficulty.mapsetId) {
                mapSongName = beatmap.songName;
                mapBpm = Math.round(beatmap.bpm);
                localBeatmapData.push(beatmap);
                difficulty["songName"] = mapSongName;
                break;
            }
        }
        localDifficultyData.push(difficulty);
        localLoadedBeatmapIds.push(difficulty.mapsetId);
        localLoadedDifficultyIds.push(difficulty.diffId);
        localSongNames.push(mapSongName);
        localDifficultyNames.push(difficulty.name);
        localBPMs.push(mapBpm);
        let minTime = Infinity;
        let maxTime = 0;
        for (const note of difficulty.notes) {
            if (minTime > getStartTime(note)) {
                minTime = getStartTime(note);
            }
            if (maxTime < getEndTime(note)) {
                maxTime = getEndTime(note);
            }
        }
        for (const typingSection of difficulty.typingSections) {
            if (minTime > typingSection.startTime) {
                minTime = typingSection.startTime;
            }
            if (maxTime < typingSection.endTime) {
                maxTime = typingSection.endTime;
            }
        }
        let drainTime = maxTime - minTime;
        localDrainTimes.push(drainTime);

        localNoteCounts.push(difficulty.notes.length);
        localTypingSectionCounts.push(difficulty.typingSections.length);
        localODs.push(difficulty.overallDifficulty);
    }
    
    return [localBeatmapData, localDifficultyData, localLoadedBeatmapIds, localLoadedDifficultyIds, localSongNames, localDifficultyNames, localBPMs, localDrainTimes, localODs, localNoteCounts, localTypingSectionCounts];
}

function CreateDifficultyData(difficultyInput)
{
    let tempDifficulties = [];
    for (let i = 0; i < difficultyInput.length; ++i)
    {
        let tempDifficulty = {
            overallDifficulty: difficultyInput[i].overallDifficulty,
            notes: [],
            typingSections: [],
            songName: difficultyInput[i].songName,
            difficultyTitle: difficultyInput[i].name
        };
        for (let j = 0; j < difficultyInput[i].notes.length; ++j)
        {
            if (difficultyInput[i].notes[j].type == "tap")
            {
                let tempNote = {
                    type: difficultyInput[i].notes[j].type,
                    key: difficultyInput[i].notes[j].key,
                    startTime: difficultyInput[i].notes[j].time/1000,
                    time: difficultyInput[i].notes[j].time/1000,
                }
                tempDifficulty.notes.push(tempNote);
            }
            else
            {
                let tempNote = {
                    type: difficultyInput[i].notes[j].type,
                    key: difficultyInput[i].notes[j].key,
                    startTime: difficultyInput[i].notes[j].startTime/1000,
                    endTime: difficultyInput[i].notes[j].endTime/1000,
                }
                tempDifficulty.notes.push(tempNote);
            }
        }
        for (let j = 0; j < difficultyInput[i].typingSections.length; ++j) {
            let tempSection = {
                startTime: difficultyInput[i].typingSections[j].startTime/1000,
                endTime: difficultyInput[i].typingSections[j].endTime/1000,    
                text: difficultyInput[i].typingSections[j].text,    
            }
            tempDifficulty.typingSections.push(tempSection);
        }
        tempDifficulties.push(tempDifficulty);
    }
    
    let localStars = [];
    let localStarDTNCs = [];
    let localStarHTDCs = [];
    for (let i = 0; i < reworks.length; ++i)        
    {
        if (!ObjectHasVariable(reworks[i], "sr"))
            continue;
        localStars.push([]);
        localStarDTNCs.push([]);
        localStarHTDCs.push([]);
    }
    let localPPs = [];
    let localPPDTNCs = [];
    let localPPHTDCs = [];
    for (let i = 0; i < reworks.length; ++i)
    {
        if (!ObjectHasVariable(reworks[i], "pp"))
            continue;
        localPPs.push([]);
        localPPDTNCs.push([]);
        localPPHTDCs.push([]);
    }

    for (const difficulty of tempDifficulties) {
        let ms = 80 - 6 * difficulty.overallDifficulty;
        let overallDifficultyDTNC = (80 - (ms / 1.5)) / 6;
        let DifficultyDTNC = {
            notes: [],
            overallDifficulty: overallDifficultyDTNC,
            typingSections: [],
            accuracy: 100,
            difficultyTitle: difficulty.difficultyTitle
        };
        let overallDifficultyHTDC = (80 - (ms / 0.75)) / 6;
        let DifficultyHTDC = {
            notes: [],
            overallDifficulty: overallDifficultyHTDC,
            typingSections: [],
            accuracy: 100,
            difficultyTitle: difficulty.difficultyTitle
        };
        for (const note of difficulty.notes) {
            if (note.type == "tap") {
                let tempNoteDTNC = {
                    key: note.key,
                    type: note.type,
                    time: note.time / 1.5,
                    startTime: note.startTime / 1.5,
                };
                DifficultyDTNC.notes.push(tempNoteDTNC);
                let tempNoteHTDC = {
                    key: note.key,
                    type: note.type,
                    time: note.time / 0.75,
                    startTime: note.startTime / 0.75,
                };
                DifficultyHTDC.notes.push(tempNoteHTDC);
            }
            if (note.type == "hold") {
                let tempNoteDTNC = {
                    key: note.key,
                    type: note.type,
                    startTime: note.startTime / 1.5,
                    endTime: note.endTime / 1.5,
                };
                DifficultyDTNC.notes.push(tempNoteDTNC);
                let tempNoteHTDC = {
                    key: note.key,
                    type: note.type,
                    startTime: note.startTime / 0.75,
                    endTime: note.endTime / 0.75,
                };
                DifficultyHTDC.notes.push(tempNoteHTDC);
            }
        }

        for (const typingSection of difficulty.typingSections) {
            let tempTypingSectionDTNC = {
                startTime: typingSection.startTime / 1.5,
                endTime: typingSection.endTime / 1.5,
                text: typingSection.text,
            };
            DifficultyDTNC.typingSections.push(tempTypingSectionDTNC);
            let tempTypingSectionHTDC = {
                startTime: typingSection.startTime / 0.75,
                endTime: typingSection.endTime / 0.75,
                text: typingSection.text,
            };
            DifficultyHTDC.typingSections.push(tempTypingSectionHTDC);

        }

        difficulty.accuracy = 100;
        DifficultyDTNC.accuracy = 100;
        DifficultyHTDC.accuracy = 100;


        for (let i = 0; i < reworks.length; ++i) {
            
            if (!ObjectHasVariable(reworks[i], "sr"))
                continue;
            try
            {
                let star = reworks[i].sr.calculate(difficulty);
                localStars[i].push(star);
                
                let StarDTNC = reworks[i].sr.calculate(DifficultyDTNC);
                localStarDTNCs[i].push(StarDTNC);
                
                let StarHTDC = reworks[i].sr.calculate(DifficultyHTDC);
                localStarHTDCs[i].push(StarHTDC);
            }
            catch(error)
            {
                localStars[i].push(-1);
                
                localStarDTNCs[i].push(-1);
                
                localStarHTDCs[i].push(-1);
                console.error( "Error occoured while calculating " + difficulty.songName  +"'s diff called "+difficulty.difficultyTitle+" using "+ reworks[i].name+"' sr: "+error);
            }
        }

        for (let i = 0; i < reworks.length; ++i) {
            
            if (!ObjectHasVariable(reworks[i], "pp"))
                continue;
            try
            {
                let pp = reworks[i].pp.calculate(difficulty);
                localPPs[i].push(pp);
                
                let PPDTNC = reworks[i].pp.calculate(DifficultyDTNC);
                localPPDTNCs[i].push(PPDTNC);
                
                let PPHTDC = reworks[i].pp.calculate(DifficultyHTDC);
                localPPHTDCs[i].push(PPHTDC);
            }
            catch(error)
            {
                localPPs[i].push(-1);
                
                localPPDTNCs[i].push(-1);
                
                localPPHTDCs[i].push(-1);
                console.error( "Error occoured while calculating " + difficulty.songName  +"'s diff called "+difficulty.difficultyTitle+" using "+ reworks[i].name+"' pp: "+error);
            }
        }

        
    }
    return [localStars, localStarDTNCs, localStarHTDCs, localPPs, localPPDTNCs, localPPHTDCs];
}



function scaleDifficultySpeed(difficultyInput, speedInput)
{
    let ms = 80 - 6 * difficultyInput.overallDifficulty;
    let overallDifficultyResult = (80 - (ms / speedInput)) / 6;
    let DifficultyResult = {
        notes: [],
        overallDifficulty: overallDifficultyResult,
        accuracy: 100,
    };
    for (const note of difficultyInput.notes) {
        if (note.type == "tap") {
            let tempNoteResult = {
                key: note.key,
                type: note.type,
                time: note.time/1000 / speedInput,
                startTime: note.time/1000 / speedInput,
            };
            DifficultyResult.notes.push(tempNoteResult);
        }
        if (note.type == "hold") {
            let tempNoteResult = {
                key: note.key,
                type: note.type,
                startTime: note.startTime/1000 / speedInput,
                endTime: note.endTime /1000/ speedInput,
            };
            DifficultyResult.notes.push(tempNoteResult);
        }
    }
    if (difficultyInput.typingSections.length > 0)
    {
        DifficultyResult.typingSections = [];
    }
    for (const typingSection of difficultyInput.typingSections) {
        let tempTypingSectionResult = {
            startTime: typingSection.startTime /1000/ speedInput,
            endTime: typingSection.endTime/1000 / speedInput,
            text: typingSection.text,
        };
        DifficultyResult.typingSections.push(tempTypingSectionResult);
    }
    return DifficultyResult;
}

async function CreateRankedMapDataFromApi(offset, limit)
{
    const getStartTime = x => {
        if (x.type == "tap")
            return x.time;
        if (x.type == "hold")
            return x.startTime;
    }
    const getEndTime = x => {
        if (x.type == "tap")
            return x.time;
        if (x.type == "hold")
            return x.endTime;
    }
    let localDifficultyList = [];
    let localBeatmapList = [];
    let localLoadedBeatmapIds = [];
    let localLoadedDifficultyIds = [];
    let localSongNames = [];
    let localDifficultyNames = [];
    let localBPMs = [];
    let localDrainTimes = [];
    let localNoteCounts = [];
    let localTypingSectionCounts = [];
    let localODs = [];


    let localBeatmapIdDiffId = [];
    await GetRankedBeatmapDatas(offset, limit).then(beatmapData => {
        for (let i = 0; i < beatmapData.length; ++i)
        {
            for (let j = 0; j < beatmapData[i].difficulties.length; ++j)
            {
                localBeatmapList.push(beatmapData[i]);
                localLoadedBeatmapIds.push(beatmapData[i].id);
                localSongNames.push(beatmapData[i].songName);   
                //console.log(i+" "+j);
                localLoadedDifficultyIds.push(beatmapData[i].difficulties[j].diffId);             
                localBeatmapIdDiffId.push({id: beatmapData[i].id, diffId: beatmapData[i].difficulties[j].diffId})
            }            
        }
    });

    //if (LsIsStored(lsDifficultyIds))
    //{
    //
    //}
    
    /*if (LsIsStored(lsLatestRankedId))
    {
        if (localStorage[lsLatestRankedId] == localLoadedBeatmapIds[0])
        {
            localBeatmapList = [];
            localLoadedBeatmapIds = [];
            localSongNames = [];
            let tempLsDifficultyDatas = LsGetValueAsArray(lsDifficultyDatas);
            let tempLsDifficultyIds = LsGetValueAsArray(lsDifficultyIds);
            let tempLsBeatmapSongNames = LsGetValueAsArray(lsBeatmapSongNames);
            let tempLsBeatmapIds = LsGetValueAsArray(lsBeatmapIds);
            let tempLsDifficultyTitles = LsGetValueAsArray(lsDifficultyTitles);

            for (let i = 0; i < tempLsDifficultyDatas.length; ++i)
            {
                let difficultyData = UnCompressDifficultyData(tempLsDifficultyDatas[i]);difficultyData.songName = localSongNames[i];
                difficultyData.songName = tempLsBeatmapSongNames[i];
                
                localBeatmapList.push(undefined);
                localLoadedBeatmapIds.push(tempLsBeatmapIds[i]);
                localSongNames.push(tempLsBeatmapSongNames[i]);

                localDifficultyList.push(difficultyData);
                localLoadedDifficultyIds.push(tempLsDifficultyIds[i]);
                localDifficultyNames.push(tempLsDifficultyTitles[i]);
                localBPMs.push(difficultyData.bpm);
                let minTime = Infinity;
                let maxTime = 0;
                for (const note of difficultyData.notes)
                {
                    if (minTime > getStartTime(note))
                        minTime = getStartTime(note);
                    if (maxTime < getEndTime(note))
                        maxTime = getEndTime(note);
                }
                for (const typingSection of difficultyData.typingSections)
                {
                    if (minTime > getStartTime(typingSection))
                        minTime = getStartTime(typingSection);
                    if (maxTime < getEndTime(typingSection))
                        maxTime = getEndTime(typingSection);
                }
                localDrainTimes.push(maxTime - minTime);
                localNoteCounts.push(difficultyData.notes.length);
                localTypingSectionCounts.push(difficultyData.typingSections.length);
                localODs.push(difficultyData.overallDifficulty);
            }

            return [localBeatmapList, localDifficultyList, localLoadedBeatmapIds, localLoadedDifficultyIds, localSongNames, localDifficultyNames, localBPMs, localDrainTimes, localODs, localNoteCounts, localTypingSectionCounts];
        }
    }
    else
    {
        localStorage[lsLatestRankedId] = localLoadedBeatmapIds[0];
    }*/

    /*let difficultyCacheExists = LsIsStored(lsDifficultyDatas);
    if (!difficultyCacheExists)
    {
        LsSetValueAsArray(lsDifficultyDatas, []);
        LsSetValueAsArray(lsDifficultyIds, []);
        LsSetValueAsArray(lsBeatmapSongNames, []);
        LsSetValueAsArray(lsBeatmapIds, []);
        LsSetValueAsArray(lsDifficultyTitles, []);
    }*/
    
    let difficultyDatas = await Promise.all(localBeatmapIdDiffId.map((x) => GetDifficultyData(x.id, x.diffId)));
    for (let i = 0; i < difficultyDatas.length; ++i)
    {
        localDifficultyList.push(difficultyDatas[i]);
        localDifficultyNames.push(difficultyDatas[i].difficultyTitle);
        localBPMs.push(difficultyDatas[i].bpm);
        let minTime = Infinity;
        let maxTime = 0;
        for (const note of difficultyDatas[i].notes)
        {
            if (minTime > getStartTime(note))
                minTime = getStartTime(note);
            if (maxTime < getEndTime(note))
                maxTime = getEndTime(note);
        }
        for (const typingSection of difficultyDatas[i].typingSections)
        {
            if (minTime > getStartTime(typingSection))
                minTime = getStartTime(typingSection);
            if (maxTime < getEndTime(typingSection))
                maxTime = getEndTime(typingSection);
        }
        localDrainTimes.push(maxTime - minTime);
        localNoteCounts.push(difficultyDatas[i].notes.length);
        localTypingSectionCounts.push(difficultyDatas[i].typingSections.length);
        localODs.push(difficultyDatas[i].overallDifficulty);

    }  
    /*if (LsInclude(lsDifficultyIds, localBeatmapList[i].difficulties[difficultyCounter].diffId))
    {
        let indexOfDifficulty = LsIndexOf(lsDifficultyIds, localBeatmapList[i].difficulties[difficultyCounter].diffId);
        let difficultyData = UnCompressDifficultyData(LsGetValueAsArray(lsDifficultyDatas)[indexOfDifficulty]);
        difficultyData.songName = localSongNames[i];
        localDifficultyList.push(difficultyData);
        localLoadedDifficultyIds.push(localBeatmapList[i].difficulties[difficultyCounter].diffId);
        localDifficultyNames.push(difficultyData.difficultyTitle);
        localBPMs.push(difficultyData.bpm);
        let minTime = Infinity;
        let maxTime = 0;
        for (const note of difficultyData.notes)
        {
            if (minTime > getStartTime(note))
                minTime = getStartTime(note);
            if (maxTime < getEndTime(note))
                maxTime = getEndTime(note);
        }
        for (const typingSection of difficultyData.typingSections)
        {
            if (minTime > getStartTime(typingSection))
                minTime = getStartTime(typingSection);
            if (maxTime < getEndTime(typingSection))
                maxTime = getEndTime(typingSection);
        }
        localDrainTimes.push(maxTime - minTime);
        localNoteCounts.push(difficultyData.notes.length);
        localTypingSectionCounts.push(difficultyData.typingSections.length);
        localODs.push(difficultyData.overallDifficulty);
    }*/
    

    return [localBeatmapList, localDifficultyList, localLoadedBeatmapIds, localLoadedDifficultyIds, localSongNames, localDifficultyNames, localBPMs, localDrainTimes, localODs, localNoteCounts, localTypingSectionCounts];
}

/*function CompressDifficultyData(inputDifficultyData)
{
    const KEYBOARDLAYOUT = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
        "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
        "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
        "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
        " "
    ];
    let compressedData = [];
    compressedData.push(inputDifficultyData.overallDifficulty);
    compressedData.push(inputDifficultyData.bpm);    
    let lastTime = 0;
    for (const note of inputDifficultyData.notes)
    {
        let position = KEYBOARDLAYOUT.indexOf(note.key);
        if (note.type == "tap" || note.type == "catch")
        {
            if (note.type == "tap")
                compressedData.push(0);
            else if (note.type == "catch")
                compressedData.push(2);
            compressedData.push(position);
            compressedData.push(note.time - lastTime);
            lastTime = note.time;
        }
        if (note.type == "hold")
        {
            compressedData.push(1);
            compressedData.push(position);
            compressedData.push(note.startTime - lastTime);
            compressedData.push(note.endTime - lastTime);
            lastTime = note.startTime;
        }
    }
    compressedData.push("typingsections");
    lastTime = 0;
    for (const typingSection of inputDifficultyData.typingSections)
    {
        if (typingSection.startTime === undefined)
            continue;
        let tempTime = typingSection.startTime;
        compressedData.push(typingSection.startTime - lastTime);
        compressedData.push(typingSection.endTime - lastTime);
        lastTime = tempTime;
        compressedData.push(typingSection.text);
    }
    return compressedData;
}

function UnCompressDifficultyData(inputDifficultyData)
{
    const KEYBOARDLAYOUT = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
        "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
        "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
        "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
        " "
    ];
    let uncompressedData = {
        overallDifficulty: inputDifficultyData[0],
        bpm: inputDifficultyData[1],
        notes: [],
        typingSections: []
    }   
    let counter = 2;
    let lastTime = 0;
    let typingsectionBeginning = inputDifficultyData.indexOf("typingsections");
    while(counter < typingsectionBeginning)
    {
        if (inputDifficultyData[counter] == 0 || inputDifficultyData[counter] == 2)
        {
            let tempType = "tap";
            if (inputDifficultyData[counter] == 2)
                tempType = "catch";
            let tempNote = {
                key: KEYBOARDLAYOUT[inputDifficultyData[counter + 1]],
                time: inputDifficultyData[counter + 2] + lastTime,
                type: tempType 
            }
            lastTime += inputDifficultyData[counter + 2];
            counter+=3;
            uncompressedData.notes.push(tempNote);
        }
        else if (inputDifficultyData[counter] == 1)
        {
            let tempNote = {
                key: KEYBOARDLAYOUT[inputDifficultyData[counter + 1]],
                startTime: inputDifficultyData[counter + 2] + lastTime,
                endTime: inputDifficultyData[counter + 3] + lastTime,
                type: "hold"
            }
            lastTime += inputDifficultyData[counter + 2];
            counter+=4;
            uncompressedData.notes.push(tempNote);
        }
    }
    counter = typingsectionBeginning + 1;
    lastTime = 0;
    while(counter < inputDifficultyData.length)
    {
        counter++;
    }
    return uncompressedData;
}*/