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
let OldStars = [];
let NewStars = [];
let OldPPs = [];
let NewPPs = [];

let diffIds = [];
LoadRankedBeatmaps();
CreateTable();

function ChangeMenu()
{
  let changeMenuButton = document.getElementById("changemenubutton");
  if (changeMenuButton.value == "View profile pp change")
  {
    document.body.innerHTML = "<h1 class=\"title\">Rhythm typer SR/PP Rework</h1>\n"
    +"<h5 class=\"author\">By Valerus9</h5>\n"
    +"<input type=\"button\" id=\"changemenubutton\" value=\"View map sr/pp change\">\n"
    +"<input type=\"button\" id=\"calculatepp\" value=\"Calculate pp\">\n"
    +"<p>Input replay data from your profila page top play section</p>\n"
    +"<p id=\"totalPPOld\"></p>\n"
    +"<p id=\"totalPPNew\"></p>\n"
    +"<textarea name=\"replayTextArea\" style=\"height:500px;\" id=\"replayInput\"></textarea>"
    +"<table id=\"topplayList\">\n"
    +"</table>\n\n"
    +"<script src=\"main.js\"></script> ";
    document.getElementById("calculatepp").addEventListener("click", async (event) => { 
      CalculateTopPlayScores();
    });
  }
    
  else
  {
    document.body.innerHTML = "<h1 class=\"title\">Rhythm typer SR/PP Rework</h1>\n"
    +"<h5 class=\"author\">By Valerus9</h5>\n"
    +"<input type=\"button\" id=\"changemenubutton\" value=\"View profile pp change\">\n"
    +"<input type=\"file\" id=\"zipInput\" multiple accept=\".rtm\"/>\n"
    +"<!--<input type=\"file\" id=\"zipInputConverting\" multiple accept=\".rtm\"/>-->\n"
    +"<p id=\"avgSRChange\"></p>\n"
    +"<p id=\"avgPPChange\"></p>\n"
    +"<table id=\"diffList\">\n"
    +"</table>\n\n"
    +"<script src=\"main.js\"></script> ";
    CreateTable();
  }
    
  document.getElementById("changemenubutton").addEventListener("click", async (event) => { 
    ChangeMenu();
  });
}

