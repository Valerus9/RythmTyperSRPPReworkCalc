starFormulas = {
    originalCalculate(scoreData) {
        let convertedNotes = [];
        for (const note of scoreData.notes) {
            if (note.type == "hold") {
                let convertedNote =
                {
                    startTime: note.startTime / 1000,
                    endTime: note.endTime / 1000,
                    type: note.type,
                    key: note.key,
                };
                convertedNotes.push(convertedNote);
            }
            if (note.type == "tap") {
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
    valerusRework(scoreData) {
        let filteredNotes = [];
        for (let i = 0; i < scoreData.notes.length; ++i)
        {
            if (scoreData.notes[i].type == "tap")
            {
                let tempNote = {
                    key: scoreData.notes[i].key,
                    time: scoreData.notes[i].time,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempNote);
            }
            else if(scoreData.notes[i].type == "hold")
            {

                let tempHoldNote = {
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime,
                    endTime: scoreData.notes[i].endTime,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempHoldNote);
            }
        }

        let filteredTypingSections = [];
        for (let i = 0; i < scoreData.typingSections.length; ++i)
        {
            let tempTypingSection = {
                endTime: scoreData.typingSections[i].endTime,
                startTime: scoreData.typingSections[i].startTime,
                text: scoreData.typingSections[i].text,
            }
            filteredTypingSections.push(tempTypingSection);
            
        }
        const notes = filteredNotes;
        const typingSections = filteredTypingSections;
        const KEYBOARDLAYOUT = [
            "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
            "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
            "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
        ];
        const OBJECTTIMEDIFFERENCE = 500;
        const REWARDTIMEDIFFERENCE = OBJECTTIMEDIFFERENCE / 2;
        const getKeyboardRow = x => {
            return (KEYBOARDLAYOUT.indexOf(x.key) - KEYBOARDLAYOUT.indexOf(x.key) % 10) / 10;
        }
        const getKeyboardColumn = x => {
            return KEYBOARDLAYOUT.indexOf(x.key) % 10;
        }
        const getStartTime = x => {
            if (x.type == "tap")
                return x.time;
            return x.startTime;
        }
        const getEndTime = x => {
            if (x.type == "tap")
                return x.time;
            return x.endTime;
        }
        let minTime = Infinity;
        let maxTime = 0;
        let typingSectionDifficulties = [];
        for (let i = 0; i < typingSections.length; ++i) {
            if (typingSections[i].startTime < minTime)
                minTime = typingSections[i].startTime;
            if (typingSections[i].endTime > maxTime)
                maxTime = typingSections[i].endTime;
            typingSectionDifficulties.push(100);
        }
        let sortedTimeNotes = [];
        let noteDifficulties = [];
        let heldNoteCounts = [];
        let alreadyUsedForChord = [];
        let chordBuffForNote = [];
        for (let i = 0; i < notes.length; ++i) {
            if (getStartTime(notes[i]) < minTime)
                minTime = getStartTime(notes[i]);
            if (getEndTime(notes[i]) > maxTime)
                maxTime = getEndTime(notes[i]);
            sortedTimeNotes.push(i);
            alreadyUsedForChord.push(false);
            heldNoteCounts.push(0);
            chordBuffForNote.push(1);
        }

        for (let i = 0; i < sortedTimeNotes.length - 1; ++i) {
            for (let j = i + 1; j < sortedTimeNotes.length; ++j) {
                if (getStartTime(notes[sortedTimeNotes[i]]) > getStartTime(notes[sortedTimeNotes[j]])) {
                    let temp = sortedTimeNotes[i];
                    sortedTimeNotes[i] = sortedTimeNotes[j];
                    sortedTimeNotes[j] = temp;
                }
            }
        }

        const noteFewNerfLimit = 100;
        const noteLotBuffLimit = 1000;
        const noteDefaultDiff = 1000;
        for (let i = 0; i < sortedTimeNotes.length; ++i) {
            if (i <= noteFewNerfLimit)
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteFewNerfLimit, 0.1));
            else if (i >= noteLotBuffLimit)
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteLotBuffLimit, 0.05));
            else
                noteDifficulties.push(noteDefaultDiff);
        }

        const drainTime = Math.max(maxTime - minTime,1000);

        let chords = [];
        for (let i = 0; i < sortedTimeNotes.length - 1; ++i) {
            if (alreadyUsedForChord[i])
                continue;
            alreadyUsedForChord[i] = true;
            let currentNoteTime = getStartTime(notes[sortedTimeNotes[i]]);
            let addedCurrentNote = false;
            for (let j = i + 1; j < sortedTimeNotes.length; ++j) {
                let selectedNoteTime = getStartTime(notes[sortedTimeNotes[j]]);
                if (selectedNoteTime < currentNoteTime + 12) {
                    if (!addedCurrentNote) {
                        chords.push([]);
                        addedCurrentNote = true;
                        chords[chords.length - 1].push(sortedTimeNotes[i]);
                    }
                    chords[chords.length - 1].push(sortedTimeNotes[j]);
                    alreadyUsedForChord[j] = true;
                }
                else
                    break;
            }
        }

        for (let i = 0; i < chords.length; ++i) {
            let columnPlacement = [];
            for (let j = 0; j < 10; ++j) {
                columnPlacement.push([-1, -1, -1]);
            }
            for (let j = 0; j < chords[i].length; ++j) {
                columnPlacement[getKeyboardColumn(notes[chords[i][j]])][getKeyboardRow(notes[chords[i][j]])] = chords[i][j];
            }
            let chordDifficulty = 0.98;
            let lastColumnPos = -1;
            let lastMaxRowPos = -1;
            let lastMinRowPos = Infinity;
            for (let j = 0; j < columnPlacement.length; ++j) {
                let lastRowPos = -1;
                for (let k = 0; k < columnPlacement[j].length; ++k) {
                    if (columnPlacement[j][k] == -1)
                        continue;
                    if (lastRowPos != -1) {
                        if (Math.abs(lastColumnPos - j) == 0) {
                            chordDifficulty += 3.0;
                        }
                    }
                    if (lastMaxRowPos != -1) {
                        if (Math.abs(lastColumnPos - j) <= 3 && (lastMinRowPos != k || lastMaxRowPos != k)) {
                            chordDifficulty += 0.02 * (3 - Math.abs(lastColumnPos - j));
                        }
                    }
                    if (k > lastMaxRowPos)
                        lastMaxRowPos = k;
                    if (k < lastMinRowPos)
                        lastMinRowPos = k;
                    lastColumnPos = j;
                    lastRowPos = k;
                }
            }
            for (let j = 0; j < chords[i].length; ++j) {
                chordBuffForNote[chords[i][j]] = Math.max(chordDifficulty, 1);
                if (chordDifficulty > 9)
                    chordDifficulty = Math.pow(chordDifficulty-8, 0.01)+8;
                noteDifficulties[chords[i][j]] *= Math.max(chordDifficulty, 1);
            }
        }
        let keyboardNotes = [
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
        ];
        let keyboardSortedIds = [
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
        ];
        let sortedKeyboardIds = [];
        for (let i = 0; i < sortedTimeNotes.length; ++i) {
            let selectedNote = notes[sortedTimeNotes[i]];
            let keyboardIndex = KEYBOARDLAYOUT.indexOf(selectedNote.key);
            sortedKeyboardIds.push([keyboardIndex, keyboardNotes.length - 1]);
            keyboardNotes[keyboardIndex].push(selectedNote);
            keyboardSortedIds[keyboardIndex].push(i);
        }

        for (let i = 0; i < keyboardNotes.length; ++i) {
            let stackSize = 1;
            let stackStrength = 0;
            let stackNotes = [];
            let stackNotesIds = [];
            for (let j = keyboardNotes[i].length - 1; j > 0; --j) {
                let laterNote = keyboardNotes[i][j];
                let earlierNote = keyboardNotes[i][j - 1];
                let laterStartTime = getStartTime(laterNote);
                let earlierEndTime = getEndTime(earlierNote);
                let distance = laterStartTime - earlierEndTime;
                if (distance <= 0)
                    continue;
                if (stackStrength == 0 && distance < 250)
                {
                    stackNotes.push(distance);
                    stackNotesIds.push(j);
                    stackStrength = distance;
                    stackSize++;
                }
                else
                {
                    if (250 > distance)
                    {
                        stackNotes.push(Math.max(distance,1));
                        stackNotesIds.push(j);
                        stackSize++;
                    }
                    else
                    {
                        stackNotes.push(distance);
                        stackNotesIds.push(j);
                        for (let k = 0; k < stackNotesIds.length; ++k)
                        {
                            let stackBonus = Math.pow(40 / stackNotes[k] + 1, Math.pow(stackSize, 0.3));
                            if (stackBonus > 3)
                                stackBonus = Math.pow(stackBonus-2,0.01)+2;
                            noteDifficulties[keyboardSortedIds[i][stackNotesIds[k]]] *= stackBonus;                            
                        }
                        stackNotes = [];
                        stackNotesIds = [];
                        stackStrength == 1;
                    }
                }
            }
        }

        for (let i = 0; i < keyboardNotes.length; ++i) {
            for (let j = keyboardNotes[i].length - 1; j > -1; --j) {
                

                let distances = [];
                let distanceCount = [];
                for (let k = j - 1; k > - 1; --k) {
                    let laterNote = keyboardNotes[i][k + 1];
                    let earlierNote = keyboardNotes[i][k];
                    let laterStartTime = getStartTime(laterNote);
                    let earlierEndTime = getEndTime(earlierNote);
                    let distance = laterStartTime - earlierEndTime;
                    if (distance < 0)
                        continue;

                    let containsDistance = false;
                    for (let l = 0; l < distances.length; ++l) {
                        if (distances[l] - 50 < distance && distances[l] + 50 > distance) {
                            distanceCount[l]++;
                            containsDistance = true;
                        }
                    }
                    if (!containsDistance) {
                        distances.push(distance);
                        distanceCount.push(1);
                    }
                }
                let maxCount = 0;
                let maxCountDistance = 0;
                for (let k = 0; k < distances.length; ++k) {
                    if (distanceCount[k] > maxCount) {
                        maxCount = distanceCount[k];
                        maxCountDistance = distances[k];
                    }
                }
                let distanceFactor = Math.min(Math.pow((100 + maxCountDistance / 2) / 200, 1.5), 1);
                noteDifficulties[keyboardSortedIds[i][j]] *= Math.pow(Math.min(3 / (maxCount + 1), 1), distanceFactor);
            }
        }

        const overallDifficulty = Math.min(scoreData.overallDifficulty, 11);
        //let ms = 80 - 6 * overallDifficulty;
        //let od5ms = 80 - 6 * 5;
        //const ODSCALE = 0.03;
        let odnerf = 1 / (Math.pow(Math.max(9 - overallDifficulty, 0), 1.6) / 100 + 1);
        let odbonus = Math.pow(Math.max(overallDifficulty - 7, 0), 1.6) / 100 + 1;
        //let odbonus = ((ODSCALE * (1 / ms)) / (1 / od5ms)) - ODSCALE + 1;
        odbonus = odbonus * odnerf;

        const lengthBonusStart = 60000
        const lengthBonusStrength = 400000;
        let lengthBonus = Math.max(1, (drainTime - lengthBonusStart + lengthBonusStrength) / lengthBonusStrength);
        if (drainTime < lengthBonusStart)
            lengthBonus = Math.pow(drainTime / lengthBonusStart, 1.20) / (drainTime / lengthBonusStart);
        let objectDifficultySum = 0;
        for (let i = 1; i < sortedTimeNotes.length; ++i) {
            let selectedNoteIndex = sortedTimeNotes[i];
            let previousNoteIndex = sortedTimeNotes[i - 1];

            for (let j = i + 1; j < sortedTimeNotes.length; ++j) {
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
                timeDurationBonus = Math.max(OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE),1.3);
            
            let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.80/Math.pow(chordBuffForNote[selectedNoteIndex],2));
            //let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.8);
            timeDurationBonus = Math.max(0.9, timeDurationBonus);
            if(timeDurationBonus> 2)
            {
                timeDurationBonus = Math.pow(timeDurationBonus-1, 0.1)+1;
            }
            let trueODBonus = odbonus;
            if (alreadyUsedForChord[selectedNoteIndex] && overallDifficulty > 9.8)
            {
                trueODBonus = Math.pow(odbonus, 0.4);
            }
            objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus * lengthBonus * trueODBonus;            
        }

        for (let i = 0; i < typingSectionDifficulties.length; ++i) {
            let uniqueLetters = new Set(typingSections[i].text);
            let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
            objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf * 7;
        }
        let difficultyDensity = objectDifficultySum / drainTime;
        if (difficultyDensity > 5)
        {
          difficultyDensity =5*Math.pow(difficultyDensity/5,0.4);
        }
        return difficultyDensity;

    }/*,

    valerusReworkV2(scoreData)
    {
        let filteredNotes = [];
        for (let i = 0; i < scoreData.notes.length; ++i)
        {
            if (scoreData.notes[i].type == "tap")
            {
                let tempNote = {
                    key: scoreData.notes[i].key,
                    time: scoreData.notes[i].time,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempNote);
            }
            else if(scoreData.notes[i].type == "hold")
            {

                let tempHoldNote = {
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime,
                    endTime: scoreData.notes[i].endTime,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempHoldNote);
            }
        }

        let filteredTypingSections = [];
        for (let i = 0; i < scoreData.typingSections.length; ++i)
        {
            let tempTypingSection = {
                endTime: scoreData.typingSections[i].endTime,
                startTime: scoreData.typingSections[i].startTime,
                text: scoreData.typingSections[i].text,                
                type: "typingsection",
            }
            filteredTypingSections.push(tempTypingSection);
            
        }
        const notes = filteredNotes;
        const typingSections = filteredTypingSections;
        const KEYBOARDLAYOUT = [
            "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
            "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
            "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
        ];
        const OBJECTTIMEDIFFERENCE = 500;
        const REWARDTIMEDIFFERENCE = OBJECTTIMEDIFFERENCE / 2;
        const getKeyboardRow = x => {
            return (KEYBOARDLAYOUT.indexOf(x) - KEYBOARDLAYOUT.indexOf(x) % 10) / 10;
        }
        const getKeyboardColumn = x => {
            return KEYBOARDLAYOUT.indexOf(x) % 10;
        }
        const getStartTime = x => {
            if (x.type == "tap")
                return x.time;
            return x.startTime;
        }
        const getEndTime = x => {
            if (x.type == "tap")
                return x.time;
            return x.endTime;
        }
        let minTime = Infinity;
        let maxTime = 0;
        for (let i = 0; i < typingSections.length; ++i) {
            if (typingSections[i].startTime < minTime)
                minTime = typingSections[i].startTime;
            if (typingSections[i].endTime > maxTime)
                maxTime = typingSections[i].endTime;
        }
        for (let i = 0; i < typingSections.length - 1; ++i) {
            for (let j = i + 1; j < typingSections.length; ++j) {
                if (getStartTime(typingSections[i]) > getStartTime(typingSections[j])) {
                    let temp = {
                        type: typingSections[i].type,
                        startTime: typingSections[i].startTime,
                        endTime: typingSections[i].endTime,
                        text: typingSections[i].text,
                    }
                    typingSections[i].type = typingSections[j].type;
                    typingSections[i].startTime = typingSections[j].startTime;
                    typingSections[i].endTime = typingSections[j].endTime;
                    typingSections[i].text = typingSections[j].text;
                    
                    typingSections[j].type = temp.type;
                    typingSections[j].startTime = temp.startTime;
                    typingSections[j].endTime = temp.endTime;
                    typingSections[j].text = temp.text;
                }
            }
        }
        for (let i = 0; i < notes.length; ++i) {
            if (getStartTime(notes[i]) < minTime)
                minTime = getStartTime(notes[i]);
            if (getEndTime(notes[i]) > maxTime)
                maxTime = getEndTime(notes[i]);
        }

        
        let convertedNoteObjects = [];
        for (let i = 0; i < notes.length; ++i)
        {
            if (notes[i].type == "tap")
            {
                tempTap = {
                    type: "tap",
                    startTime: getStartTime(notes[i]),
                    endTime: getEndTime(notes[i]),
                    keyPosition:
                    {
                        row: getKeyboardRow(notes[i].key),
                        column: getKeyboardColumn(notes[i].key),
                    }
                }
                convertedNoteObjects.push(tempTap);
            }
            else if(notes[i].type == "hold")
            {
                tempHoldStart = {
                    type: "hold",
                    startTime: getStartTime(notes[i]),
                    endTime: getStartTime(notes[i]),
                    keyPosition:
                    {
                        row: getKeyboardRow(notes[i].key),
                        column: getKeyboardColumn(notes[i].key),
                    }
                }
                convertedNoteObjects.push(tempHoldStart);

                tempHoldBody = {
                    type: "anchor",
                    startTime: getStartTime(notes[i]),
                    endTime: getEndTime(notes[i]),
                    keyPosition:
                    {
                        row: getKeyboardRow(notes[i].key),
                        column: getKeyboardColumn(notes[i].key),
                    }
                }
                convertedNoteObjects.push(tempHoldBody);

                tempRelease = {
                    type: "release",
                    startTime: getEndTime(notes[i]),
                    endTime: getEndTime(notes[i]),
                    keyPosition:
                    {
                        row: getKeyboardRow(notes[i].key),
                        column: getKeyboardColumn(notes[i].key),
                    }
                }
                convertedNoteObjects.push(tempRelease);
            }
        }

        for (let i = 0; i < convertedNoteObjects.length - 1; ++i) {
            for (let j = i + 1; j < convertedNoteObjects.length; ++j) {
                if (convertedNoteObjects[i].startTime > convertedNoteObjects[j].startTime 
                    || (convertedNoteObjects[i].startTime == convertedNoteObjects[j].startTime 
                    && convertedNoteObjects[i].type == "anchor")) {
                    let temp = {
                        type: convertedNoteObjects[i].type,
                        startTime: convertedNoteObjects[i].startTime,
                        endTime: convertedNoteObjects[i].endTime,
                        keyPosition:
                        {
                            row: convertedNoteObjects[i].keyPosition.row,
                            column: convertedNoteObjects[i].keyPosition.column,
                        }
                    };
                    convertedNoteObjects[i].type = convertedNoteObjects[j].type
                    convertedNoteObjects[i].startTime = convertedNoteObjects[j].startTime
                    convertedNoteObjects[i].endTime = convertedNoteObjects[j].endTime
                    convertedNoteObjects[i].keyPosition.row = convertedNoteObjects[j].keyPosition.row
                    convertedNoteObjects[i].keyPosition.column = convertedNoteObjects[j].keyPosition.column
                    
                    convertedNoteObjects[j].type = temp.type
                    convertedNoteObjects[j].startTime = temp.startTime
                    convertedNoteObjects[j].endTime = temp.endTime
                    convertedNoteObjects[j].keyPosition.row = temp.keyPosition.row
                    convertedNoteObjects[j].keyPosition.column = temp.keyPosition.column
                }
            }
        }

        let mergedNoteObjects = [];
        let merger = 0;
        for (let convertedIndexer = 1; convertedIndexer <convertedNoteObjects.length; ++convertedIndexer)
        {
            if (convertedNoteObjects[convertedIndexer].type == "anchor")
            {    
                if (convertedIndexer - merger > 1)
                {
                    let tempMergedNoteObject = {
                        type: "",
                        keyPositions: [],
                        keyTypes: [],
                        startTime: convertedNoteObjects[merger].startTime,
                        endTime: convertedNoteObjects[merger].endTime,
                    }           
                    for (let mergeIndexer = merger; mergeIndexer < convertedIndexer; ++mergeIndexer)
                    {
                        if (tempMergedNoteObject.type == "")
                        {
                            tempMergedNoteObject.type = convertedNoteObjects[mergeIndexer].type + "chord";
                        }
                        else if (!tempMergedNoteObject.type.includes(convertedNoteObjects[mergeIndexer].type))
                        {
                            tempMergedNoteObject.type = "mixedchord";
                        }
                        let tempKeyPosition = 
                        {
                            row: convertedNoteObjects[mergeIndexer].keyPosition.row,
                            column: convertedNoteObjects[mergeIndexer].keyPosition.column,
                        }
                        tempMergedNoteObject.keyPositions.push(tempKeyPosition);
                        tempMergedNoteObject.keyTypes.push(convertedNoteObjects[mergeIndexer].type);
                    }
                    mergedNoteObjects.push(tempMergedNoteObject);
                } 
                else
                {
                    mergedNoteObjects.push(convertedNoteObjects[merger]);
                }
                mergedNoteObjects.push(convertedNoteObjects[convertedIndexer]);
                merger = convertedIndexer+1;
                convertedIndexer+=1;
                continue;
            }
            if (convertedNoteObjects[merger].startTime != convertedNoteObjects[convertedIndexer].startTime)
            {  
                if (convertedIndexer - merger > 1)
                {
                    let tempMergedNoteObject = {
                        type: "",
                        keyPositions: [],
                        keyTypes: [],
                        startTime: convertedNoteObjects[merger].startTime,
                        endTime: convertedNoteObjects[merger].endTime,
                    }           
                    for (let mergeIndexer = merger; mergeIndexer < convertedIndexer; ++mergeIndexer)
                    {
                        if (tempMergedNoteObject.type == "")
                        {
                            tempMergedNoteObject.type = convertedNoteObjects[mergeIndexer].type + "chord";
                        }
                        else if (!tempMergedNoteObject.type.includes(convertedNoteObjects[mergeIndexer].type))
                        {
                            tempMergedNoteObject.type = "mixedchord";
                        }
                        let tempKeyPosition = 
                        {
                            row: convertedNoteObjects[mergeIndexer].keyPosition.row,
                            column: convertedNoteObjects[mergeIndexer].keyPosition.column,
                        }
                        tempMergedNoteObject.keyPositions.push(tempKeyPosition);
                        tempMergedNoteObject.keyTypes.push(convertedNoteObjects[mergeIndexer].type);
                    }
                    mergedNoteObjects.push(tempMergedNoteObject);
                } 
                else
                {
                    mergedNoteObjects.push(convertedNoteObjects[merger]);
                }
                merger = convertedIndexer;
            }
        }
        if (merger < convertedNoteObjects.length)
        {
            if (convertedNoteObjects.length - merger > 1)
            {
                let tempMergedNoteObject = {
                    type: "",
                    keyPositions: [],
                    keyTypes: [],
                    startTime: convertedNoteObjects[merger].startTime,
                    endTime: convertedNoteObjects[merger].endTime,
                }           
                for (let mergeIndexer = merger; mergeIndexer < convertedNoteObjects.length; ++mergeIndexer)
                {
                    if (tempMergedNoteObject.type == "")
                    {
                        tempMergedNoteObject.type = convertedNoteObjects[mergeIndexer].type + "chord";
                    }
                    else if (!tempMergedNoteObject.type.includes(convertedNoteObjects[mergeIndexer].type))
                    {
                        tempMergedNoteObject.type = "mixedchord";
                    }
                    let tempKeyPosition = 
                    {
                        row: convertedNoteObjects[mergeIndexer].keyPosition.row,
                        column: convertedNoteObjects[mergeIndexer].keyPosition.column,
                    }
                    tempMergedNoteObject.keyPositions.push(tempKeyPosition);
                    tempMergedNoteObject.keyTypes.push(convertedNoteObjects[mergeIndexer].type);
                }
                mergedNoteObjects.push(tempMergedNoteObject);
            } 
            else
            {
                mergedNoteObjects.push(convertedNoteObjects[merger]);
            }
        }
        const createDifficultyObjectFromTS = (x) => {
            let selectedTypingSection = x;
            let tempDifficultyObject = {
                type: "typingsection",
                startTime: selectedTypingSection.startTime,
                endTime: selectedTypingSection.endTime,
                textUniqueKeys: [],
                textKeysPositions: [],
            }
            for (let textIndexer = 0; textIndexer < selectedTypingSection.text.length; ++textIndexer)
            {   
                let tempKeyPosition=
                {
                    row: getKeyboardRow(selectedTypingSection.text[textIndexer]),
                    column: getKeyboardColumn(selectedTypingSection.text[textIndexer]),
                }
                if (!tempDifficultyObject.textUniqueKeys.includes(selectedTypingSection.text[textIndexer]))
                {
                    tempDifficultyObject.textUniqueKeys.push(selectedTypingSection.text[textIndexer]);
                }

                tempDifficultyObject.textKeysPositions.push(tempKeyPosition);
            }
            return tempDifficultyObject;
        }

        let noteWhileIndexer = 0;
        let typingSectionWhileIndexer = 0;
        let difficultyObjects = [];
        while (noteWhileIndexer < mergedNoteObjects.length || typingSectionWhileIndexer < typingSections.length)
        {
            if (typingSections.length > typingSectionWhileIndexer && mergedNoteObjects.length > noteWhileIndexer)
            {

                if (mergedNoteObjects[noteWhileIndexer].startTime < typingSections[typingSectionWhileIndexer].startTime)
                {
                    difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                    noteWhileIndexer++;
                }
                else if (mergedNoteObjects[noteWhileIndexer].startTime > typingSections[typingSectionWhileIndexer].startTime)
                {
                    let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                    selectedTypingSection.type = "typingsection";
                    difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                    typingSectionWhileIndexer++;
                }
                else
                {
                    difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                    let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                    selectedTypingSection.type = "typingsection";
                    difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                    typingSectionWhileIndexer++;
                    noteWhileIndexer++;
                }

            }
            else if (typingSections.length <= typingSectionWhileIndexer && notes.length > noteWhileIndexer)
            {                
                difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                noteWhileIndexer++;
            }
            else if (typingSections.length > typingSectionWhileIndexer && notes.length <= noteWhileIndexer)
            {
                let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                selectedTypingSection.type = "typingsection";
                difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                typingSectionWhileIndexer++;
            }
            else if (typingSections.length == 0 && notes.length > noteWhileIndexer)
            {                
                difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                noteWhileIndexer++;
            }
            else if (typingSections.length > typingSectionWhileIndexer && notes.length == 0)
            {
                let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                selectedTypingSection.type = "typingsection";
                difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                typingSectionWhileIndexer++;
            }
            else
                break;
        }
        const getDuration = (x) => {
            return x.endTime - x.startTime;
        }
        let difficultySum = 0;
        for (let difficultyIndexer = 0; difficultyIndexer < difficultyObjects.length; ++difficultyIndexer)
        {

        }
        return difficultyObjects.length;
    }*/
};