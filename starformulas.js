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
        const notes = scoreData.notes;
        const typingSections = scoreData.typingSections;
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
        for (let i = 0; i < notes.length; ++i) {
            if (getStartTime(notes[i]) < minTime)
                minTime = getStartTime(notes[i]);
            if (getEndTime(notes[i]) > maxTime)
                maxTime = getEndTime(notes[i]);
            sortedTimeNotes.push(i);
            alreadyUsedForChord.push(false);
            heldNoteCounts.push(0);
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
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteLotBuffLimit, 1));
            else
                noteDifficulties.push(noteDefaultDiff);
        }

        const drainTime = maxTime - minTime;

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
                noteDifficulties[chords[i][j]] *= chordDifficulty;
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
                            noteDifficulties[keyboardSortedIds[i][stackNotesIds[k]]] *= Math.pow(40 / stackNotes[k] + 1, Math.pow(stackSize, 0.3));
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
                timeDurationBonus = OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE)
            let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.8);

            timeDurationBonus = Math.max(0.9, timeDurationBonus);

            objectDifficultySum += noteDifficulties[selectedNoteIndex] * timeDurationBonus * heldNoteBonus * lengthBonus * odbonus;
        }
        for (let i = 0; i < typingSectionDifficulties.length; ++i) {
            let uniqueLetters = new Set(typingSections[i].text);
            let letterLackNerf = Math.min((uniqueLetters.size / typingSections[i].text.length) + 0.5, 1);
            objectDifficultySum += typingSectionDifficulties[i] * letterLackNerf * 7;
        }
        let difficultyDensity = objectDifficultySum / Math.max(drainTime, 1000);
        /*if (difficultyDensity > 8)
        {
          difficultyDensity =8*Math.pow(difficultyDensity/8,0.4);
        }*/
        return difficultyDensity;

    }


};