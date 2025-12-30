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

document.getElementById("zipInput").addEventListener("change", async (event) => {
  const files = [...event.target.files].filter(f => f.name.endsWith(".rtm"));
  if (!files) return;
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
          difficultyList.push(data);
        }
        else
        {
          beatmapList.push(data);
        }
      }
    }        
  }
  const table = document.getElementById("diffList");  
  let tableText = "";
  tableText += "<tr>";
  tableText += "<th style=\"width:5%;\">Map</th>";
  tableText += "<th style=\"width:5%;\">Difficulty</th>";
  tableText += "<th>BPM</th>";
  tableText += "<th>DrainTime</th>";
  tableText += "<th>NoteCount</th>";
  tableText += "<th>TSCount</th>";
  tableText += "<th>OldStar</th>";
  tableText += "<th>NewStar</th>";
  tableText += "<th>OldPP</th>";
  tableText += "<th>NewPP</th>";
  tableText += "</tr>";

  for (const difficulty of difficultyList)
  {
    tableText += "<tr>";
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
    tableText += "<td style=\"width:5%;\">"+ mapSongName +"</td>";
    tableText += "<td style=\"width:5%;\">"+ difficulty.name +"</td>";
    tableText += "<td>"+ mapBpm +"</td>";
    let minTime = -1;
    let maxTime = 0;
    for (const note of difficulty.notes)
    {
      if (note.type == "tap")
      {
        if (minTime == -1)
        {
          minTime = note.time;
        }
        if (minTime > note.time)
        {
          minTime = note.time;
        }
        if (maxTime < note.time)
        {
          maxTime = note.time;
        }
      }
      else if (note.type == "hold")
      {
        if (minTime == -1)
        {
          minTime = note.startTime;          
        }
        if (minTime > note.startTime)
        {
          minTime = note.startTime;
        }
        if (maxTime < note.endTime)
        {
          maxTime = note.endTime;
        }
      }
    }
    for (const typingSection of difficulty.typingSections)
    {
      if (minTime == -1)
      {
        minTime = typingSection.startTime;
      }
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
    let drainTimeAllSecond = Math.round(drainTime / 1000); 
    let drainTimeSecond = drainTimeAllSecond % 60;
    if (drainTimeSecond < 10)
      drainTimeSecond = "0"+drainTimeSecond;
    let drainTimeMinute = (drainTimeAllSecond - drainTimeSecond) / 60;
    if (drainTimeMinute < 10)
      drainTimeMinute = "0"+drainTimeMinute;
    
    tableText += "<td>"+drainTimeMinute+":"+ drainTimeSecond +"</td>";
    tableText += "<td>" + difficulty.notes.length + "</td>";
    tableText += "<td>" + difficulty.typingSections.length + "</td>";
    
    let star = starFormulas["valerusReworkV2"](difficulty);
    star = Math.round(star * 100) / 100
    
    let currentSr = starFormulas["originalCalculate"](difficulty);
    currentSr = Math.round(currentSr * 100) / 100
    
    tableText += "<td>"+ String(currentSr).replace(".",",") +"</td>";
    let colorR = 0;
    let colorG = 0;
    let colorB = 0;
    if (currentSr > star)
    {
      let changeSize = Math.min(currentSr/star, 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    else if (currentSr < star)
    {
      let changeSize = Math.min(star/currentSr, 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+");\">"+ String(star).replace(".",",") +"</td>";
    
    difficulty.accuracy = 100;    
    let pp = ppFormulas["valerusRework"](difficulty);
    pp = Math.round(pp);

    let currentPP = ppFormulas["originalCalculate"](difficulty);
    currentPP = Math.round(currentPP);
    
    tableText += "<td>"+ String(currentPP).replace(".",",") +"</td>";
    colorR = 0;
    colorG = 0;
    colorB = 0;
    if (currentPP > pp)
    {
      let changeSize = Math.min(currentPP/pp, 2) / 2;
      colorG = Math.round(0 + 250*changeSize);
    }
    else if (currentPP < pp)
    {
      let changeSize = Math.min(pp/currentPP, 2) / 2;
      colorR = Math.round(0 + 250*changeSize);
    }
    tableText += "<td style=\"color:rgb("+colorR+","+colorG+","+colorB+");\">"+ String(pp).replace(".",",") +"</td>";
    tableText += "</tr>";
  }
  
  table.innerHTML = tableText;
});