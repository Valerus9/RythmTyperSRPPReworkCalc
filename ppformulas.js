ppFormulas = {
  originalCalculate(scoreData) {
    let convertedNotes = [];
    for (const note of scoreData.notes)
    {
      if (note.type == "hold")
      {
        let convertedNote = 
        { 
          startTime: note.startTime / 1000,
          endTime: note.endTime / 1000,
          type: note.type,
          key: note.key,
        };
        convertedNotes.push(convertedNote);
      }
      if (note.type == "tap")
      {
        let convertedNote = 
        { 
          time: note.time / 1000,
          startTime: note.time / 1000,
          type: note.type,
          key: note.key,
        };
        convertedNotes.push(convertedNote);
      }
      
    }

    const notes = convertedNotes;
    const od = scoreData.overallDifficulty;
    const acc = scoreData.accuracy / 100;
  
    const MIN_DT = 0.04;
    const ALPHA = 0.85;
    const HALF_LIFE = 0.25;
    const TAIL_FRAC = 0.10;
    const PP_PER_UNIT = 10;
    const OD_SLOPE = 0.08;
    const MAX_LEN_NOTES = 500;
    const MAX_LEN_BONUS = 1.25;
  
    const chordBonus = k =>
      1 + 1.6 * (1 - Math.exp(-0.6 * Math.max(0, k - 1)));
  
    const reusePenalty = d =>
      0.55 * Math.exp(-0.7 * (d - 1));
  
    /* build events */
  
    const byTime = {};
    for (const n of notes) {
      (byTime[n.startTime] ??= []).push(n.key);
    }
  
    const times = Object.keys(byTime).map(Number).sort((a, b) => a - b);
  
    const events = times.map(t => {
      const keys = [...new Set(byTime[t])];
      return { t, keys };
    });
  
    /* strain, EMA */
  
    let ema = 0;
    let lastT = times[0];
    const emaVals = [];
    const history = [];
  
    for (const e of events) {
      const dt = Math.max(MIN_DT, e.t - lastT);
      let strain = Math.pow(1 / dt, ALPHA);
  
      let reuse = 0;
      for (let d = 1; d <= history.length; d++) {
        if (e.keys.some(k => history[history.length - d].has(k))) {
          reuse += reusePenalty(d);
        }
      }
  
      strain *= Math.max(0.2, 1 - reuse);
      strain *= chordBonus(e.keys.length);
  
      const decay = Math.pow(0.5, dt / HALF_LIFE);
      ema = ema * decay + strain * (1 - decay);
      emaVals.push(ema);
  
      history.push(new Set(e.keys));
      if (history.length > 6) history.shift();
  
      lastT = e.t;
    }
  
    /* aggregate difficulty */
  
    emaVals.sort((a, b) => b - a);
    const take = Math.max(1, Math.floor(emaVals.length * TAIL_FRAC));
    const core =
      emaVals.slice(0, take).reduce((s, v) => s + v, 0) / take;
  
    /* final scaling */
  
    const x = Math.min(notes.length, MAX_LEN_NOTES);
    const lenBonus =
      1 +
      (MAX_LEN_BONUS - 1) *
        Math.log(1 + x) /
        Math.log(1 + MAX_LEN_NOTES);
  
    const odBonus = 1 + OD_SLOPE * (od - 5);
    const accBonus = Math.pow(acc, 5); 
  
    return core * lenBonus * PP_PER_UNIT * odBonus * accBonus;
  },
  valerusRework(scoreData)
  {
    const notes = scoreData.notes;
    const typingSections = scoreData.typingSections;
    const accuracy = Math.pow(scoreData.accuracy / 100, 4.5); 
    const KEYBOARDLAYOUT = [
      "q","w","e","r","t", "y","u","i","o","p",
      "a","s","d","f","g", "h","j","k","l",";",
      "z","x","c","v","b", "n","m",",",".","/",
    ];
    const TOTALOBJECTS = notes.length + typingSections.length; 
    const OBJECTTIMEDIFFERENCE = 500;
    const REWARDTIMEDIFFERENCE = OBJECTTIMEDIFFERENCE / 2;
    const OBJECTOVERWEIGHTLIMIT = 20;
    const getKeyboardRow = x => {
      return (KEYBOARDLAYOUT.indexOf(x.key) - KEYBOARDLAYOUT.indexOf(x.key) % 10) / 10;
    }
    const getKeyboardColumn = x => {
      return KEYBOARDLAYOUT.indexOf(x.key) % 10;
    }
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
    let minTime = Infinity;
    let maxTime = 0;
    let typingSectionDifficulties = [];
    let typingSectionTime = 0;
    for (let i = 0; i < typingSections.length; ++i)
    {
      if (typingSections[i].startTime < minTime)
        minTime = typingSections[i].startTime;
      if (typingSections[i].endTime > maxTime)
        maxTime = typingSections[i].endTime;
      typingSectionDifficulties.push(1000);
    }
    let sortedTimeNotes = [];
    let noteDifficulties = [];
    let heldNoteCounts = [];
    for (let i = 0; i < notes.length; ++i)
    {
      if (getStartTime(notes[i]) < minTime)
        minTime = getStartTime(notes[i]);
      if (getEndTime(notes[i]) > maxTime)
        maxTime = getEndTime(notes[i]);
      sortedTimeNotes.push(i);
      noteDifficulties.push(10000);
      heldNoteCounts.push(0);
    }
    const drainTime = maxTime - minTime;
    const drainTimeSecond = drainTime / 1000;

    for (let i = 0; i < sortedTimeNotes.length - 1; ++i)
    {
      for (let j = i + 1; j < sortedTimeNotes.length; ++j)
      {
        if (getStartTime[notes[sortedTimeNotes[i]]] > getStartTime[notes[sortedTimeNotes[j]]])
        {
          let temp = sortedTimeNotes[i];
          sortedTimeNotes[i] = sortedTimeNotes[j];
          sortedTimeNotes[j] = temp;
        }
      }
    }

    let keyboardNotes = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
    ];
    let keyboardSortedIds = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
    ];
    let sortedKeyboardIds = [];
    for (let i = 0; i < sortedTimeNotes.length; ++i)
    {
      let selectedNote = notes[sortedTimeNotes[i]];
      let keyboardIndex = KEYBOARDLAYOUT.indexOf(selectedNote.key);
      sortedKeyboardIds.push([keyboardIndex, keyboardNotes.length - 1]);
      keyboardNotes[keyboardIndex].push(selectedNote);
      keyboardSortedIds[keyboardIndex].push(i);
    }
    //console.log(keyboardNotes);
    for (let i = 0; i < keyboardNotes.length; ++i)
    {
      for (let j = keyboardNotes[i].length - 1; j > -1; --j)
      {
        let distances = [];
        let distanceCount = [];
        for (let k = j - 1; k > - 1; --k)
        {
          let laterNote = keyboardNotes[i][k + 1];
          let earlierNote = keyboardNotes[i][k];
          let laterStartTime = getStartTime(laterNote);
          let earlierEndTime = getEndTime(earlierNote);
          let distance = laterStartTime - earlierEndTime;
          let containsDistance = false;
          for (let l = 0; l < distances.length; ++l)
          {
            if (distances[l] - 50 < distance && distances[l] + 50 > distance)
            {
              distanceCount[l]++;
              containsDistance = true;
            }
          }
          if (!containsDistance)
          {
            distances.push(distance);
            distanceCount.push(1);
          }
        }
        let maxCount = 0;
        let maxCountDistance = 0;
        for (let k = 0; k < distances.length; ++k)
        {
          if (distanceCount[k] > maxCount)
          {
            maxCount = distanceCount[k];
            maxCountDistance = distances[k];
          }          
        }
        let distanceFactor = Math.min(Math.pow((100+maxCountDistance/2)/200, 1.5),1);
        noteDifficulties[keyboardSortedIds[i][j]] *= Math.pow(Math.min(3/(maxCount+1),1), distanceFactor);
      }
    }

    let objectDifficultySum = 0;
    for (let i = 1; i < sortedTimeNotes.length; ++i)
    {
      let selectedNoteIndex = sortedTimeNotes[i];
      let previousNoteIndex = sortedTimeNotes[i - 1];
      
      for (let j = i + 1; j < sortedTimeNotes.length; ++j)
      {
        if (notes[sortedTimeNotes[i]].type != "hold")
          break;
        let nextNoteIndex = sortedTimeNotes[j];
        let selectedEndTime = getEndTime(notes[selectedNoteIndex]);
        let nextStartTime = getStartTime(notes[nextNoteIndex]);
        if (selectedEndTime > nextStartTime)
          heldNoteCounts[nextNoteIndex]++;
        else if (selectedEndTime < nextStartTime)
          break;
      }

      let timeDurationBonus = 1;      
      let previousEndTime = getEndTime(notes[previousNoteIndex]);
      let selectedStartTime = getStartTime(notes[selectedNoteIndex]);
      if (selectedStartTime > previousEndTime)
        timeDurationBonus = OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE);
      
      let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 1/1.12);

      objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus;
    }
    for (let i = 0; i < typingSectionDifficulties.length; ++i)
    {
      let uniqueLetters = new Set(typingSections[i].text);
      let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
      objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf *8;
    }
    let objectDensity = TOTALOBJECTS/drainTimeSecond;
    let highObjectDensityPower = Math.pow(objectDensity, 0.54);
    let tooHighObjectCountNerf = Math.pow(Math.min(1/(objectDensity)+(1-1/OBJECTOVERWEIGHTLIMIT),1),highObjectDensityPower);
    let tooShortNerf = 1;
    if (drainTimeSecond < 30)
      tooShortNerf = Math.pow((drainTimeSecond/2 + 15 )/ 30,4);
    let difficultyDensity = Math.pow(objectDifficultySum * tooHighObjectCountNerf * tooShortNerf,1.05)/ drainTime;
    if (difficultyDensity > 1000)
    {
      difficultyDensity =1000*Math.pow(difficultyDensity/1000,0.4);
    }
    //if (difficultyDensity < 2)
    //{
    //  difficultyDensity = difficultyDensity / 2 + 1
    //}
    return difficultyDensity * Math.pow(accuracy, 5);

  },
  valerusReworkwithOD(scoreData)
  {
    const notes = scoreData.notes;
    const typingSections = scoreData.typingSections;
    const accuracy = Math.pow(scoreData.accuracy / 100, 4.5); 
    const KEYBOARDLAYOUT = [
      "q","w","e","r","t", "y","u","i","o","p",
      "a","s","d","f","g", "h","j","k","l",";",
      "z","x","c","v","b", "n","m",",",".","/",
    ];
    const TOTALOBJECTS = notes.length + typingSections.length; 
    const OBJECTTIMEDIFFERENCE = 500;
    const REWARDTIMEDIFFERENCE = OBJECTTIMEDIFFERENCE / 2;
    const OBJECTOVERWEIGHTLIMIT = 20;
    const getKeyboardRow = x => {
      return (KEYBOARDLAYOUT.indexOf(x.key) - KEYBOARDLAYOUT.indexOf(x.key) % 10) / 10;
    }
    const getKeyboardColumn = x => {
      return KEYBOARDLAYOUT.indexOf(x.key) % 10;
    }
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
    let minTime = Infinity;
    let maxTime = 0;
    let typingSectionDifficulties = [];
    let typingSectionTime = 0;
    for (let i = 0; i < typingSections.length; ++i)
    {
      if (typingSections[i].startTime < minTime)
        minTime = typingSections[i].startTime;
      if (typingSections[i].endTime > maxTime)
        maxTime = typingSections[i].endTime;
      typingSectionDifficulties.push(1000);
    }
    let sortedTimeNotes = [];
    let noteDifficulties = [];
    let heldNoteCounts = [];
    for (let i = 0; i < notes.length; ++i)
    {
      if (getStartTime(notes[i]) < minTime)
        minTime = getStartTime(notes[i]);
      if (getEndTime(notes[i]) > maxTime)
        maxTime = getEndTime(notes[i]);
      sortedTimeNotes.push(i);
      noteDifficulties.push(10000);
      heldNoteCounts.push(0);
    }
    const drainTime = maxTime - minTime;
    const drainTimeSecond = drainTime / 1000;

    for (let i = 0; i < sortedTimeNotes.length - 1; ++i)
    {
      for (let j = i + 1; j < sortedTimeNotes.length; ++j)
      {
        if (getStartTime[notes[sortedTimeNotes[i]]] > getStartTime[notes[sortedTimeNotes[j]]])
        {
          let temp = sortedTimeNotes[i];
          sortedTimeNotes[i] = sortedTimeNotes[j];
          sortedTimeNotes[j] = temp;
        }
      }
    }

    let keyboardNotes = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
    ];
    let keyboardSortedIds = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[],
    ];
    let sortedKeyboardIds = [];
    for (let i = 0; i < sortedTimeNotes.length; ++i)
    {
      let selectedNote = notes[sortedTimeNotes[i]];
      let keyboardIndex = KEYBOARDLAYOUT.indexOf(selectedNote.key);
      sortedKeyboardIds.push([keyboardIndex, keyboardNotes.length - 1]);
      keyboardNotes[keyboardIndex].push(selectedNote);
      keyboardSortedIds[keyboardIndex].push(i);
    }
    //console.log(keyboardNotes);
    for (let i = 0; i < keyboardNotes.length; ++i)
    {
      for (let j = keyboardNotes[i].length - 1; j > -1; --j)
      {
        let distances = [];
        let distanceCount = [];
        for (let k = j - 1; k > - 1; --k)
        {
          let laterNote = keyboardNotes[i][k + 1];
          let earlierNote = keyboardNotes[i][k];
          let laterStartTime = getStartTime(laterNote);
          let earlierEndTime = getEndTime(earlierNote);
          let distance = laterStartTime - earlierEndTime;
          let containsDistance = false;
          for (let l = 0; l < distances.length; ++l)
          {
            if (distances[l] - 50 < distance && distances[l] + 50 > distance)
            {
              distanceCount[l]++;
              containsDistance = true;
            }
          }
          if (!containsDistance)
          {
            distances.push(distance);
            distanceCount.push(1);
          }
        }
        let maxCount = 0;
        let maxCountDistance = 0;
        for (let k = 0; k < distances.length; ++k)
        {
          if (distanceCount[k] > maxCount)
          {
            maxCount = distanceCount[k];
            maxCountDistance = distances[k];
          }          
        }
        let distanceFactor = Math.min(Math.pow((100+maxCountDistance/2)/200, 1.5),1);
        noteDifficulties[keyboardSortedIds[i][j]] *= Math.pow(Math.min(3/(maxCount+1),1), distanceFactor);
      }
    }

    let objectDifficultySum = 0;
    const overallDifficulty = scoreData.overallDifficulty;
    for (let i = 1; i < sortedTimeNotes.length; ++i)
    {
      let selectedNoteIndex = sortedTimeNotes[i];
      let previousNoteIndex = sortedTimeNotes[i - 1];
      
      for (let j = i + 1; j < sortedTimeNotes.length; ++j)
      {
        if (notes[sortedTimeNotes[i]].type != "hold")
          break;
        let nextNoteIndex = sortedTimeNotes[j];
        let selectedEndTime = getEndTime(notes[selectedNoteIndex]);
        let nextStartTime = getStartTime(notes[nextNoteIndex]);
        if (selectedEndTime > nextStartTime)
          heldNoteCounts[nextNoteIndex]++;
        else if (selectedEndTime < nextStartTime)
          break;
      }

      let timeDurationBonus = 1;      
      let previousEndTime = getEndTime(notes[previousNoteIndex]);
      let selectedStartTime = getStartTime(notes[selectedNoteIndex]);
      if (selectedStartTime > previousEndTime)
        timeDurationBonus = OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE);
      
      let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 1/1.12);
      let odbonus = Math.pow(overallDifficulty / 5, 2) / 10 + 0.9;

      objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus * odbonus;
    }
    for (let i = 0; i < typingSectionDifficulties.length; ++i)
    {
      let uniqueLetters = new Set(typingSections[i].text);
      let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
      objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf *8;
    }
    let objectDensity = TOTALOBJECTS/drainTimeSecond;
    let highObjectDensityPower = Math.pow(objectDensity, 0.54);
    let tooHighObjectCountNerf = Math.pow(Math.min(1/(objectDensity)+(1-1/OBJECTOVERWEIGHTLIMIT),1),highObjectDensityPower);
    let tooShortNerf = 1;
    if (drainTimeSecond < 30)
      tooShortNerf = Math.pow((drainTimeSecond/2 + 15 )/ 30,4);
    let difficultyDensity = Math.pow(objectDifficultySum * tooHighObjectCountNerf * tooShortNerf,1.05)/ drainTime;
    if (difficultyDensity > 1000)
    {
      difficultyDensity =1000*Math.pow(difficultyDensity/1000,0.4);
    }
    //if (difficultyDensity < 2)
    //{
    //  difficultyDensity = difficultyDensity / 2 + 1
    //}
    return difficultyDensity * Math.pow(accuracy, 5);

  },
};