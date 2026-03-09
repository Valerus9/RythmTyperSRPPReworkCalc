ppstarFormulaBuildUps = {
    originalCalculateSrBuildup(scoreData) {
        let noteBaseValuesForBuildUp = [];
        let noteStartTimesForBuildUp = [];
        let noteMultiplierNames = ["noteAmountNerfBuff", "chordBuff", "stackBuff", "distanceFactor", "timeDurationBonus", "heldNoteBonus", "lengthBonus", "odbonus"];
        let noteMultiplierValues = [];
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = ["letterLackNerf"];
        let typingSectionMultiplierValues = [];

        for (let i = 0; i < noteMultiplierNames.length; ++i)
        {
            noteMultiplierValues.push([]);
        }

        for (let i = 0; i < typingSectionMultiplierNames.length; ++i)
        {
            typingSectionMultiplierValues.push([]);
        }

        let filteredNotes = [];
        for (let i = 0; i < scoreData.notes.length; ++i)
        {
            if (scoreData.notes[i].type == "tap")
            {
                let tempNote = {
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime * 1000,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempNote);
            }
            else if(scoreData.notes[i].type == "hold")
            {

                let tempHoldNote = {
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime * 1000,
                    endTime: scoreData.notes[i].endTime * 1000,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempHoldNote);
            }
        }
        let filteredTypingSections = [];
        for (let i = 0; i < (scoreData.typingSections || []).length; ++i)
        {
            let tempTypingSection = {
                endTime: scoreData.typingSections[i].endTime * 1000,
                startTime: scoreData.typingSections[i].startTime * 1000,
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
        const getStartTime = x => x.startTime;
        const getEndTime = x => x.endTime || x.startTime;
        let minTime = Infinity;
        let maxTime = 0;
        let typingSectionDifficulties = [];
        for (let i = 0; i < typingSections.length; ++i) {
            if (typingSections[i].startTime < minTime)
                minTime = typingSections[i].startTime;
            if (typingSections[i].endTime > maxTime)
                maxTime = typingSections[i].endTime;
            typingSectionDifficulties.push(100);
            typingSectionBaseValuesForBuildUp.push(100);
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
        for (let i = 0; i < sortedTimeNotes.length; ++i)
        {
            noteStartTimesForBuildUp.push(getStartTime(notes[sortedTimeNotes[i]]));
        }
        const noteFewNerfLimit = 100;
        const noteLotBuffLimit = 1000;
        const noteDefaultDiff = 1000;
        for (let i = 0; i < sortedTimeNotes.length; ++i) {
            if (i <= noteFewNerfLimit)
            {
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteFewNerfLimit, 0.1));
                noteMultiplierValues[0].push(Math.pow((i + 1) / noteFewNerfLimit, 0.1));
            }   
            else if (i >= noteLotBuffLimit)
            {
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteLotBuffLimit, 0.05));
                noteMultiplierValues[0].push(Math.pow((i + 1) / noteLotBuffLimit, 0.05));
            }
            else
            {
                noteDifficulties.push(noteDefaultDiff);
                noteMultiplierValues[0].push(1);
            }
            noteBaseValuesForBuildUp.push(noteDefaultDiff);
            for (let j = 1; j < noteMultiplierValues.length; ++j)
            {
                noteMultiplierValues[j].push(1);
            }
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
                noteMultiplierValues[1][chords[i][j]] = Math.max(chordDifficulty, 1);
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
                            noteMultiplierValues[2][keyboardSortedIds[i][stackNotesIds[k]]] = stackBonus;
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
                noteMultiplierValues[3][keyboardSortedIds[i][j]] = Math.pow(Math.min(3 / (maxCount + 1), 1), distanceFactor);
            }
        }

        const overallDifficulty = scoreData.overallDifficulty;
        //let ms = 80 - 6 * Math.min(overallDifficulty, 11);
        //let odnms = 80 - 6 * 7;
        //const ODSCALE = 0.03;
        let odnerf = 1 / (Math.pow(Math.max(9 - overallDifficulty, 0), 1.6) / 100 + 1);
        let odbonus = Math.pow(Math.max(overallDifficulty - 7, 0), 1.6) / 100 + 1
        //let odbonus = ((ODSCALE * (1 / ms)) / (1 / odnms)) - ODSCALE + 1;
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
            let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.52/Math.pow(chordBuffForNote[selectedNoteIndex],2));
            //let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.8);
            timeDurationBonus = Math.max(0.9, timeDurationBonus);
            if(timeDurationBonus> 2)
            {
                timeDurationBonus = Math.pow(timeDurationBonus-1, 0.1)+1;
            }
            //"timeDurationBonus", "heldNoteBonus", "lengthBonus", "odbonus"
            let trueODBonus = odbonus;
            if (alreadyUsedForChord[selectedNoteIndex] && overallDifficulty > 9.8)
            {
                trueODBonus = Math.pow(odbonus, 0.4);
            }
            noteMultiplierValues[4][selectedNoteIndex] = timeDurationBonus;
            noteMultiplierValues[5][selectedNoteIndex] = heldNoteBonus;
            noteMultiplierValues[6][selectedNoteIndex] = lengthBonus;
            noteMultiplierValues[7][selectedNoteIndex] = trueODBonus;
            objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus * lengthBonus * trueODBonus;
        }
        for (let i = 0; i < typingSectionDifficulties.length; ++i) {
            let uniqueLetters = new Set(typingSections[i].text);
            let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
            objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf * 7;
            typingSectionMultiplierValues[0].push(letterLackNerf);
        }
        let difficultyDensity = objectDifficultySum / drainTime;
        if (difficultyDensity > 8)
        {
          difficultyDensity =8*Math.pow(difficultyDensity/8,0.4);
        }
        let notecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204], [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        return [noteStartTimesForBuildUp, noteBaseValuesForBuildUp, noteMultiplierNames, noteMultiplierValues, notecolors, typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames, typingSectionMultiplierValues];

    },
    valerusReworkV2SrBuildup(scoreData)
    {
        
            let filteredNotes = [];
            for (let i = 0; i < scoreData.notes.length; ++i)
            {
                if (scoreData.notes[i].type == "tap")
                {
                    let tempNote = {
                        key: scoreData.notes[i].key,
                        startTime: scoreData.notes[i].time * 1000,
                        type: scoreData.notes[i].type,
                    }
                    filteredNotes.push(tempNote);
                }
                else if(scoreData.notes[i].type == "hold")
                {
    
                    let tempHoldNote = {
                        key: scoreData.notes[i].key,
                        startTime: scoreData.notes[i].startTime * 1000,
                        endTime: scoreData.notes[i].endTime * 1000,
                        type: scoreData.notes[i].type,
                    }
                    filteredNotes.push(tempHoldNote);
                }
            }
    
            let filteredTypingSections = [];
            for (let i = 0; i < (scoreData.typingSections || []).length; ++i)
            {
                let tempTypingSection = {
                    endTime: scoreData.typingSections[i].endTime * 1000,
                    startTime: scoreData.typingSections[i].startTime * 1000,
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
            const getKeyboardLowerCase = x => {
                if (x =="<")
                    return ",";
                if (x ==">")
                    return ".";
                if (x=="?")
                    return "/";
                if (x==":")
                    return ";";
                return String(x).toLowerCase();
            }
    
            const getKeyboardRow = x => {
                return (KEYBOARDLAYOUT.indexOf(getKeyboardLowerCase(x)) - KEYBOARDLAYOUT.indexOf(getKeyboardLowerCase(x)) % 10) / 10;
            }
            const getKeyboardColumn = x => {
                return KEYBOARDLAYOUT.indexOf(getKeyboardLowerCase(x)) % 10;
            }
            const getStartTime = x => x.startTime;
            const getEndTime = x => x.endTime || x.startTime;
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
                    if (tempTap.keyPosition.column == -1)
                        continue;
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
                    if (tempHoldStart.keyPosition.column == -1)
                        continue;
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
                    if (tempKeyPosition.column == -1)
                        continue;
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
            const drainTime = Math.max(maxTime - minTime, 1000);
    
            const overallDifficulty = Math.min(scoreData.overallDifficulty, 11);
            const odnerf = 1 / (Math.pow(Math.max(9 - overallDifficulty, 0), 1.6) / 100 + 1);
            const odbonus = Math.pow(Math.max(overallDifficulty - 7, 0), 1.6) / 100 + 1;
            const odFactor = odbonus * odnerf;
    
            
            const calculateDistance= (x1,y1,x2,y2)=>{
                return Math.sqrt(Math.pow(Math.abs(x1-x2),2)+Math.pow(Math.abs(y1-y2),2));
            }
            const distanceBetweenObjects = (difficultyObject1, difficultyObject2) => {
                let vectorDistance = distanceBetweenObjectsVector(difficultyObject1, difficultyObject2);
                return Math.sqrt(Math.pow(vectorDistance.x,2) + Math.pow(vectorDistance.y,2));
            }
            const distanceBetweenObjectsVector = (difficultyObject1, difficultyObject2) => {
                let distance = 1;
                let vector = {
                    x: 1,
                    y: 1
                }
    
                if (!difficultyObject1.type.includes("chord") && !difficultyObject2.type.includes("chord"))
                {                 
                    let x1 = difficultyObject1.keyPosition.row;
                    let x2 = difficultyObject2.keyPosition.row;
                    let y1 = difficultyObject1.keyPosition.column;
                    let y2 = difficultyObject2.keyPosition.column;
                    vector.x = x1-x2;
                    vector.y = y1-y2;
                }
                else if (!difficultyObject1.type.includes("chord") && difficultyObject2.type.includes("chord"))
                {
                    let minDistance = Infinity;
                    for (let i = 0; i < difficultyObject2.keyPositions.length; ++i)
                    {
                        let x1 = difficultyObject1.keyPosition.row;
                        let x2 = difficultyObject2.keyPositions[i].row;
                        let y1 = difficultyObject1.keyPosition.column;
                        let y2 = difficultyObject2.keyPositions[i].column;
                        distance = calculateDistance(x1, x2, y1, y2);
                        if (minDistance > distance)
                        {
                            minDistance = distance;
                            vector.x = x1-x2;
                            vector.y = y1-y2;
                        }                        
                    }
                }
                else if (difficultyObject1.type.includes("chord") && !difficultyObject2.type.includes("chord"))
                {
                    let minDistance = Infinity;
                    for (let i = 0; i < difficultyObject1.keyPositions.length; ++i)
                    {
                        let x1 = difficultyObject2.keyPosition.row;
                        let x2 = difficultyObject1.keyPositions[i].row;
                        let y1 = difficultyObject2.keyPosition.column;
                        let y2 = difficultyObject1.keyPositions[i].column;
                        distance = calculateDistance(x1, x2, y1, y2);
                        if (minDistance > distance)
                        {
                            minDistance = distance;
                            vector.x = x1-x2;
                            vector.y = y1-y2;
                        }
                            
                    }
                }
                else
                {
                    let minDistance = Infinity;
                    for (let i = 0; i < difficultyObject1.keyPositions.length; ++i)
                    {
                        for (let j = 0; j < difficultyObject2.keyPositions.length; ++j)
                        {
                            let x1 = difficultyObject2.keyPositions[j].row;
                            let x2 = difficultyObject1.keyPositions[i].row;
                            let y1 = difficultyObject2.keyPositions[j].column;
                            let y2 = difficultyObject1.keyPositions[i].column;
                            distance = calculateDistance(x1, x2, y1, y2);
                            if (minDistance > distance)
                            {
                                minDistance = distance;
                                vector.x = x1-x2;
                                vector.y = y1-y2;
                            }
                        }
                    }
                }
                return vector;
            }
            const distanceBetweenPositionsVector = (position1, position2) => {
                let vector = {
                    x: 1,
                    y: 1
                }
    
                let x1 = position1.row;
                let x2 = position2.row;
                let y1 = position1.column;
                let y2 = position2.column;
                vector.x = x1-x2;
                vector.y = y1-y2;
    
                return vector;
            }
            let keyPositionMatrix = [
                [], [], [], [], [],  [], [], [], [], [], 
                [], [], [], [], [],  [], [], [], [], [],
                [], [], [], [], [],  [], [], [], [], [],
            ];
            let layerAlreadyUsed = [];
            let repeatedPatternNerf = [];
            for (let i = 0; i < difficultyObjects.length; ++i)
            {
                for (let j = 0; j < keyPositionMatrix.length; ++j)
                {
                    repeatedPatternNerf.push(1);
                    layerAlreadyUsed.push(false);
                    keyPositionMatrix[j].push(-1);
                }
                let lastLayer = keyPositionMatrix[0].length - 1;
                if (difficultyObjects[i].type.includes("chord"))
                {
                    for (let j = 0; j < difficultyObjects[i].keyPositions.length; ++j)
                    {
                        let row = difficultyObjects[i].keyPositions[j].row;
                        let column = difficultyObjects[i].keyPositions[j].column;
                        keyPositionMatrix[row * 10 + column][lastLayer] = difficultyObjects[i].startTime;
                    }
                }
                else if (difficultyObjects[i].type != "typingsection" && difficultyObjects[i].type != "anchor")
                {
                    let row = difficultyObjects[i].keyPosition.row;
                    let column = difficultyObjects[i].keyPosition.column;
                    keyPositionMatrix[row * 10 + column][lastLayer] = difficultyObjects[i].startTime;
                }
            }
    
            const matrixLayerContainsKey = (matrix, layer)=>{
                for (let j = 0; j < matrix.length; ++j)
                {
                    if (matrix[j][layer] != -1)
                    {
                        return true;
                    }
                }
                return false;
            };
            const matrixLayerGetKeyValue = (matrix, layer)=>{
                for (let j = 0; j < matrix.length; ++j)
                {
                    if (matrix[j][layer] != -1)
                    {
                        return matrix[j][layer];
                    }
                }
                return -1;
            };
            const matrixLayerGetKeyPosition = (matrix, layer)=>{
                for (let j = 0; j < matrix.length; ++j)
                {
                    if (matrix[j][layer] != -1)
                    {
                        let tempVector = {
                            column: j % 10,
                            row: (j - j%10) /10
                        }
                        return tempVector;
                    }
                }
                return { column: -1, row: -1};
            };
    
            for (let i = 0; i < keyPositionMatrix[0].length; ++i)
            {
                if (!matrixLayerContainsKey(keyPositionMatrix, i))
                    continue;
                if (layerAlreadyUsed[i])
                    continue;
                let selectedKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, i);
                let selectedKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, i);
                let couldntExtendPatterns = false;
                let patternLength = 2;
                let candidates = [];
                let candidatesFailed = [];
                let offsets = [];            
                let offsetsPositions = [];
                let offsetsTypes = [];
                let offsetsValues = [];
                let offsetsValuesTimes = [];
                let offsetsIds = [];
                offsets.push(selectedKeyPosition);
                offsetsPositions.push(selectedKeyPosition);
                offsetsIds.push(i);
                offsetsValues.push(selectedKeyValue);
                offsetsValuesTimes.push(selectedKeyValue);
                offsetsTypes.push(difficultyObjects[i].type);
                while (!couldntExtendPatterns)
                {
                    let previousKeyValue = offsetsValuesTimes[offsets.length - 1];
                    let previousKeyPosition = offsetsPositions[offsetsPositions.length - 1];
                    for (let j = offsetsIds[offsetsIds.length - 1] + 1; offsets.length < patternLength && j < keyPositionMatrix[0].length; ++j)
                    {
                        if (!matrixLayerContainsKey(keyPositionMatrix, j))
                            continue;
                        if (layerAlreadyUsed[j])
                            continue;
                        let nextKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, j);
                        let nextKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, j);
                        if (distanceBetweenPositionsVector(previousKeyPosition, nextKeyPosition) > 3)
                            continue;
                        offsets.push(distanceBetweenPositionsVector(previousKeyPosition, nextKeyPosition));
                        offsetsPositions.push(nextKeyPosition);
                        offsetsValues.push(nextKeyValue - previousKeyValue);
                        offsetsValuesTimes.push(nextKeyValue);
                        offsetsTypes.push(difficultyObjects[j].type);
                        offsetsIds.push(j);
                    }
                    if (candidates.length == 0)
                    {
                        for (let j = offsetsIds[offsetsIds.length - 1] + 1; j < keyPositionMatrix[0].length; ++j)
                        {
                            if (!matrixLayerContainsKey(keyPositionMatrix, j))
                                continue;
                            if (layerAlreadyUsed[j])
                                continue;
                            
                            let candidateKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, j);
                            let candidateKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, j);
                            if (difficultyObjects[j].type != offsetsTypes[0])
                                continue;
                            let tempCandidateData = {
                                offsets: [],
                                offsetsPositions: [],
                                offsetsIds: [],
                                offsetsValues: [],
                                offsetsValuesTimes: [],
                                offsetsTypes: [],
                            }
                            tempCandidateData.offsets.push(candidateKeyPosition);
                            tempCandidateData.offsetsPositions.push(candidateKeyPosition);
                            tempCandidateData.offsetsIds.push(j);
                            tempCandidateData.offsetsValues.push(candidateKeyValue);
                            tempCandidateData.offsetsValuesTimes.push(candidateKeyValue);
                            tempCandidateData.offsetsTypes.push(difficultyObjects[j].type);
                            candidates.push(tempCandidateData);
                            candidatesFailed.push(false);
                        }
                    }
                    for (let j = 0; j <candidates.length && candidates.length > 1; ++j)
                    {
                        if (candidates[j].offsetsIds[0] > offsetsIds[0] && candidates[j].offsetsIds[0] <= offsetsIds[offsetsIds.length - 1])
                        {
                            candidates.splice(j, 1);
                            candidatesFailed.splice(j, 1);
                            --j;
                        }
                    }
                    for (let j = 0; j < candidates.length; ++j)
                    {
                        let candidateStartPosition = candidates[j].offsetsIds[candidates[j].offsetsIds.length - 1] + 1;
                        let candidatePreviousKeyPosition = candidates[j].offsetsPositions[candidates[j].offsetsPositions.length - 1];
                        let candidatePreviousKeyValue = candidates[j].offsetsValuesTimes[candidates[j].offsetsValuesTimes.length - 1]
                        for (let k = candidateStartPosition; k < keyPositionMatrix[0].length && candidates[j].offsets.length < patternLength; ++k)
                        {
                            if (!matrixLayerContainsKey(keyPositionMatrix, k))
                                continue;
                            if (layerAlreadyUsed[k])
                                continue;
                            let nextKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, k);
                            let nextKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, k);
                            if (distanceBetweenPositionsVector(candidatePreviousKeyPosition, nextKeyPosition) > 3)
                                continue;
                            candidates[j].offsets.push(distanceBetweenPositionsVector(candidatePreviousKeyPosition, nextKeyPosition));
                            candidates[j].offsetsPositions.push(nextKeyPosition);
                            candidates[j].offsetsValues.push(nextKeyValue - candidatePreviousKeyValue);
                            candidates[j].offsetsValuesTimes.push(nextKeyValue);
                            candidates[j].offsetsTypes.push(difficultyObjects[k].type);
                            candidates[j].offsetsIds.push(k);
                        }
                        if (candidates[j].offsets.length < patternLength)
                        {
                            candidatesFailed[j] = true;
                        }
                    }
                    let thereIsNotFailedCandidate = false;
                    for (let j = 0; j < candidates.length; ++j)
                    {
                        if (candidatesFailed[j])
                            continue;
                        for (let k = 0; k < patternLength; ++k)
                        {
                            if (k == 0)
                            {
                                if (candidates[j].offsetsTypes[k] != offsetsTypes[k])
                                {
                                    candidatesFailed[j] = true;
                                    break;
                                }
                                continue;
                            }
                            if (candidates[j].offsets[k].x != offsets[k].x || candidates[j].offsets[k].y != offsets[k].y 
                                || candidates[j].offsetsValues[k] > offsetsValues[k] + 5 || candidates[j].offsetsValues[k] < offsetsValues[k] - 5
                                || candidates[j].offsetsTypes[k] != offsetsTypes[k])
                            {
                                candidatesFailed[j] = true;
                                break;
                            }
                        }
                        if (!candidatesFailed[j])
                            thereIsNotFailedCandidate = true;
                    }
                    if (thereIsNotFailedCandidate)
                    {
                        for (let j = 0; j < candidates.length; ++j)
                        {
                            if (!candidatesFailed[j])
                                continue;
                            candidatesFailed.splice(j, 1);
                            candidates.splice(j, 1);
                            --j;
                        }
                        patternLength++;
                    }
                    else
                    {
                        couldntExtendPatterns = true;
                        for (let j = 0; j < candidates.length; ++j)
                        {
                            let lastOne = candidates[j].offsets.length -1;
                            candidates[j].offsets.splice(lastOne, 1);
                            candidates[j].offsetsPositions.splice(lastOne, 1);
                            candidates[j].offsetsTypes.splice(lastOne, 1);
                            candidates[j].offsetsValues.splice(lastOne, 1);
                            candidates[j].offsetsValuesTimes.splice(lastOne, 1);
                            candidates[j].offsetsIds.splice(lastOne, 1);
                        }
                        let testedLastOne = offsets.length -1;
                        offsets.splice(testedLastOne, 1);
                        offsetsPositions.splice(testedLastOne, 1);
                        offsetsTypes.splice(testedLastOne, 1);
                        offsetsValues.splice(testedLastOne, 1);
                        offsetsValuesTimes.splice(testedLastOne, 1);
                        offsetsIds.splice(testedLastOne, 1);
                        patternLength--;
                        break;
                    }
                }
                if (candidates.length == 0)
                    continue;
                if (patternLength - 1 > 2)
                {
                    for (let j = 0; j < candidates.length; ++j)
                    {
                        for (let k = 0; k < candidates[j].offsets.length; ++k)
                        {
                            layerAlreadyUsed[candidates[j].offsetsIds[k]] = true;
                        }
                    }
                    let appliedRepeatedPatternNerf =Math.min(Math.pow(1 / Math.pow(candidates.length, 0.5), Math.max(patternLength-2,1)),1);
                    for (let j = 0; j < candidates.length; ++j)
                    {
                        for (let k = 0; k <candidates[j].offsets.length; ++k)
                        {
                            repeatedPatternNerf[candidates[j].offsetsIds[k]] = appliedRepeatedPatternNerf;
                        }
                    }
                }
                
                
            }
            //console.log(testMatrixConsoleList);
                
            let lastNonTypingSectionIndex = -1;
    
            let difficultyObjectOffsets = [];
            for (let difficultyIndexer = 0; difficultyIndexer < difficultyObjects.length; ++difficultyIndexer)
            {
                let selectedObject = difficultyObjects[difficultyIndexer];
                if (difficultyIndexer == 0)
                {
                    difficultyObjectOffsets.push(Infinity);
                    continue;
                }
                if (selectedObject.type == "typingsection")
                {
                    difficultyObjectOffsets.push(Infinity);
                    continue;
                }
                if (lastNonTypingSectionIndex != -1)
                {
                    let previousObject = difficultyObjects[lastNonTypingSectionIndex];
                    difficultyObjectOffsets.push(distanceBetweenObjectsVector(selectedObject, previousObject));
                }
                
                lastNonTypingSectionIndex = difficultyIndexer;
            }
            //console.log(difficultyObjectOffsets);
    
            
            //console.log(repeatedValues.length+" "+80+" "+repeatBonus)
            const calculateChordDifficulty = (x) => {
                let chordObject = x;
                let tempPositions = [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ];
                let isVerticalChord = [
                    false, false, false, false, false,  false, false, false, false, false,
                    false, false, false, false, false,  false, false, false, false, false,
                    false, false, false, false, false,  false, false, false, false, false
                ]
                for (let i = 0; i < chordObject.keyPositions.length; ++i) {
                    let column = chordObject.keyPositions[i].column;
                    let row = chordObject.keyPositions[i].row;
                    tempPositions[row * 10 + column] = 1;
                }
                let verticalChordCounter = 0;
                
                for (let i = 0; i < 10; ++i) {
                    let localCounter = 0;
                    for (let j = 0; j < 3; ++j) {
                        let position = j * 10 + i
                        if (tempPositions[position] != 1)
                            continue;
                        localCounter++;
                    }
                    if (localCounter > 1)
                    {
                        verticalChordCounter+=localCounter;
                        for (let j = 0; j < 3; ++j) {
                            let position = j * 10 + i
                            if (tempPositions[position] != 1)
                                continue;
                            isVerticalChord[position] = true;
                        }   
                    }
                }
                let chordDiff = 1;
                let horizontalPosition = -1;
                let horizontalCounter = 1;
                for (let i = 0; i < 10; ++i) {
                    let counter = 0;
                    let minPosition = Infinity;
                    let maxPosition = -1;
                    for (let j = 0; j < 3; ++j) {
    
                        let position = j * 10 + i
                        if (tempPositions[position] != 1)
                            continue;
                        if (horizontalPosition == -1) {
                            horizontalPosition = i;
                        }
                        else {
                            if (i - horizontalCounter > 3) {
                                horizontalCounter = i;
                                horizontalCounter++
                            }
                        }
    
                        counter++;
                        if (tempPositions[position] == 1 && minPosition > j) {
                            minPosition = j;
                        }
                        if (tempPositions[position] == 1 && maxPosition < j) {
                            maxPosition = j;
                        }
                    }
                    let chordHeight = maxPosition + 1 - minPosition;
                    
                    if (chordHeight == 2)
                        chordDiff += 3;
                    if (chordHeight == 3 && counter == 3)
                        chordDiff += 5;
                    if (chordHeight == 3 && counter == 2)
                    {
                        chordDiff += 30;
                        if (chordObject.keyPositions.length - verticalChordCounter < 1)
                        {
                            chordDiff -= 29.75;
                        }
                    }
                        
                }
                return chordDiff + chordObject.keyPositions.length / 10 + 0.2 * Math.max(horizontalCounter - 2, 1);
            }
            const TAPNOTEDIFFICULTY = 1000;      
            const HOLDNOTEDIFFICULTY = 1700;  
            const RELEASEDIFFICULTY = 1700;
            const TYPINGSECTIONDIFFICULTY = 150;
            const NOTECOUNTDURATION = 1000;
            const NOTECOUNTLIMIT = 10;
    
            const lengthBonusStart = 60000
            const lengthBonusStrength = 400000;
            let lengthBonus = Math.max(1, (drainTime - lengthBonusStart + lengthBonusStrength) / lengthBonusStrength);
            if (drainTime < lengthBonusStart)
                lengthBonus = Math.pow(drainTime / lengthBonusStart, 1.05) / (drainTime / lengthBonusStart);
            let nerfedHandCounter = 0;
            let nerfedHand = 0;
            let leftRightHandUpdated = 0;
            let leftHandLastPressed = [];
            let leftHandCounter = 0;
            let lastLeftHandId = -1;
            let originalLeftHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: 2,
                    column: 3    
                }            
            }
            let lastLeftHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: 2,
                    column: 3
                }
            }
            let rightHandLastPressed = [];
            let rightHandCounter = 0;
            let lastRightHandId = -1;
            let originalRightHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: 2,
                    column: 8    
                }            
            }
            let lastRightHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: 2,
                    column: 8    
                }            
            }
            lastNonTypingSectionIndex = -1;
            let consoleList = [];
        let noteBaseValuesForBuildUp = [];
        let noteStartTimesForBuildUp = [];
        
        let noteMultiplierNames = ["alternatingNerf", "distanceFactor", "speedFactor", "handOverwhelmingBuff", "lengthBonus", "repeatedPatternNerf"];
        let noteMultiplierValues = [];
        for (let i = 0; i < noteMultiplierNames.length; ++i)
        {
            noteMultiplierValues.push([]);
        }
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = [];
        let typingSectionMultiplierValues = [];
        for (let difficultyIndexer = 0; difficultyIndexer < difficultyObjects.length; ++difficultyIndexer)
        {
            let selectedObject = difficultyObjects[difficultyIndexer];
            let calculatedDifficulty = 0;
            let alternatingNerf = 1;
            for (let i = 0; i < leftHandLastPressed.length; ++i)
            {
                if (selectedObject.startTime - leftHandLastPressed[i].startTime > NOTECOUNTDURATION)
                {
                    leftHandLastPressed.splice(i, 1);
                    --i;
                }
            }
            
            for (let i = 0; i < rightHandLastPressed.length; ++i)
            {
                if (selectedObject.startTime - rightHandLastPressed[i].startTime > NOTECOUNTDURATION)
                {
                    rightHandLastPressed.splice(i, 1);
                    --i;
                }
            }
            if (lastLeftHandId != -1 && selectedObject.startTime - difficultyObjects[lastLeftHandId].endTime > 1000)
            {
                if (leftRightHandUpdated == -1)
                    leftRightHandUpdated = 0;
                lastLeftHandId = -1;
                lastLeftHandPosition.keyPosition = {
                    column: 2,
                    row: 3
                }
            }
            if (lastRightHandId != -1 && selectedObject.startTime - difficultyObjects[lastRightHandId].endTime > 1000)
            {
                if (leftRightHandUpdated == 1)
                    leftRightHandUpdated = 0;
                lastRightHandId = -1;
                lastRightHandPosition.keyPosition = {
                    column: 2,
                    row: 8
                }
            }
            //type
            //startTime
            //endTime
            //textUniqueKeys
            //textKeysPositions
            if (selectedObject.type == "typingsection")
            {
                let totalDistance = 0;
                for (let i = 1; i < selectedObject.textKeysPositions.length; ++i)
                {
                    let distanceVector =distanceBetweenPositionsVector(selectedObject.textKeysPositions[i-1],selectedObject.textKeysPositions[i]);
                    totalDistance += Math.sqrt(Math.pow(distanceVector.x, 2) + Math.pow(distanceVector.y, 2));
                }
                if (selectedObject.textKeysPositions.length > 0)
                    calculatedDifficulty = TYPINGSECTIONDIFFICULTY * totalDistance / selectedObject.textKeysPositions.length;
            }

            if (selectedObject.type == "anchor")
            {
                //if (distanceBetweenObjects(lastRightHandPosition, selectedObject) < distanceBetweenObjects(lastLeftHandPosition, selectedObject))
                //{
                //    lastRightHandId = difficultyIndexer;
                //    lastRightHandPosition.keyPosition = {
                //        column: selectedObject.keyPosition.column,
                //        row: selectedObject.keyPosition.row
                //    }
                //}
                //else
                //{
                //    lastLeftHandId = difficultyIndexer;
                //    lastLeftHandPosition.keyPosition = {
                //        column: selectedObject.keyPosition.column,
                //        row: selectedObject.keyPosition.row
                //    }
                //}
                continue;
            }

            
            if (difficultyIndexer != 0)
            {
                let previousNonAnchorIndexer = difficultyIndexer - 1;
                while (difficultyObjects[previousNonAnchorIndexer].type == "anchor")
                {
                    previousNonAnchorIndexer--;
                }
                reactionFactor = selectedObject.startTime
            }
            if (selectedObject.type.includes("mixedchord"))
            {
                chordDifficulty =0;                
                for (let i = 0; i < selectedObject.keyTypes.length; ++i)
                {
                    if (selectedObject.keyTypes[i]=="tap")
                        chordDifficulty += TAPNOTEDIFFICULTY;
                    if (selectedObject.keyTypes[i]=="hold")
                        chordDifficulty += HOLDNOTEDIFFICULTY;
                    if (selectedObject.keyTypes[i]=="release")
                        chordDifficulty += RELEASEDIFFICULTY;
                }
                calculatedDifficulty += chordDifficulty/selectedObject.keyTypes.length;
            }
            if (selectedObject.type.includes("chord") && !selectedObject.type.includes("mixedchord"))
            {
                let chordDifficulty = 1
                if (selectedObject.type.includes("tap"))
                    chordDifficulty = TAPNOTEDIFFICULTY;
                if (selectedObject.type.includes("hold"))
                    chordDifficulty = HOLDNOTEDIFFICULTY;
                if (selectedObject.type.includes("release"))
                    chordDifficulty = RELEASEDIFFICULTY;
                calculatedDifficulty += chordDifficulty * calculateChordDifficulty(selectedObject);
            }
            if (selectedObject.type=="tap")
                calculatedDifficulty += TAPNOTEDIFFICULTY * odFactor;
            if (selectedObject.type=="hold")
                calculatedDifficulty += HOLDNOTEDIFFICULTY * odFactor;
            if (selectedObject.type=="release")
                calculatedDifficulty += RELEASEDIFFICULTY * odFactor;
            if (selectedObject.type=="release" || selectedObject.type=="hold" || selectedObject.type=="tap")
            {
                let preLeftRightHand = leftRightHandUpdated;
                if (distanceBetweenObjects(lastRightHandPosition, selectedObject) < distanceBetweenObjects(lastLeftHandPosition, selectedObject) 
                || distanceBetweenObjects(originalRightHandPosition, selectedObject) < distanceBetweenObjects(originalLeftHandPosition, selectedObject))
                {
                    if (nerfedHand == 1 && nerfedHandCounter > 0)
                    {
                        alternatingNerf = 0.5;
                        nerfedHandCounter--;
                    }
                    else
                    {
                        nerfedHand = 0;
                    }
                    leftHandLastPressed.push(selectedObject);
                    leftHandCounter++;
                    leftRightHandUpdated = 1;
                    lastRightHandId = difficultyIndexer;
                    lastRightHandPosition.keyPosition = {
                        column: selectedObject.keyPosition.column,
                        row: selectedObject.keyPosition.row
                    }
                }
                else
                {
                    
                    if (nerfedHand == -1 && nerfedHandCounter > 0)
                    {
                        alternatingNerf = 0.5;
                        nerfedHandCounter--;
                    }
                    else
                    {
                        nerfedHand = 0;
                    }
                    rightHandLastPressed.push(selectedObject);
                    rightHandCounter++;
                    leftRightHandUpdated = -1;
                    lastLeftHandId = difficultyIndexer;
                    lastLeftHandPosition.keyPosition = {
                        column: selectedObject.keyPosition.column,
                        row: selectedObject.keyPosition.row
                    }

                }
                if (preLeftRightHand != 0 && leftRightHandUpdated != preLeftRightHand 
                    && ((preLeftRightHand == -1 && leftHandCounter < 10)||(preLeftRightHand == 1 && rightHandCounter < 100)))
                {
                    nerfedHand = preLeftRightHand;
                    nerfedHandCounter = 10;
                }
                if (leftRightHandUpdated == 1 && preLeftRightHand != leftRightHandUpdated)
                    leftHandCounter = 0;
                if (leftRightHandUpdated == -1 && preLeftRightHand != leftRightHandUpdated)
                    rightHandCounter = 0;
            }
                
            let handOverwhelmingBuff = 1;
            
            let rightHandLastPressedCount = 0;
            for (let i = 0; i < rightHandLastPressed.length; ++i)
            {
                if (rightHandLastPressed[i].type.includes("chord"))
                {
                    rightHandLastPressedCount += rightHandLastPressed[i].keyPositions.length;
                }
                else
                {
                    rightHandLastPressedCount++;
                }
            }
            let leftHandLastPressedCount = 0;
            for (let i = 0; i < leftHandLastPressed.length; ++i)
            {
                if (leftHandLastPressed[i].type.includes("chord"))
                {
                    leftHandLastPressedCount += leftHandLastPressed[i].keyPositions.length;
                }
                else
                {
                    leftHandLastPressedCount++;
                }
            }
            if (rightHandLastPressedCount > Math.ceil(NOTECOUNTLIMIT / 2)
             && leftHandLastPressedCount> Math.ceil(NOTECOUNTLIMIT / 2))
            {
                handOverwhelmingBuff = Math.pow(rightHandLastPressed.length + leftHandLastPressed.length,0.8) / NOTECOUNTLIMIT;
                handOverwhelmingBuff = Math.max(1, handOverwhelmingBuff);
            }
            let distanceFactor = 1;
            let speedFactor = 1;
            if (lastNonTypingSectionIndex >= 0 && selectedObject.type != "typingsection")
            {
                let previousObject = difficultyObjects[lastNonTypingSectionIndex];
                let previousEndTime = previousObject.endTime;
                let currentStartTime = selectedObject.startTime;
                //distanceFactor = Math.max(distanceBetweenObjects(selectedObject, previousObject), 1) / ((currentStartTime - previousEndTime)/20);
                const SPEEDUPPERLIMIT = 200;
                const SPEEDLOWERLIMIT = 25;
                speedFactor = Math.max(SPEEDUPPERLIMIT/(SPEEDLOWERLIMIT+(currentStartTime - previousEndTime) * ((SPEEDUPPERLIMIT-SPEEDLOWERLIMIT)/SPEEDUPPERLIMIT)),1);
                if (speedFactor > 1)
                    speedFactor = Math.pow(speedFactor, 0.2);
            }
            if (selectedObject.type!="typingsection")
            {
                lastNonTypingSectionIndex = difficultyIndexer
            }
            consoleList.push(distanceFactor)
            consoleList.push(speedFactor)
            consoleList.push(lengthBonus)
            consoleList.push("last:"+repeatedPatternNerf[difficultyIndexer])
            if (selectedObject.type != "typingsection" && selectedObject.type != "anchor")
            {
                if (calculatedDifficulty == 0)
                    console.log(selectedObject)
                noteBaseValuesForBuildUp.push(calculatedDifficulty);
                noteStartTimesForBuildUp.push(selectedObject.startTime);
                noteMultiplierValues[0].push(alternatingNerf);
                noteMultiplierValues[1].push(distanceFactor);
                noteMultiplierValues[2].push(speedFactor );
                noteMultiplierValues[3].push(handOverwhelmingBuff );
                noteMultiplierValues[4].push(lengthBonus);
                noteMultiplierValues[5].push(repeatedPatternNerf[difficultyIndexer]);
            }
            
        }
        //console.log(consoleList);
        
        //console.log("SEPARATOR");
        let notecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204], [128, 31, 135]]; //, [0, 247, 231], [28, 22, 186]
        return [noteStartTimesForBuildUp, noteBaseValuesForBuildUp, noteMultiplierNames, noteMultiplierValues, notecolors, typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames, typingSectionMultiplierValues];
    }
}