starFormulas = {
  originalCalculate(scoreData) {
    const notes = scoreData.notes;
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
    let core = Math.sqrt(noteDiffs / Math.sqrt(drainTime));
    //let coreDecay = 1 - (Math.max(core / 38, 1) - 1);
    let coreDecay = Math.pow(1/Math.max(core / 38, 1),1.2);
    if (coreDecay == 0)
      coreDecay = 1;
    core = core * coreDecay;
    let result = Math.pow(core * STAR_SCALE * densityBonus, 1.34);
    return result; 
  },
};