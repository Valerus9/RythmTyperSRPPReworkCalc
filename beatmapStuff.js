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
async function CreateMapData(files) {
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
        localDifficultyData.push(difficulty);
        let mapSongName = "";
        let mapBpm = 0;
        for (const beatmap of localBeatmapList) {
            if (beatmap.mapsetId == difficulty.mapsetId) {
                mapSongName = beatmap.songName;
                mapBpm = Math.round(beatmap.bpm);
                localBeatmapData.push(beatmap);
                break;
            }
        }
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
    let localStars = [];
    let localStarDTNCs = [];
    let localStarHTDCs = [];
    for (let i = 0; i < starFormulaKeys.length; ++i)
    {
        localStars.push([]);
        localStarDTNCs.push([]);
        localStarHTDCs.push([]);
    }
    let localPPs = [];
    let localPPDTNCs = [];
    let localPPHTDCs = [];
    for (let i = 0; i < ppFormulaKeys.length; ++i)
    {
        localPPs.push([]);
        localPPDTNCs.push([]);
        localPPHTDCs.push([]);
    }

    for (const difficulty of difficultyInput) {
        let ms = 80 - 6 * difficulty.overallDifficulty;
        let overallDifficultyDTNC = (80 - (ms / 1.5)) / 6;
        let DifficultyDTNC = {
            notes: [],
            overallDifficulty: overallDifficultyDTNC,
            typingSections: [],
            accuracy: 100,
        };
        let overallDifficultyHTDC = (80 - (ms / 0.75)) / 6;
        let DifficultyHTDC = {
            notes: [],
            overallDifficulty: overallDifficultyHTDC,
            typingSections: [],
            accuracy: 100,
        };
        for (const note of difficulty.notes) {
            if (note.type == "tap") {
                let tempNoteDTNC = {
                    key: note.key,
                    type: note.type,
                    time: note.time / 1.5,
                };
                DifficultyDTNC.notes.push(tempNoteDTNC);
                let tempNoteHTDC = {
                    key: note.key,
                    type: note.type,
                    time: note.time / 0.75,
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


        for (let i = 0; i < starFormulaKeys.length; ++i) {

            let star = starFormulas[starFormulaKeys[i]](difficulty);
            localStars[i].push(star);

            let StarDTNC = starFormulas[starFormulaKeys[i]](DifficultyDTNC);
            localStarDTNCs[i].push(StarDTNC);

            let StarHTDC = starFormulas[starFormulaKeys[i]](DifficultyHTDC);
            localStarHTDCs[i].push(StarHTDC);

        }

        for (let i = 0; i < ppFormulaKeys.length; ++i) {

            let pp = ppFormulas[ppFormulaKeys[i]](difficulty);
            localPPs[i].push(pp);

            let PPDTNC = ppFormulas[ppFormulaKeys[i]](DifficultyDTNC);
            localPPDTNCs[i].push(PPDTNC);

            let PPHTDC = ppFormulas[ppFormulaKeys[i]](DifficultyHTDC);
            localPPHTDCs[i].push(PPHTDC);
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
        typingSections: [],
        accuracy: 100,
    };
    for (const note of difficultyInput.notes) {
        if (note.type == "tap") {
            let tempNoteResult = {
                key: note.key,
                type: note.type,
                time: note.time / speedInput,
            };
            DifficultyResult.notes.push(tempNoteResult);
        }
        if (note.type == "hold") {
            let tempNoteResult = {
                key: note.key,
                type: note.type,
                startTime: note.startTime / speedInput,
                endTime: note.endTime / speedInput,
            };
            DifficultyResult.notes.push(tempNoteResult);
        }
    }
    for (const typingSection of difficultyInput.typingSections) {
        let tempTypingSectionResult = {
            startTime: typingSection.startTime / speedInput,
            endTime: typingSection.endTime / speedInput,
            text: typingSection.text,
        };
        DifficultyResult.typingSections.push(tempTypingSectionResult);
    }
    return DifficultyResult;
}