function CalculateTopPlayScores()
{
  let replays = String(document.getElementById("replayInput").value).split("\n");
  let cleanedUpReplay = [];
  let modList = ["NC", "DC", "HT", "DT", "AT", "NF"];
  for (const replay of replays)
  {
    if (modList.includes(replay))
      continue;
    if (replay.startsWith("weighted") || replay.startsWith("#"))
      continue;
    cleanedUpReplay.push(replay);
  }
  let replayBeatmapName = [];
  let replayDiffIds = [];
  let replayAccuracy = [];
  for (let i = 0; i < cleanedUpReplay.length; ++i)
  {
    if (songNames.includes(cleanedUpReplay[i]))
    {
      replayBeatmapName.push(cleanedUpReplay[i]);
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
  let oldPP = 0;
  let newPP = 0;
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
    oldPP += ActualPP(OldPPs[i], i + 1);
    newPP += ActualPP(NewPPs[i], i + 1);
    topPlayText += "<td>"+songNames[replayDiffIds[i]]+"</td>";
    topPlayText += "<td>"+difficultyNames[replayDiffIds[i]]+"</td>";
    topPlayText += "<td>"+replayAccuracy[i]+"</td>";
    topPlayText += "<td>"+OldPPs[replayDiffIds[i]] + " ("+Math.round(ActualPP(OldPPs[i], i + 1))+")"+"</td>";
    topPlayText += "<td>"+NewPPs[replayDiffIds[i]] + " ("+Math.round(ActualPP(NewPPs[i], i + 1))+")"+"</td>";
    topPlayText += "</tr>";
  }
  document.getElementById("totalPPOld").innerHTML = "Total old PP: " + oldPP;
  document.getElementById("totalPPNew").innerHTML = "Total new PP: " + newPP;
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

document.getElementById("changemenubutton").addEventListener("click", async (event) => { 
  ChangeMenu();
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
    
    let star = starFormulas["valerusReworkV2"](difficulty);
    star = Math.round(star * 100) / 100;
    NewStars.push(star);

    let currentSr = starFormulas["originalCalculate"](difficulty);
    currentSr = Math.round(currentSr * 100) / 100;
    OldStars.push(currentSr);
    
    difficulty.accuracy = 100;    
    let pp = ppFormulas["valerusRework"](difficulty);
    pp = Math.round(pp);
    NewPPs.push(pp);

    let currentPP = ppFormulas["originalCalculate"](difficulty);
    currentPP = Math.round(currentPP);
    OldPPs.push(currentPP);
    diffIds.push(diffIds.length);

  }
  CreateTable();
});

function CreateTable()
{
  const table = document.getElementById("diffList");  
  let tableText = "";
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
    
    tableText += "<td style=\"width:20%;\">"+ String(OldStars[diffIds[i]]).replace(".",",") +"</td>";
    let colorR = 0;
    let colorG = 0;
    let colorB = 0;
    if (OldStars[diffIds[i]] > NewStars[diffIds[i]])
    {
      let changeSize = Math.min(OldStars[diffIds[i]]/NewStars[diffIds[i]], 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    else if (OldStars[diffIds[i]] < NewStars[diffIds[i]])
    {
      let changeSize = Math.min(NewStars[diffIds[i]]/OldStars[diffIds[i]], 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+"); width:20%;\">"+ String(NewStars[diffIds[i]]).replace(".",",") +"</td>";
    
    tableText += "<td style=\"width:20%;\">"+ String(OldPPs[diffIds[i]]).replace(".",",") +"</td>";
    colorR = 0;
    colorG = 0;
    colorB = 0;
    if (OldPPs[diffIds[i]] > NewPPs[diffIds[i]])
    {
      let changeSize = Math.min(OldPPs[diffIds[i]]/NewPPs[diffIds[i]], 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    else if (OldPPs[diffIds[i]] < NewPPs[diffIds[i]])
    {
      let changeSize = Math.min(NewPPs[diffIds[i]]/OldPPs[diffIds[i]], 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+"); width:20%;\">"+ String(NewPPs[diffIds[i]]).replace(".",",") +"</td>";
    tableText += "</tr>";

    srDifferenceSum += NewStars[diffIds[i]] - OldStars[diffIds[i]];
    ppDifferenceSum += NewPPs[diffIds[i]] - OldPPs[diffIds[i]];
  }
  let srAvgParagraph = document.getElementById("avgSRChange");
  let ppAvgParagraph = document.getElementById("avgPPChange");
  let srAverageDifference = Math.round(srDifferenceSum / diffIds.length*100)/100;
  let ppAverageDifference = Math.round(ppDifferenceSum / diffIds.length);
  srAvgParagraph.innerHTML = "Average sr difference: "+ srAverageDifference;
  ppAvgParagraph.innerHTML = "Average pp difference: "+ ppAverageDifference;

  table.innerHTML = tableText;

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
        valueHeld1 = OldStars[diffIds[i]];
        valueHeld2 = OldStars[diffIds[j]];
      }
      if (sortByNewStar != 0)
      {
        sortDirection = sortByNewStar;
        valueHeld1 = NewStars[diffIds[i]];
        valueHeld2 = NewStars[diffIds[j]];
      }
      if (sortByOldPP != 0)
      {
        sortDirection = sortByOldPP;
        valueHeld1 = OldPPs[diffIds[i]];
        valueHeld2 = OldPPs[diffIds[j]];
      }
      if (sortByNewPP != 0)
      {
        sortDirection = sortByNewPP;
        valueHeld1 = NewPPs[diffIds[i]];
        valueHeld2 = NewPPs[diffIds[j]];
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
    OldStars.push(RankedOldStars[i]);
    NewStars.push(RankedNewStars[i]);
    OldPPs.push(RankedOldPPs[i]);
    NewPPs.push(RankedNewPPs[i]);
    diffIds.push(diffIds.length);
  }
}

/*let convertedBeatmapIds = [];
let convertedDifficultyIds = [];

let convertedSongNames = [];
let convertedDifficultyNames = [];
let convertedBPMs = [];
let convertedDrainTimes = [];
let convertedNoteCounts = [];
let convertedTypingSectionCounts = [];
let convertedOldStars = [];
let convertedNewStars = [];
let convertedOldPPs = [];
let convertedNewPPs = [];

let convertedDifficulties = [];
let convertedBeatmaps = [];

document.getElementById("zipInputConverting").addEventListener("change", async (event) => {
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
        if (hasKey)
        {
          convertedDifficulties.push(data);
        }
        else
        {
          convertedBeatmaps.push(data);
        }
      }
    }        
  }

  for (const difficulty of convertedDifficulties)
  {
    let mapSongName = "";
    let mapBpm = 0;
    for (const beatmap of convertedBeatmaps)
    {
      if (beatmap.mapsetId == difficulty.mapsetId)
      {
        mapSongName = beatmap.songName;
        mapBpm = Math.round(beatmap.bpm);
        break;
      }      
    }
    convertedDifficultyIds.push(difficulty.diffId);
    convertedBeatmapIds.push(difficulty.mapsetId);
    convertedSongNames.push(mapSongName);
    convertedDifficultyNames.push(difficulty.name);
    convertedBPMs.push(mapBpm);
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
    convertedDrainTimes.push(drainTime);

    convertedNoteCounts.push(difficulty.notes.length);
    convertedTypingSectionCounts.push(difficulty.typingSections.length);
    
    let star = starFormulas["valerusReworkV2"](difficulty);
    star = Math.round(star * 100) / 100;
    convertedNewStars.push(star);

    let currentSr = starFormulas["originalCalculate"](difficulty);
    currentSr = Math.round(currentSr * 100) / 100;
    convertedOldStars.push(currentSr);
    
    difficulty.accuracy = 100;    
    let pp = ppFormulas["valerusRework"](difficulty);
    pp = Math.round(pp);
    convertedNewPPs.push(pp);

    let currentPP = ppFormulas["originalCalculate"](difficulty);
    currentPP = Math.round(currentPP);
    convertedOldPPs.push(currentPP);
    
  }
  let textBeatmapIds = "let RankedBeatmapIds = ["
  let textDifficultyIds = "let RankedDifficultyIds = ["
  let textSongNames = "let RankedSongNames = [";
  let textDifficultyNames = "let RankedDifficultyNames = [";
  let textBPMs = "let RankedBPMs = [";
  let textDrainTimes = "let RankedDrainTimes = [";
  let textNoteCounts = "let RankedNoteCounts = [";
  let textTypingSectionCounts = "let RankedTypingSectionCounts = [";
  let textOldStars = "let RankedOldStars = [";
  let textNewStars = "let RankedNewStars = [";
  let textOldPPs = "let RankedOldPPs = [";
  let textNewPPs = "let RankedNewPPs = [";
  for (let i = 0; i < convertedBeatmapIds.length; ++i)
  {
    textBeatmapIds += "\n    \""+convertedBeatmapIds[i]+"\",";
    textDifficultyIds += "\n    \""+convertedDifficultyIds[i]+"\",";
    textSongNames += "\n    \""+convertedSongNames[i] + "\",";
    textDifficultyNames += "\n    \""+convertedDifficultyNames[i] + "\",";
    textBPMs += "\n    "+convertedBPMs[i] + ",";
    textDrainTimes += "\n    "+convertedDrainTimes[i] + ",";
    textNoteCounts += "\n    "+convertedNoteCounts[i] + ",";
    textTypingSectionCounts += "\n    "+convertedTypingSectionCounts[i] + ",";
    textOldStars += "\n    "+convertedOldStars[i] + ",";
    textNewStars += "\n    "+convertedNewStars[i] + ",";
    textOldPPs += "\n    "+convertedOldPPs[i] + ",";
    textNewPPs += "\n    "+convertedNewPPs[i] + ",";
  }
  textBeatmapIds += "\n];";
  textDifficultyIds += "\n];";
  textSongNames += "\n];";
  textDifficultyNames += "\n];";
  textBPMs += "\n];";
  textDrainTimes += "\n];";
  textNoteCounts += "\n];";
  textTypingSectionCounts += "\n];";
  textOldStars += "\n];";
  textNewStars += "\n];";
  textOldPPs += "\n];";
  textNewPPs += "\n];";
  let rankedText = textSongNames + "\n" + textDifficultyNames + "\n" 
  + textBPMs + "\n" + textDrainTimes + "\n" + textNoteCounts + "\n" 
  + textTypingSectionCounts + "\n" + textOldStars + "\n" + textNewStars 
  + "\n" + textOldPPs + "\n" + textNewPPs + "\n" 
  + textBeatmapIds + "\n" + textDifficultyIds;
  console.log(rankedText);
});*/