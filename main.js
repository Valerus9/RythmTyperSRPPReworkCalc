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

let modList = [ "No mods", "DT/NC", "HT/DC"];

let sortBySongName = 0;
let sortByDifficultyName = 0;
let sortByBPM = 0;
let sortByDrainTime = 0;
let sortByNoteCount = 0;
let sortByTypingSectionCount = 0;
let sortByOldStar = 0;
let sortByNewStar = 0;
let sortByOldPP = 0;
let sortByNewPP = 0;

let LoadedBeatmapIds = [];
let LoadedDifficultyIds = [];

let songNames = [];
let difficultyNames = [];
let BPMs = [];
let DrainTimes = [];
let NoteCounts = [];
let TypingSectionCounts = [];
let Stars = [];
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
let ppFormulaKeys = Object.keys(ppFormulas);

let diffIds = [];
let containerBody = document.getElementById("container").innerHTML;
let selectedId = "changemenumaps";
let selectedMod = "";
LoadRankedBeatmaps();
CreateTable();

let visualMode = "light";

function ApplyVisualMode()
{
  document.documentElement.className = "";
  if (visualMode == "light")
  {
    document.documentElement.classList.add("lightmode");
    document.getElementById("visualmodeswitch").value="Dark mode";
  }
  if (visualMode == "dark")
  {
    document.documentElement.classList.add("darkmode");
    document.getElementById("visualmodeswitch").value="Light mode";
  }
}
document.getElementById("visualmodeswitch").addEventListener("click", async (event) => {
  if (visualMode == "light")
  {
    visualMode = "dark";
  }
  else if (visualMode == "dark")
  {
    visualMode = "light";
  }
  ApplyVisualMode();
});

ApplyVisualMode();

function CreateSelectContentBeatmap()
{
  let selectsrFirst = document.getElementById("srcalcselectfirst");
  let selectsrtextFirst = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  let srReworkKeys = Object.keys(starFormulas);
  for (let i = 0; i < srReworkKeys.length; ++i)
  {    
    if (i == 0)
    {
      selectsrtextFirst += "<option selected value=\""+(i+1)+"\">"+srReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectsrtextFirst += "<option value=\""+(i+1)+"\">"+srReworkKeys[i]+"</option>\n";
    }
  }
  selectsrFirst.innerHTML = selectsrtextFirst;
  let selectsrSecond = document.getElementById("srcalcselectsecond");
  let selectsrtextSecond = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  for (let i = 0; i < srReworkKeys.length; ++i)
  {
    if (i == 1)
    {
      selectsrtextSecond += "<option value=\""+(i+1)+"\" selected>"+srReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectsrtextSecond += "<option value=\""+(i+1)+"\">"+srReworkKeys[i]+"</option>\n";      
    }
  }
  selectsrSecond.innerHTML = selectsrtextSecond;
  let selectppFirst = document.getElementById("ppcalcselectfirst");
  let selectpptextFirst = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  let ppReworkKeys = Object.keys(ppFormulas);
  for (let i = 0; i < ppReworkKeys.length; ++i)
  {    
    if (i == 0)
    {
      selectpptextFirst += "<option selected value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectpptextFirst += "<option value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }    
  }
  selectppFirst.innerHTML = selectpptextFirst;
  let selectppSecond = document.getElementById("ppcalcselectsecond");
  let selectpptextSecond = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  for (let i = 0; i < ppReworkKeys.length; ++i)
  {
    if (i == 1)
    {
      selectpptextSecond += "<option value=\""+(i+1)+"\" selected>"+ppReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectpptextSecond += "<option value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    
  }
  selectppSecond.innerHTML = selectpptextSecond;
  let modSelect = document.getElementById("modselect");
  let modSelectText = "";
  for (let i = 0; i < modList.length; ++i)
  {
    if (i == 0)
    {
      modSelectText += "<option value=\""+(i+1)+"\" selected>"+modList[i]+"</option>\n";
    }
    else
    {
      modSelectText += "<option value=\""+(i+1)+"\">"+modList[i]+"</option>\n";
    }
    
  }
  modSelect.innerHTML = modSelectText;

}

function CreateSelectContentUser()
{
  let selectppFirst = document.getElementById("ppcalcselectfirst");
  let selectpptextFirst = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  let ppReworkKeys = Object.keys(ppFormulas);
  for (let i = 0; i < ppReworkKeys.length; ++i)
  {
    if (i == 0)
    {
      selectpptextFirst += "<option selected value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectpptextFirst += "<option value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    
  }
  selectppFirst.innerHTML = selectpptextFirst;
  let selectppSecond = document.getElementById("ppcalcselectsecond");
  let selectpptextSecond = "<option value=\"\" disabled selected>Select a sr rework</option>\n";
  for (let i = 0; i < ppReworkKeys.length; ++i)
  {
    if (i == 1)
    {
      selectpptextSecond += "<option selected value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    else
    {
      selectpptextSecond += "<option value=\""+(i+1)+"\">"+ppReworkKeys[i]+"</option>\n";
    }
    
  }
  selectppSecond.innerHTML = selectpptextSecond;
  document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
    ppReworkFirst = event.target.value - 1;
    CalculateTopPlayScores();
  });
  document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
    ppReworkSecond = event.target.value - 1;
    CalculateTopPlayScores();
  });
  
}
document.getElementById("srcalcselectfirst").addEventListener("change", async (event) => {
  srReworkFirst = event.target.value - 1;
  CreateTable();
});
document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
  srReworkSecond = event.target.value - 1;
  CreateTable();
});
document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
  ppReworkFirst = event.target.value - 1;
  CreateTable();
});
document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
  ppReworkSecond = event.target.value - 1;
  CreateTable();
});
document.getElementById("modselect").addEventListener("change", async (event) => {
  selectedMod = modList[event.target.value - 1];
  CreateTable();
});

