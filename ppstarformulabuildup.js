ppstarFormulaBuildUps = {
    valerusSrReworkBuildup(scoreData) {
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
        /*if (difficultyDensity > 8)
        {
          difficultyDensity =8*Math.pow(difficultyDensity/8,0.4);
        }*/
        let notecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204], [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        return [noteStartTimesForBuildUp, noteBaseValuesForBuildUp, noteMultiplierNames, noteMultiplierValues, notecolors, typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames, typingSectionMultiplierValues];

    }
}