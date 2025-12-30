starFormulas = {
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
  
    const MIN_DT = 0.04;
    const ALPHA = 0.85;
    const HALF_LIFE = 0.25;
    const TAIL_FRAC = 0.10;
    const STAR_SCALE = 1.0;
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
  
      if (n.type === 'hold' && n.endTime != null && n.endTime > n.startTime) {
        (byTime[n.endTime] ??= []).push(n.key);
      }
    }
  
    const times = Object.keys(byTime).map(Number).sort((a, b) => a - b);
  
    const events = times.map(t => ({
      t,
      keys: [...new Set(byTime[t])]
    }));
  
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
  
    const x = Math.min(events.length, MAX_LEN_NOTES);
    const lenBonus =
      1 +
      (MAX_LEN_BONUS - 1) *
        Math.log(1 + x) /
        Math.log(1 + MAX_LEN_NOTES);
  
    const odBonus = 1 + OD_SLOPE * (od - 5);
    return core * lenBonus * odBonus * STAR_SCALE;
  },

  /*valerusRework(scoreData) {
    const notes = [...scoreData.notes];
    const typingSections = scoreData.typingSections;        
    //const od = scoreData.overallDifficulty;

    const STAR_SCALE = 0.1;
    const DISTANCE_SCALE = 1000;
    const TYPINGSECTION_STRENGTH = 0.1;
    //Whem slider is so fast that it is actually just a button
    const SLIDER_MIN_LENGTH = 50;

    
    let noteDiffs = 0;
    let minTime = 0;
    if (notes.length > 0)
    {
      if (notes[0].type == "tap")
        minTime = notes[0].time;
      if (notes[0].type == "hold")
        minTime = notes[0].startTime;
    }
    
    let maxTime = 0;
    let startTimes = [];
    let timeCount = [];
    let endTimes = []; 
    let idsTimes = [];
    let idCounter = 0;
    for (const note of notes)
    {
      if (note.type == "tap")
      {
        if (!startTimes.includes(note.time))
        {
          startTimes.push(note.time);
          endTimes.push(note.time);
          timeCount.push(1);              
          idsTimes.push([idCounter]);
        }
        else
        {
          let indexOfTime = startTimes.indexOf(note.time);
          timeCount[indexOfTime] += 1;
          idsTimes[indexOfTime].push(idCounter);
        }
        if (minTime > note.time)
          minTime = note.time;                    
        if (maxTime < note.time)
          maxTime = note.time;               
      }
      if (note.type == "hold")
      {
        if (!startTimes.includes(note.startTime))
        {
          startTimes.push(note.startTime);
          endTimes.push(note.endTime);                  
          timeCount.push(1);   
          idsTimes.push([idCounter]);
        }                
        else
        {
          let indexOfTime = startTimes.indexOf(note.startTime);
          if (endTimes[indexOfTime] < note.endTime)
            endTimes[indexOfTime] = note.endTime
          timeCount[indexOfTime] += 1;
          idsTimes[indexOfTime].push(idCounter);
        }
        let difference = note.endTime - note.startTime
        if (difference > SLIDER_MIN_LENGTH)
        {
          difference = note.endTime - note.startTime - (SLIDER_MIN_LENGTH / 2);
          noteDiffs += DISTANCE_SCALE / difference;
        }

        if (minTime > note.startTime)
          minTime = note.startTime;                    
        if (maxTime < note.endTime)
          maxTime = note.endTime;
      }
      idCounter++;
    }
    for (let i = 0; i < startTimes.length - 1; ++i)
    {
      for (let j = i + 1; j < startTimes.length; ++j)
      {
        if (startTimes[i] > startTimes[j])
        {
          let temp = startTimes[i];
          startTimes[i] = startTimes[j];
          startTimes[j] = temp;
          temp = endTimes[i];
          endTimes[i] = endTimes[j];
          endTimes[j] = temp;
          temp = timeCount[i];
          timeCount[i] = timeCount[j];
          timeCount[j] = temp;
        }
      }
    }
    
    idCounter = 0;
    for (const typingSection of typingSections)
    {
      if (!startTimes.includes(typingSection.startTime))
      {
        for (let i = 0; i < startTimes.length; ++i)
        {
          if (startTimes[i] > typingSection.startTime)
          {
            if (i == 0)
            {
              startTimes.unshift(typingSection.startTime);
              endTimes.unshift(typingSection.endTime);                  
              timeCount.unshift(1);
              idsTimes.unshift([-idCounter]);
              break;
            }
            else
            {
              startTimes.splice(i,0,typingSection.startTime);
              endTimes.splice(i,0,typingSection.endTime);                  
              timeCount.splice(i,0,1);
              idsTimes.splice(i,0,[-idCounter]);
              break;
            }
          }
        }
      }                
      else
      {
        let indexOfTime = startTimes.indexOf(typingSection.startTime);
        if (endTimes[indexOfTime] < typingSection.endTime)
          endTimes[indexOfTime] = typingSection.endTime;
        timeCount[indexOfTime] += 1;
      }
      let difference = typingSection.endTime - typingSection.startTime;
      difference = difference / typingSection.text.length;
      const uniqueChars = [...new Set(typingSection.text)];
      diffCharBonus =  uniqueChars.length / 5;
      noteDiffs += (DISTANCE_SCALE / difference) * diffCharBonus * TYPINGSECTION_STRENGTH;
      if (minTime > typingSection.startTime)
        minTime = typingSection.startTime;                    
      if (maxTime < typingSection.endTime)
        maxTime = typingSection.endTime;
      idCounter++;
    }
    const drainTime = Math.round((maxTime - minTime) / 1000)   



    let previousNoteEndTime = 0;
    let previousNoteStartTime = 0;
    let heldNotesEndTimes = [];
    for (let i = 0; i < startTimes.length; ++i)
    {
      
      for (let j = 0; j < heldNotesEndTimes.length; ++j)
      {
        if (heldNotesEndTimes[j] < startTimes[i])
        {
          heldNotesEndTimes.splice(j,1);
          --j;
        }
      }
      let multipleBonus = 1 / (2 * timeCount[i]);
      let heldNoteBonus = 1/(heldNotesEndTimes.length + 1);
      let difference = (startTimes[i] - previousNoteEndTime);
      if (previousNoteEndTime >= startTimes[i])
        difference = (startTimes[i] - previousNoteStartTime);
      if (heldNoteBonus > 1)
      {
        console.log(heldNoteBonus);
        console.log(heldNotesEndTimes.length);
        console.log(heldNotesEndTimes);
      }
      
      difference = heldNoteBonus * multipleBonus * difference * ((multipleBonus - 1) / 1.5 + 1);
      if (previousNoteEndTime == 0)
        difference = 1;
      if (difference < 1)
      {
        console.log(i+" "+difference);
        console.log(startTimes.slice(i-2,i+1));
        console.log(endTimes.slice(i-2,i+1));
      }
        
      //difference = Math.max(difference, 1);
      difference = DISTANCE_SCALE / difference;
      let decay = 1;
      //let decayLimit = 3*drainTime
      //if (startTimes.length > decayLimit)
      //{
      //  decay = Math.min((-noteDiffCounter+decayLimit+(startTimes.length - decayLimit))/(startTimes.length - decayLimit),1);
      //}
      noteDiffs += difference * decay;
      previousNoteEndTime = endTimes[i];
      previousNoteStartTime = startTimes[i];
      if (endTimes[i] > startTimes[i] && !heldNotesEndTimes.includes(endTimes[i]))
        heldNotesEndTimes.push(endTimes[i]);
    }   
    let lenBonus = drainTime / 60;
    if (lenBonus > 1)
    {
      lenBonus = Math.sqrt(lenBonus);
    }
    let densityBonus =1 + (startTimes.length / drainTime) / 10;
    
    return Math.pow(Math.sqrt(noteDiffs / Math.sqrt(drainTime)) * STAR_SCALE * densityBonus, 1.34); 
  },*/

  valerusRework(scoreData) {
    const notes = [...scoreData.notes];
    const typingSections = scoreData.typingSections;        
    //const od = scoreData.overallDifficulty;

    const STAR_SCALE = 0.1;
    const DISTANCE_SCALE = 1000;
    const TYPINGSECTION_STRENGTH = 0.1;
    //Whem slider is so fast that it is actually just a button
    const SLIDER_MIN_LENGTH = 50;

    //For calculating the amount of keys you have to press at max.
    const DENSITY_THRESHOLD = 10000;

    //If key is pressed after such a short time then it is a pattern.
    const REPEAT_THRESHOLD = 5000;
    
    let noteDiffs = 0;
    let minTime = 0;
    if (notes.length > 0)
    {
      if (notes[0].type == "tap")
        minTime = notes[0].time;
      if (notes[0].type == "hold")
        minTime = notes[0].startTime;
    }
    
    let maxTime = 0;
    let startTimes = [];
    let timeCount = [];
    let endTimes = []; 
    let idsTimes = [];
    let idCounter = 0;
    for (const note of notes)
    {
      if (note.type == "tap")
      {
        if (!startTimes.includes(note.time))
        {
          startTimes.push(note.time);
          endTimes.push(note.time);
          timeCount.push(1);              
          idsTimes.push([idCounter]);
        }
        else
        {
          let indexOfTime = startTimes.indexOf(note.time);
          timeCount[indexOfTime] += 1;
          idsTimes[indexOfTime].push(idCounter);
        }
        if (minTime > note.time)
          minTime = note.time;                    
        if (maxTime < note.time)
          maxTime = note.time;               
      }
      if (note.type == "hold")
      {
        if (!startTimes.includes(note.startTime))
        {
          startTimes.push(note.startTime);
          endTimes.push(note.endTime);                  
          timeCount.push(1);   
          idsTimes.push([idCounter]);
        }                
        else
        {
          let indexOfTime = startTimes.indexOf(note.startTime);
          if (endTimes[indexOfTime] < note.endTime)
            endTimes[indexOfTime] = note.endTime
          timeCount[indexOfTime] += 1;
          idsTimes[indexOfTime].push(idCounter);
        }
        let difference = note.endTime - note.startTime
        if (difference > SLIDER_MIN_LENGTH)
        {
          difference = note.endTime - note.startTime - (SLIDER_MIN_LENGTH / 2);
          noteDiffs += DISTANCE_SCALE / difference;
        }

        if (minTime > note.startTime)
          minTime = note.startTime;                    
        if (maxTime < note.endTime)
          maxTime = note.endTime;
      }
      idCounter++;
    }
    for (let i = 0; i < startTimes.length - 1; ++i)
    {
      for (let j = i + 1; j < startTimes.length; ++j)
      {
        if (startTimes[i] > startTimes[j])
        {
          let temp = startTimes[i];
          startTimes[i] = startTimes[j];
          startTimes[j] = temp;
          temp = endTimes[i];
          endTimes[i] = endTimes[j];
          endTimes[j] = temp;
          temp = timeCount[i];
          timeCount[i] = timeCount[j];
          timeCount[j] = temp;
        }
      }
    }

    idCounter = 0;
    for (const typingSection of typingSections)
    {
      if (!startTimes.includes(typingSection.startTime))
      {
        for (let i = 0; i < startTimes.length; ++i)
        {
          if (startTimes[i] > typingSection.startTime)
          {
            if (i == 0)
            {
              startTimes.unshift(typingSection.startTime);
              endTimes.unshift(typingSection.endTime);                  
              timeCount.unshift(1);
              idsTimes.unshift([-idCounter]);
              break;
            }
            else
            {
              startTimes.splice(i,0,typingSection.startTime);
              endTimes.splice(i,0,typingSection.endTime);                  
              timeCount.splice(i,0,1);
              idsTimes.splice(i,0,[-idCounter]);
              break;
            }
          }
        }
      }                
      else
      {
        let indexOfTime = startTimes.indexOf(typingSection.startTime);
        if (endTimes[indexOfTime] < typingSection.endTime)
          endTimes[indexOfTime] = typingSection.endTime;
        timeCount[indexOfTime] += 1;
      }
      let difference = typingSection.endTime - typingSection.startTime;
      difference = difference / typingSection.text.length;
      const uniqueChars = [...new Set(typingSection.text)];
      diffCharBonus =  uniqueChars.length / 5;
      noteDiffs += (DISTANCE_SCALE / difference) * diffCharBonus * TYPINGSECTION_STRENGTH;
      if (minTime > typingSection.startTime)
        minTime = typingSection.startTime;                    
      if (maxTime < typingSection.endTime)
        maxTime = typingSection.endTime;
      idCounter++;
    }
    const drainTime = Math.round((maxTime - minTime) / 1000)   

    
    const getStartTime = x => {
      if (x.type == "tap")
        return x.time;
      if (x.type == "hold")
        return x.startTime;
    }

    let maxDensity = 0;
    for (let i = 0; i < idsTimes.length; ++i)
    {
      for (let j = 0; j < idsTimes[i].length; ++j)
      {
        if (idsTimes[i][j] <0)
          continue;
        let alreadyEnded = false;
        let countOfNotes = 1;
        for (let k = i; k < idsTimes.length; ++k)
        {
          let end = getStartTime(notes[idsTimes[i][j]]) + DENSITY_THRESHOLD;
          for (let l = j + 1; l < idsTimes[k].length; ++l)
          {
            if (getStartTime(notes[idsTimes[k][l]]) > end)
            {
              alreadyEnded = true;
              break;
            }
            else
            {
              countOfNotes++;
            }
          }
          if (alreadyEnded)
          {
            if (maxDensity < countOfNotes)
              maxDensity = countOfNotes;              
            break;
          }
        }
      }
    }
    
    
    let notesOnKeyboard = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[], 
      [],[],[],[],[], [],[],[],[],[],
    ]
    
    let notesOnKeyboardIdTime = [
      [],[],[],[],[], [],[],[],[],[],
      [],[],[],[],[], [],[],[],[],[], 
      [],[],[],[],[], [],[],[],[],[],
    ]

    let keyboardId = [];

    let keyboardLetters = [
      "q","w","e","r","t", "y","u","i","o","p",
      "a","s","d","f","g", "h","j","k","l",";",
      "z","x","c","v","b", "n","m",",",".","/",
    ]

    const getColumnKeyboard = x => { 
      return keyboardLetters.indexOf(x.key) % 10;
     }

    const getRowKeyboard = x => { 
      return (keyboardLetters.indexOf(x.key) - keyboardLetters.indexOf(x.key) % 10) / 10;
     }
    for (let i = 0; i < idsTimes.length; ++i)
    {
      keyboardId.push([]);
      for (let j = 0; j < idsTimes[i].length; ++j)
      {
        if (idsTimes[i][j] < 0)
        continue;
        if (notes[idsTimes[i][j]] == null)
        {
          //console.log(keyboardIndex);
          console.log(idsTimes[i][j]);
          console.log(notes[idsTimes[i][j]]);
          console.log(scoreData);

        }
        let keyboardIndex = keyboardLetters.indexOf(notes[idsTimes[i][j]].key);
        keyboardId[i].push(keyboardIndex);


        notesOnKeyboard[keyboardIndex].push(notes[idsTimes[i][j]]);
        notesOnKeyboardIdTime[keyboardIndex].push([i, j]);
      }
      
    }

    //console.log(keyboardId);
    //console.log(notesOnKeyboard);
    //console.log(notesOnKeyboardIdTime);

    

    let previousNoteEndTime = 0;
    let previousNoteStartTime = 0;
    let heldNotesEndTimes = [];
    for (let i = 0; i < startTimes.length; ++i)
    {
      let fingerMoveBuff = 1;
      if (i != 0)
      {
        for (let j = 0; j < idsTimes[i].length; ++j)
        {
          if (idsTimes[i][j] < 0)
            continue;
          let noteSingleOutside = notes[idsTimes[i][j]];
          let rowOutside = getRowKeyboard(noteSingleOutside);
          let columnOutside = getColumnKeyboard(noteSingleOutside);
          for (let k = 0; k < idsTimes[i - 1].length; ++k)
          { 
            if (idsTimes[i - 1][k] < 0)
              continue;
            let noteSingleInside = notes[idsTimes[i-1][k]];
            let rowInside = getRowKeyboard(noteSingleInside);
            let columnInside = getColumnKeyboard(noteSingleInside);
            if (rowInside == rowOutside && columnInside != columnOutside)
            {
              fingerMoveBuff+= (getStartTime(noteSingleOutside)-getStartTime(noteSingleInside))/500;
            }
          }
        }
      }

      for (let j = 0; j < heldNotesEndTimes.length; ++j)
      {
        if (heldNotesEndTimes[j] < startTimes[i])
        {
          heldNotesEndTimes.splice(j,1);
          --j;
        }
      }
      let multipleBonus = 1 / (2 * Math.min(timeCount[i],8));
      let heldNoteBonus = 4 * heldNotesEndTimes.length;
      if (heldNoteBonus == 0)
        heldNoteBonus = 1;
      let difference = (startTimes[i] - previousNoteEndTime);
      if (previousNoteEndTime >= startTimes[i])
        difference = (startTimes[i] - previousNoteStartTime);
      //if (heldNoteBonus > 1)
      //{
      //  console.log(heldNoteBonus);
      //  console.log(heldNotesEndTimes.length);
      //  console.log(heldNotesEndTimes);
      //}
      
      
      difference =multipleBonus * heldNoteBonus *  (DISTANCE_SCALE / difference) * ((multipleBonus - 1) / 1.5 + 1);
      
      if (previousNoteEndTime == 0)
        difference = 1;
      //difference += 10 * fingerMoveBuff;
      noteDiffs += difference;
      previousNoteEndTime = endTimes[i];
      previousNoteStartTime = startTimes[i];
      if (endTimes[i] > startTimes[i] && !heldNotesEndTimes.includes(endTimes[i]))
        heldNotesEndTimes.push(endTimes[i]);

      
      
    }   
    let lenBonus = drainTime / 60;
    if (lenBonus > 1)
    {
      lenBonus = Math.sqrt(lenBonus);
    }    

    //let uniqueKeys = new Set(notes.map(x => x.key));

    let hardSectionNerf = (1-(2-(1/(1-(maxDensity / notes.length))))) * 0.1 + 0.90;
    hardSectionNerf = Math.min(hardSectionNerf, 1);
    let density = startTimes.map(x => x.length).reduce((acc, n) => acc + n, 0) / drainTime;
    if (density > 5)
      hardSectionNerf = 1;
    if (notes.length == 0)
      hardSectionNerf = 1;

    let densityBonus =1 + (startTimes.length / drainTime) / 10;
    let core = Math.sqrt(noteDiffs / Math.sqrt(drainTime)) ;
    //let coreDecay = 1 - (Math.max(core / 38, 1) - 1);
    let coreDecayStart = Math.max(core / 4, 60);
    coreDecayStart = 1;
    let coreDecay = Math.pow(1/Math.max(core / coreDecayStart, 1),1.4);
    if (coreDecay == 0)
      coreDecay = 1;
    core = core; //* coreDecay;

    let result = Math.pow(core * STAR_SCALE * densityBonus * hardSectionNerf, 1.35);
    
    
    return result; 
  },

  valerusReworkV2(scoreData)
  {
    const notes = scoreData.notes;
    const typingSections = scoreData.typingSections;
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
      noteDifficulties.push(1000);
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
        timeDurationBonus = OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE)
      let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 1/1.12);

      objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus;
    }
    for (let i = 0; i < typingSectionDifficulties.length; ++i)
    {
      let uniqueLetters = new Set(typingSections[i].text);
      let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
      objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf * 7;
    }
    let objectDensity = TOTALOBJECTS/drainTimeSecond;
    let highObjectDensityPower = Math.pow(objectDensity, 0.54);
    let tooHighObjectCountNerf = Math.pow(Math.min(1/(objectDensity)+(1-1/OBJECTOVERWEIGHTLIMIT),1),highObjectDensityPower);
    let tooShortNerf = 1;
    if (drainTimeSecond < 30)
      tooShortNerf = Math.pow((drainTimeSecond/2 + 15 )/ 30,4);
    let difficultyDensity = objectDifficultySum * tooHighObjectCountNerf * tooShortNerf/ drainTime;
    if (difficultyDensity > 8)
    {
      difficultyDensity =8*Math.pow(difficultyDensity/8,0.4);
    }
    if (difficultyDensity < 2)
    {
      difficultyDensity = difficultyDensity / 2 + 1
    }
    return difficultyDensity;

  },

  /*valerusReworkV2Split(scoreData)
  {
    const notes = scoreData.notes;
    const typingSections = scoreData.typingSections;
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
    let repeatingFactors = [];
    let timeDurationBonuses = [];
    let heldNoteBonuses = [];
    let heldNoteCounts = [];
    for (let i = 0; i < notes.length; ++i)
    {
      if (getStartTime(notes[i]) < minTime)
        minTime = getStartTime(notes[i]);
      if (getEndTime(notes[i]) > maxTime)
        maxTime = getEndTime(notes[i]);
      sortedTimeNotes.push(i);
      noteDifficulties.push(1000);
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
        repeatingFactors.push(Math.pow(Math.min(3/(maxCount+1),1), distanceFactor));
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
        timeDurationBonus = OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE)
      let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 1/1.12);

      timeDurationBonuses.push(timeDurationBonus);
      heldNoteBonuses.push(heldNoteBonus);
      noteDifficulties[selectedNoteIndex] *= timeDurationBonus * heldNoteBonus
      objectDifficultySum += noteDifficulties[selectedNoteIndex];
    }
    let sumOfFactors = [];
    let timeDurationBonusAmounts = [];    
    let timeDurationBonusSum = 0;
    let heldNoteBonusAmounts = [];
    let heldNoteBonusSum = 0;
    let repeatingFactorAmounts = [];
    let repeatingFactorSum = 0;
    for (let i = 0; i < notes.length; ++i)
    {
      if (timeDurationBonuses[i] == null || heldNoteBonuses[i] == null || repeatingFactors[i] == null)
        continue;
      sumOfFactors.push(timeDurationBonuses[i] + heldNoteBonuses[i] + repeatingFactors[i]);

      timeDurationBonusAmounts.push((noteDifficulties[i]/sumOfFactors[i])*timeDurationBonuses[i]);
      timeDurationBonusSum += timeDurationBonusAmounts[i];
      heldNoteBonusAmounts.push((noteDifficulties[i]/sumOfFactors[i])*heldNoteBonuses[i]);
      heldNoteBonusSum += heldNoteBonusAmounts[i];
      repeatingFactorAmounts.push((noteDifficulties[i]/sumOfFactors[i])*repeatingFactors[i]);
      repeatingFactorSum += repeatingFactorAmounts[i];
    }
    let timeDurationBonusPercentage = timeDurationBonusSum / objectDifficultySum;
    let heldNoteBonusPercentage = heldNoteBonusSum / objectDifficultySum;
    let repeatingFactorPercentage = repeatingFactorSum / objectDifficultySum;
    for (let i = 0; i < typingSectionDifficulties.length; ++i)
    {
      let uniqueLetters = new Set(typingSections[i].text);
      let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
      objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf;
    }
    let objectDensity = TOTALOBJECTS/drainTimeSecond;
    let highObjectDensityPower = Math.pow(objectDensity, 0.54);
    let tooHighObjectCountNerf = Math.pow(Math.min(1/(objectDensity)+(1-1/OBJECTOVERWEIGHTLIMIT),1),highObjectDensityPower);
    let tooShortNerf = 1;
    if (drainTimeSecond < 30)
      tooShortNerf = Math.pow((drainTimeSecond/2 + 15 )/ 30,4);
    let difficultyDensity = objectDifficultySum * tooHighObjectCountNerf * tooShortNerf/ drainTime;
    if (difficultyDensity > 8)
    {
      difficultyDensity =8*Math.pow(difficultyDensity/8,0.4);
    }
    if (difficultyDensity < 2)
    {
      difficultyDensity = difficultyDensity / 2 + 1
    }
    return [
      difficultyDensity * timeDurationBonusPercentage,
      difficultyDensity * heldNoteBonusPercentage,
      difficultyDensity * repeatingFactorPercentage];

  }*/
};