CreateSelectContentBeatmap();

function ChangeMenu(elementId)
{
  let changeMenuButton = document.getElementById(elementId);  
  selectedId = elementId;
  if (changeMenuButton.value == "Profile pp change")
  {
    document.getElementById("container").innerHTML = "<h1 class=\"title\">Rhythm typer SR/PP Rework site</h1>\n"
    +"<h5 class=\"author\">By Valerus9</h5>\n"
    +"<input type=\"button\" id=\"calculatepp\" value=\"Calculate pp\">\n"
    +"<select id=\"ppcalcselectfirst\">"
    +"</select>"
    +"<select id=\"ppcalcselectsecond\">"
    +"</select>"
    +"<p id=\"totalPPOld\"></p>\n"
    +"<p id=\"totalPPNew\"></p>\n"
    +"<p>Go to your top play section of your profile and ctrl + a, ctrl + c, ctrl+v them.</p>\n"
    +"<textarea name=\"replayTextArea\" id=\"replayInput\"></textarea>"
    +"<table id=\"topplayList\">\n"
    +"</table>\n\n";
    CreateSelectContentUser();
    document.getElementById("calculatepp").addEventListener("click", async (event) => { 
      CalculateTopPlayScores();
    });
  }
    
  else if (changeMenuButton.value == "Map sr pp change")
  {
    document.getElementById("container").innerHTML =containerBody;
   
    document.getElementById("srcalcselectfirst").addEventListener("change", async (event) => {
      srReworkFirst = event.target.value - 1;
      CreateTable();
    });
    document.getElementById("srcalcselectsecond").addEventListener("change", async (event) => {
      srReworkSecond = event.target.value - 1;
      CreateTable();
    });
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
      ppReworkFirst = event.target.value - 1;
      CreateTable();
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
      ppReworkSecond = event.target.value - 1;
      CreateTable();
    });
    CreateSelectContentBeatmap();
    CreateTable();
    document.getElementById("clearrtms").addEventListener("click", async (event) => {
      ClearLoadedRTMS();
      CreateTable();
    });
  }
  RefreshSelectedButton();
}
function RefreshSelectedButton()
{
  document.getElementById("changemenuprofile").className = document.getElementById("changemenuprofile").className.replace("selected","").trim(" ");
  document.getElementById("changemenumaps").className = document.getElementById("changemenumaps").className.replace("selected","").trim(" ");
  if (selectedId == "changemenuprofile")
  {
    document.getElementById("changemenuprofile").className += " selected";
  }
  if (selectedId == "changemenumaps")
  {
    document.getElementById("changemenumaps").className += " selected";
  }
}

