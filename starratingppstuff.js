

let modList = ["No mods", "DT/NC", "HT/DC"];

let LoadedBeatmapIds = [];
let LoadedDifficultyIds = [];


let songNames = [];
let difficultyNames = [];
let BPMs = [];
let DrainTimes = [];
let NoteCounts = [];
let TypingSectionCounts = [];
let Stars = [];
let ODs = [];
let PPs = [];
let StarDTNCs = [];
let PPDTNCs = [];
let StarHTDCs = [];
let PPHTDCs = [];

let ppReworkFirst = 0;
let ppReworkSecond = 1;
let srReworkFirst = 0;
let srReworkSecond = 1;

let starFormulaKeys = Object.keys(starFormulas);
let ppstarFormulaBuildUpKeys = Object.keys(ppstarFormulaBuildUps);
let ppFormulaKeys = Object.keys(ppFormulas);

let containerBody = document.getElementById("container").innerHTML;

let selectedMod = "";
LoadRankedBeatmaps();



function LoadRankedBeatmaps() {
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
    for (let i = 0; i < RankedSongNames.length; ++i) {
        
        LoadedBeatmapIds.push(RankedBeatmapIds[i]);
        LoadedDifficultyIds.push(RankedDifficultyIds[i]);
        songNames.push(RankedSongNames[i]);
        difficultyNames.push(RankedDifficultyNames[i]);
        BPMs.push(RankedBPMs[i]);
        DrainTimes.push(RankedDrainTimes[i]);
        NoteCounts.push(RankedNoteCounts[i]);
        TypingSectionCounts.push(RankedTypingSectionCounts[i]);
        ODs.push(RankedODs[i]);
        isCache.push(true);
        difficultyList.push(undefined);
        beatmapList.push(undefined);
    }
    for (let i = 0; i < RankedStars.length; ++i) {
        for (let j = 0; j < RankedStars[i].length; ++j) {
            Stars[i].push(RankedStars[i][j])
            StarDTNCs[i].push(RankedStarDTNCs[i][j])
            StarHTDCs[i].push(RankedStarHTDCs[i][j])
        }
    }

    for (let i = 0; i < RankedPPs.length; ++i) {
        for (let j = 0; j < RankedPPs[i].length; ++j) {
            PPs[i].push(RankedPPs[i][j])
            PPDTNCs[i].push(RankedPPDTNCs[i][j])
            PPHTDCs[i].push(RankedPPHTDCs[i][j])
        }
    }
}

function GetModdedStar(diffIdSingle, reworkId, mod) {
    if (mod.includes("NC") || mod.includes("DT")) {
        return StarDTNCs[reworkId][diffIdSingle];

    }
    if (mod.includes("DC") || mod.includes("HT")) {
        return StarHTDCs[reworkId][diffIdSingle];
    }
    return Stars[reworkId][diffIdSingle];
}

function GetModdedPP(diffIdSingle, reworkId, mod) {
    if (mod.includes("NC") || mod.includes("DT")) {
        return PPDTNCs[reworkId][diffIdSingle];

    }
    if (mod.includes("DC") || mod.includes("HT")) {
        return PPHTDCs[reworkId][diffIdSingle];
    }
    return PPs[reworkId][diffIdSingle];
}
function GetModdedOD(od, mod)
{
    if (mod.includes("NC") || mod.includes("DT")) {
        let ms = 80 - 6 * od;
        return (80 - (ms / 1.5)) / 6;
    }
    if (mod.includes("DC") || mod.includes("HT")) {
        let ms = 80 - 6 * od;
        return (80 - (ms / 0.75)) / 6;
    }
    return od;
}

function GetModSpeed(mod) {
    if (mod.includes("NC") || mod.includes("DT")) {
        return 1.5;
    }
    if (mod.includes("DC") || mod.includes("HT")) {
        return 0.75;
    }
    return 1.0;
}