function CalculateTopPlayScores()
{
  let replays = String(document.getElementById("replayInput").value).split("\n");
  let cleanedUpReplay = [];
  let modList = ["NC", "DC", "HT", "DT", "AT", "NF"];
  for (const replay of replays)
  {
    if (replay.startsWith("weighted") || replay.startsWith("#"))
      continue;
    cleanedUpReplay.push(replay);
  }
  let replayBeatmapName = [];
  let replayDiffIds = [];
  let replayAccuracy = [];
  let replayMod = [];
  let foundFirstTitle = false;

  for (let i = 0; i < cleanedUpReplay.length; ++i)
  {    
    if (songNames.includes(cleanedUpReplay[i]))
    {
      replayBeatmapName.push(cleanedUpReplay[i]);
      if (replayBeatmapName.length - 1 > replayMod.length)
        replayMod.push("");
      foundFirstTitle = true;
    }
    if (!foundFirstTitle)
      continue;
    if (modList.includes(cleanedUpReplay[i]))
    {
      replayMod.push(cleanedUpReplay[i]);
      continue;
    }
    if (cleanedUpReplay[i].includes(" • "))
    {
      let diffName = cleanedUpReplay[i].split(" • ")[1];
      if (difficultyNames.includes(diffName))
      {
        let index = -2;
        let foundDiff = false;
        while(!foundDiff)
        {
          index = difficultyNames.indexOf(diffName, Math.max(0,index));
          if (replayBeatmapName[replayBeatmapName.length - 1] == songNames[index])
          {
            foundDiff = true;
            break;
          }
          if (index == -1)
            break;
          index++;
        }
        if (index != -1)
          replayDiffIds.push(index);        
      }
      
    }
    if (cleanedUpReplay[i].includes("%"))
    {
      replayAccuracy.push(parseFloat(cleanedUpReplay[i].replace("%","")));
    }
  }
  let oldPPSum = 0;
  let newPPSum = 0;
  let topPlayTable = document.getElementById("topplayList");
  let topPlayText = "";
  topPlayText += "<th>Map</th>";
  topPlayText += "<th>Diff</th>";
  topPlayText += "<th>Acc</th>";
  topPlayText += "<th>Old pp</th>";
  topPlayText += "<th>New pp</th>";

  for (let i = 0; i < replayDiffIds.length; ++i)
  {
    topPlayText += "<tr>";
    let oldPP = GetModdedPP(replayDiffIds[i], ppReworkFirst, replayMod[i]) * ppaccuracies[ppFormulaKeys[ppReworkFirst]](replayAccuracy[i]);
    let newPP = GetModdedPP(replayDiffIds[i], ppReworkSecond, replayMod[i]) * ppaccuracies[ppFormulaKeys[ppReworkSecond]](replayAccuracy[i]);
    oldPPSum += ActualPP(oldPP, i + 1);
    newPPSum += ActualPP(newPP, i + 1);
    topPlayText += "<td>"+songNames[replayDiffIds[i]]+"</td>";
    topPlayText += "<td>"+difficultyNames[replayDiffIds[i]]+"</td>";
    topPlayText += "<td>"+replayAccuracy[i]+"</td>";
    topPlayText += "<td>"+Math.round(oldPP) + " ("+Math.round(ActualPP(oldPP, i + 1))+")"+"</td>";
    topPlayText += "<td>"+Math.round(newPP) + " ("+Math.round(ActualPP(newPP, i + 1))+")"+"</td>";
    topPlayText += "</tr>";
  }
  document.getElementById("totalPPOld").innerHTML = "Total old PP: " + Math.round(oldPPSum);
  document.getElementById("totalPPNew").innerHTML = "Total new PP: " + Math.round(newPPSum);
  topPlayTable.innerHTML = topPlayText;
}

function ActualPP(pp, n)
{
  return pp * Math.pow(0.95,(n - 1));
}
function PercentagePP(n)
{
  return Math.pow(0.95,(n - 1));
}

function ClearLoadedRTMS()
{
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
  diffIds = [];
  difficultyList = [];
  beatmapList = [];
  for (let i = 0; i < ppFormulaKeys.length; ++i)
  {
    PPs.push([]);
    PPDTNCs.push([]);
    PPHTDCs.push([]);
  }
  for (let i = 0; i < starFormulaKeys.length; ++i)
  {
    Stars.push([]);
    StarDTNCs.push([]);
    StarHTDCs.push([]);
  }
}

document.getElementById("clearrtms").addEventListener("click", async (event) => {
  ClearLoadedRTMS();
  CreateTable();
});

document.getElementById("changemenuprofile").addEventListener("click", async (event) => { 
  ChangeMenu("changemenuprofile");
});
document.getElementById("changemenumaps").addEventListener("click", async (event) => { 
  ChangeMenu("changemenumaps");
});
document.getElementById("zipInput").addEventListener("change", async (event) => {
  const files = [...event.target.files].filter(f => f.name.endsWith(".rtm"));
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
  for (const file of files)
  {

    const zip = await JSZip.loadAsync(file);

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        if (!filename.includes(".json"))
          continue;
        const content = await zipEntry.async("string");
        const data = JSON.parse(content);
        const keys = Object.keys(data);
        let hasKey = false;
        for (const key of keys)
        {
          if (key.includes("diffId"))
          {
            hasKey = true;
            break;
          }          
        }
        if (LoadedBeatmapIds.includes(data.mapsetId))
          continue;
        if (hasKey)
        {
          difficultyList.push(data);
        }
        else
        {
          beatmapList.push(data);
        }
      }
    }        
  }

  for (const difficulty of difficultyList)
  {
    let mapSongName = "";
    let mapBpm = 0;
    for (const beatmap of beatmapList)
    {
      if (beatmap.mapsetId == difficulty.mapsetId)
      {
        mapSongName = beatmap.songName;
        mapBpm = Math.round(beatmap.bpm);
        break;
      }      
    }
    LoadedBeatmapIds.push(difficulty.mapsetId);
    LoadedDifficultyIds.push(difficulty.diffId);
    songNames.push(mapSongName);
    difficultyNames.push(difficulty.name);
    BPMs.push(mapBpm);
    let minTime = Infinity;
    let maxTime = 0;
    for (const note of difficulty.notes)
    {
      if (minTime > getStartTime(note))
      {
        minTime = getStartTime(note);
      }
      if (maxTime < getEndTime(note))
      {
        maxTime = getEndTime(note);
      }
    }
    for (const typingSection of difficulty.typingSections)
    {
      if (minTime > typingSection.startTime)
      {
        minTime = typingSection.startTime;
      }
      if (maxTime < typingSection.endTime)
      {
        maxTime = typingSection.endTime;
      }
    }
    let drainTime = maxTime - minTime;
    DrainTimes.push(drainTime);

    NoteCounts.push(difficulty.notes.length);
    TypingSectionCounts.push(difficulty.typingSections.length);
    
    let ms = 80 - 6 * difficulty.overallDifficulty;
    let overallDifficultyDTNC = (80-(ms / 1.5)) / 6;
    let DifficultyDTNC = {
      notes: [],
      overallDifficulty: overallDifficultyDTNC,
      typingSections: [],
      accuracy: 100,
    };
    let overallDifficultyHTDC = (80-(ms / 0.75)) / 6;
    let DifficultyHTDC = {
      notes: [],
      overallDifficulty: overallDifficultyHTDC,
      typingSections: [],
      accuracy: 100,
    };
    for (const note of difficulty.notes)
    {
      if (note.type == "tap")
      {
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
      if (note.type == "hold")
      {
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
          startTime: note.startTime /  0.75,
          endTime: note.endTime / 0.75,
        };
        DifficultyHTDC.notes.push(tempNoteHTDC);
      }
    }


    difficulty.accuracy = 100;   
    DifficultyDTNC.accuracy = 100;
    DifficultyHTDC.accuracy = 100;

    for (let i = 0; i < starFormulaKeys.length; ++i)
    {
      
      let star = starFormulas[starFormulaKeys[i]](difficulty);
      star = Math.round(star * 100) / 100;
      Stars[i].push(star);    

      let StarDTNC = starFormulas[starFormulaKeys[i]](DifficultyDTNC);
      StarDTNC = Math.round(StarDTNC * 100) / 100;
      StarDTNCs[i].push(StarDTNC);

      let StarHTDC = starFormulas[starFormulaKeys[i]](DifficultyHTDC);
      StarHTDC = Math.round(StarHTDC * 100) / 100;
      StarHTDCs[i].push(StarHTDC);

    }

    for (let i = 0; i < ppFormulaKeys.length; ++i)
    {
      
      let pp = ppFormulas[ppFormulaKeys[i]](difficulty);
      pp = Math.round(pp);
      PPs[i].push(pp);

      let PPDTNC = ppFormulas[ppFormulaKeys[i]](DifficultyDTNC);
      PPDTNC = Math.round(PPDTNC);
      PPDTNCs[i].push(PPDTNC);

      let PPHTDC = ppFormulas[ppFormulaKeys[i]](DifficultyHTDC);
      PPHTDC = Math.round(PPHTDC);
      PPHTDCs[i].push(PPHTDC);

    }



    diffIds.push(diffIds.length);

  }
  CreateTable();
});

function CreateTable()
{
  const table = document.getElementById("diffList");  
  let tableText = "";
  if (diffIds.length > 0)
  {
    tableText += "<tr>";
    if (sortBySongName == 0)
    {
      tableText += "<th id=\"map\" style=\"width:5%;\">Map</th>";
    }
    else if (sortBySongName == 1)
    {
      tableText += "<th id=\"map\" style=\"width:5%;\">Map (desc)</th>";
    }
    else if (sortBySongName == -1)
    {
      tableText += "<th id=\"map\" style=\"width:5%;\">Map (incr)</th>";
    }
    if (sortByDifficultyName == 0)
    {
      tableText += "<th id=\"difficulty\" style=\"width:5%;\">Difficulty</th>";
    }
    else if (sortByDifficultyName == 1)
    {
      tableText += "<th id=\"difficulty\" style=\"width:5%;\">Difficulty (desc)</th>";
    }
    else if (sortByDifficultyName == -1)
    {
      tableText += "<th id=\"difficulty\" style=\"width:5%;\">Difficulty (incr)</th>";
    }
    if (sortByBPM == 0)
    {
      tableText += "<th id=\"bpm\" style=\"width:2%;\">BPM</th>";
    }
    else if (sortByBPM == 1)
    {
      tableText += "<th id=\"bpm\" style=\"width:2%;\">BPM (desc)</th>";
    }
    else if (sortByBPM == -1)
    {
      tableText += "<th id=\"bpm\" style=\"width:2%;\">BPM (incr)</th>";
    }
    if (sortByDrainTime == 0)
    {
      tableText += "<th id=\"draintime\" style=\"width:3%;\">DrainTime</th>";
    }
    else if (sortByDrainTime == 1)
    {
      tableText += "<th id=\"draintime\" style=\"width:3%;\">DrainTime (desc)</th>";
    }
    else if (sortByDrainTime == -1)
    {
      tableText += "<th id=\"draintime\" style=\"width:3%;\">DrainTime (incr)</th>";
    }
    if (sortByNoteCount == 0)
    {
      tableText += "<th id=\"notecount\" style=\"width:3%;\">NoteCount</th>";
    }
    else if (sortByNoteCount == 1)
    {
      tableText += "<th id=\"notecount\" style=\"width:3%;\">NoteCount (desc)</th>";
    }
    else if (sortByNoteCount == -1)
    {
      tableText += "<th id=\"notecount\" style=\"width:3%;\">NoteCount (incr)</th>";
    }
    if (sortByTypingSectionCount == 0)
    {
      tableText += "<th id=\"tscount\" style=\"width:2%;\">TSCount</th>";
    }
    else if (sortByTypingSectionCount == 1)
    {
      tableText += "<th id=\"tscount\" style=\"width:2%;\">TSCount (desc)</th>";
    }
    else if (sortByTypingSectionCount == -1)
    {
      tableText += "<th id=\"tscount\" style=\"width:2%;\">TSCount (incr)</th>";
    }
    if (sortByOldStar == 0)
    {
      tableText += "<th id=\"oldstar\" style=\"width:20%;\">OldStar</th>";
    }
    else if (sortByOldStar == 1)
    {
      tableText += "<th id=\"oldstar\" style=\"width:20%;\">OldStar (desc)</th>";
    }
    else if (sortByOldStar == -1)
    {
      tableText += "<th id=\"oldstar\" style=\"width:20%;\">OldStar (incr)</th>";
    }
    if (sortByNewStar == 0)
    {
      tableText += "<th id=\"newstar\" style=\"width:20%;\">NewStar</th>";
    }
    else if (sortByNewStar == 1)
    {
      tableText += "<th id=\"newstar\" style=\"width:20%;\">NewStar (desc)</th>";
    }
    else if (sortByNewStar == -1)
    {
      tableText += "<th id=\"newstar\" style=\"width:20%;\">NewStar (incr)</th>";
    }
    if (sortByOldPP == 0)
    {
      tableText += "<th id=\"oldpp\" style=\"width:20%;\">OldPP</th>";
    }
    else if (sortByOldPP == 1)
    {
      tableText += "<th id=\"oldpp\" style=\"width:20%;\">OldPP (desc)</th>";
    }
    else if (sortByOldPP == -1)
    {
      tableText += "<th id=\"oldpp\" style=\"width:20%;\">OldPP (incr)</th>";
    }
    if (sortByNewPP == 0)
    {
      tableText += "<th id=\"newpp\" style=\"width:20%;\">NewPP</th>";
    }
    else if (sortByNewPP == 1)
    {
      tableText += "<th id=\"newpp\" style=\"width:20%;\">NewPP (desc)</th>";
    }
    else if (sortByNewPP == -1)
    {
      tableText += "<th id=\"newpp\" style=\"width:20%;\">NewPP (incr)</th>";
    }
    tableText += "</tr>";
  }
  


  let ppDifferenceSum = 0;
  let srDifferenceSum = 0;
  for (let i = 0; i < diffIds.length; ++i)
  {
    tableText += "<tr>";
    tableText += "<td style=\"width:5%;\">"+ songNames[diffIds[i]] +"</td>";
    tableText += "<td style=\"width:5%;\">"+ difficultyNames[diffIds[i]] +"</td>";
    tableText += "<td style=\"width:2%;\">"+ BPMs[diffIds[i]] +"</td>";
    let drainTimeAllSecond = Math.round(DrainTimes[diffIds[i]] / 1000); 
    let drainTimeSecond = drainTimeAllSecond % 60;
    if (drainTimeSecond < 10)
      drainTimeSecond = "0"+drainTimeSecond;
    let drainTimeMinute = (drainTimeAllSecond - drainTimeSecond) / 60;
    if (drainTimeMinute < 10)
      drainTimeMinute = "0"+drainTimeMinute;
    
    tableText += "<td style=\"width:3%;\">"+drainTimeMinute+":"+ drainTimeSecond +"</td>";
    tableText += "<td style=\"width:3%;\">" + NoteCounts[diffIds[i]] + "</td>";
    tableText += "<td style=\"width:2%;\">" + TypingSectionCounts[diffIds[i]] + "</td>";
    
    let oldStar = GetModdedStar(diffIds[i],srReworkFirst,selectedMod);
    let newStar = GetModdedStar(diffIds[i],srReworkSecond,selectedMod);
    tableText += "<td style=\"width:20%;\">"+ String(oldStar).replace(".",",") +"</td>";
    let colorR = 0;
    let colorG = 0;
    let colorB = 0;
    if (oldStar > newStar)
    {
      let changeSize = Math.min(oldStar/newStar, 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    else if (oldStar < newStar)
    {
      let changeSize = Math.min(newStar/oldStar, 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+"); width:20%;\">"+ String(newStar).replace(".",",") +"</td>";
    
    let oldPP = GetModdedPP(diffIds[i], ppReworkFirst, selectedMod);
    let newPP = GetModdedPP(diffIds[i], ppReworkSecond, selectedMod);
    tableText += "<td style=\"width:20%;\">"+ String(Math.round(oldPP)).replace(".",",") +"</td>";
    colorR = 0;
    colorG = 0;
    colorB = 0;
    if (oldPP > newPP)
    {
      let changeSize = Math.min(oldPP/newPP, 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    else if (oldPP < newPP)
    {
      let changeSize = Math.min(newPP/oldPP, 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+"); width:20%;\">"+ String(Math.round(newPP)).replace(".",",") +"</td>";
    tableText += "</tr>";

    srDifferenceSum += newStar - oldStar;
    ppDifferenceSum += newPP - oldPP;
  }
  let srAvgParagraph = document.getElementById("avgSRChange");
  let ppAvgParagraph = document.getElementById("avgPPChange");
  let srAverageDifference = Math.round(srDifferenceSum / diffIds.length*100)/100;
  let ppAverageDifference = Math.round(ppDifferenceSum / diffIds.length);
  if (diffIds.length == 0)
  {
    srAvgParagraph.style.display = "none"; 
    ppAvgParagraph.style.display = "none";
  }
  else
  {
    srAvgParagraph.style.display = "inline"; 
    ppAvgParagraph.style.display = "inline";
    srAvgParagraph.innerHTML = "Average sr difference: "+ srAverageDifference;
    ppAvgParagraph.innerHTML = "Average pp difference: "+ ppAverageDifference;

  }

  table.innerHTML = tableText;

  if (diffIds.length > 0)
  {
    document.getElementById("map").addEventListener("click", async (event) => { ChangeSort(0); });
    document.getElementById("difficulty").addEventListener("click", async (event) => { ChangeSort(1); });
    document.getElementById("bpm").addEventListener("click", async (event) => { ChangeSort(2); });
    document.getElementById("draintime").addEventListener("click", async (event) => { ChangeSort(3); });
    document.getElementById("notecount").addEventListener("click", async (event) => { ChangeSort(4); });
    document.getElementById("tscount").addEventListener("click", async (event) => { ChangeSort(5); });
    document.getElementById("oldstar").addEventListener("click", async (event) => { ChangeSort(6); });
    document.getElementById("newstar").addEventListener("click", async (event) => { ChangeSort(7); });
    document.getElementById("oldpp").addEventListener("click", async (event) => { ChangeSort(8); });
    document.getElementById("newpp").addEventListener("click", async (event) => { ChangeSort(9); });
  }
}

function ChangeSort(sortId)
{
  if (sortId == 0)
  {
    if (sortBySongName == 1)
      sortBySongName = -1;
    else
      sortBySongName++;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }

  if (sortId == 1)
  {
    sortBySongName = 0;    
    if (sortByDifficultyName == 1)
      sortByDifficultyName = -1;
    else
      sortByDifficultyName++;
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }
  if (sortId == 2)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0    
    if (sortByBPM == 1)
      sortByBPM = -1;
    else
      sortByBPM++;
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }
  if (sortId == 3)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    if (sortByDrainTime == 1)
      sortByDrainTime = -1;
    else
      sortByDrainTime++;
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }

  if (sortId == 4)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    if (sortByNoteCount == 1)
      sortByNoteCount = -1;
    else
      sortByNoteCount++;
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }
  if (sortId == 5)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    if (sortByTypingSectionCount == 1)
      sortByTypingSectionCount = -1;
    else
      sortByTypingSectionCount++;
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }
  if (sortId == 6)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    if (sortByOldStar == 1)
      sortByOldStar = -1;
    else
      sortByOldStar++;
    sortByNewStar = 0
    sortByOldPP = 0
    sortByNewPP = 0
  }

  if (sortId == 7)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    if (sortByNewStar == 1)
      sortByNewStar = -1;
    else
      sortByNewStar++;
    sortByOldPP = 0
    sortByNewPP = 0
  }
  if (sortId == 8)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    if (sortByOldPP == 1)
      sortByOldPP = -1;
    else
      sortByOldPP++;
    sortByNewPP = 0
  }
  if (sortId == 9)
  {
    sortBySongName = 0;
    sortByDifficultyName = 0
    sortByBPM = 0
    sortByDrainTime = 0
    sortByNoteCount = 0
    sortByTypingSectionCount = 0
    sortByOldStar = 0
    sortByNewStar = 0
    sortByOldPP = 0
    if (sortByNewPP == 1)
      sortByNewPP = -1;
    else
      sortByNewPP++;
  }

  DoSort();
  CreateTable();
}

function DoSort()
{
  let temp;
  if (sortBySongName == 0 && sortByDifficultyName == 0 && sortByBPM == 0 
    && sortByDrainTime == 0 && sortByNoteCount == 0 && sortByTypingSectionCount == 0
     && sortByOldStar == 0 && sortByNewStar == 0 && sortByOldPP == 0 && sortByNewPP == 0)
  {
    for (let i = 0; i < diffIds.length; ++i)
    {
      diffIds[i] = i;
    }
    return;
  }
  for (let i = 0; i < diffIds.length - 1; ++i)
  {
    for (let j = i + 1; j < diffIds.length; ++j)
    {
      let sortDirection = 0;
      let valueHeld1;
      let valueHeld2;
      if (sortBySongName != 0)
      {
        sortDirection = sortBySongName;
        valueHeld1 = String(songNames[diffIds[i]]).toLowerCase();
        valueHeld2 = String(songNames[diffIds[j]]).toLowerCase();
      }
      if (sortByDifficultyName != 0)
      {
        sortDirection = sortByDifficultyName;
        valueHeld1 = String(difficultyNames[diffIds[i]]).toLowerCase();
        valueHeld2 = String(difficultyNames[diffIds[j]]).toLowerCase();
      }
      if (sortByBPM != 0)
      {
        sortDirection = sortByBPM;
        valueHeld1 = BPMs[diffIds[i]];
        valueHeld2 = BPMs[diffIds[j]];
      }
      if (sortByDrainTime != 0)
      {
        sortDirection = sortByDrainTime;
        valueHeld1 = DrainTimes[diffIds[i]];
        valueHeld2 = DrainTimes[diffIds[j]];
      }
      if (sortByNoteCount != 0)
      {
        sortDirection = sortByNoteCount;
        valueHeld1 = NoteCounts[diffIds[i]];
        valueHeld2 = NoteCounts[diffIds[j]];
      }
      if (sortByTypingSectionCount != 0)
      {
        sortDirection = sortByTypingSectionCount;
        valueHeld1 = TypingSectionCounts[diffIds[i]];
        valueHeld2 = TypingSectionCounts[diffIds[j]];
      }
      if (sortByOldStar != 0)
      {
        sortDirection = sortByOldStar;
        valueHeld1 = Stars[srReworkFirst][diffIds[i]];
        valueHeld2 = Stars[srReworkFirst][diffIds[j]];
      }
      if (sortByNewStar != 0)
      {
        sortDirection = sortByNewStar;
        valueHeld1 = Stars[srReworkSecond][diffIds[i]];
        valueHeld2 = Stars[srReworkSecond][diffIds[j]];
      }
      if (sortByOldPP != 0)
      {
        sortDirection = sortByOldPP;
        valueHeld1 = PPs[ppReworkFirst][diffIds[i]];
        valueHeld2 = PPs[ppReworkFirst][diffIds[j]];
      }
      if (sortByNewPP != 0)
      {
        sortDirection = sortByNewPP;
        valueHeld1 = PPs[ppReworkSecond][diffIds[i]];
        valueHeld2 = PPs[ppReworkSecond][diffIds[j]];
      }
      if (valueHeld1 == valueHeld2)
        continue;
      if ((sortDirection == -1) != (valueHeld1 < valueHeld2))
      {
        let temp = diffIds[i];
        diffIds[i] = diffIds[j];
        diffIds[j] = temp;
      }
    }
  }
}

function LoadRankedBeatmaps()
{
  for (let i = 0; i < ppFormulaKeys.length; ++i)
  {
    PPs.push([]);
    PPDTNCs.push([]);
    PPHTDCs.push([]);
  }
  for (let i = 0; i < starFormulaKeys.length; ++i)
  {
    Stars.push([]);
    StarDTNCs.push([]);
    StarHTDCs.push([]);
  }
  for (let i = 0; i < RankedSongNames.length; ++i)
  {
    LoadedBeatmapIds.push(RankedBeatmapIds[i]);
    LoadedDifficultyIds.push(RankedDifficultyIds[i]);
    songNames.push(RankedSongNames[i]);
    difficultyNames.push(RankedDifficultyNames[i]);
    BPMs.push(RankedBPMs[i]);
    DrainTimes.push(RankedDrainTimes[i]);
    NoteCounts.push(RankedNoteCounts[i]);
    TypingSectionCounts.push(RankedTypingSectionCounts[i]);
    diffIds.push(diffIds.length);
  }
  for (let i = 0; i < RankedStars.length; ++i)
  {
    for (let j = 0; j < RankedStars[i].length; ++j)
    {
      Stars[i].push(RankedStars[i][j])
      StarDTNCs[i].push(RankedStarDTNCs[i][j])
      StarHTDCs[i].push(RankedStarHTDCs[i][j])
    }
  }
  
  for (let i = 0; i < RankedPPs.length; ++i)
  {
    for (let j = 0; j < RankedPPs[i].length; ++j)
    {
      PPs[i].push(RankedPPs[i][j])
      PPDTNCs[i].push(RankedPPDTNCs[i][j])
      PPHTDCs[i].push(RankedPPHTDCs[i][j])
    }
  }
}

function GetModdedStar(diffIdSingle, reworkId, mod)
{
  if (mod.includes("NC")|| mod.includes("DT"))
  {
    return StarDTNCs[reworkId][diffIdSingle];

  }
  if (mod.includes("DC")|| mod.includes("HT"))
  {
    return StarHTDCs[reworkId][diffIdSingle];    
  }
  return Stars[reworkId][diffIdSingle];
}

function GetModdedPP(diffIdSingle, reworkId, mod)
{
  if (mod.includes("NC")|| mod.includes("DT"))
  {
    return PPDTNCs[reworkId][diffIdSingle];

  }
  if (mod.includes("DC")|| mod.includes("HT"))
  {
    return PPHTDCs[reworkId][diffIdSingle];    
  }
  return PPs[reworkId][diffIdSingle];
}