let ingamehotfix = {
    name: "In game hotfix",
    creator: "Valerus9",
    pp: {
        calculate(scoreData) {
            const acc = scoreData.accuracy / 100;
            let result = ingamehotfix.innerCalculate(scoreData).difficultyDensity;
            result = Math.pow(result * 12.27, 1.02);        
            const judgmentSum = scoreData.judgmentCounts.perfect + scoreData.judgmentCounts.good + scoreData.judgmentCounts.ok + scoreData.judgmentCounts.miss
            if (judgmentSum > 0)
            {
                let misspenalty = 0
                for (let i = 1; i < scoreData.judgmentCounts.miss; ++i) {
                    misspenalty += 1 / (64 * (i + 0.1)) + 0.001
                }
                let maxmisspenalty = 0
                for (let i = 1; i < judgmentSum; ++i) {
                    maxmisspenalty += 1 / (64 * (i + 0.1)) + 0.001
                }
                misspenalty = 1 - misspenalty / maxmisspenalty;
                let objectCountMissNerf = 1 / (judgmentSum + 1 / 0.02) + 0.98
                //console.log(Math.round(result*100)/100)
                return result * Math.pow(acc, 5) * Math.pow(misspenalty, objectCountMissNerf);
            }
            
            return result * Math.pow(acc, 5);
        }
    },
    sr: {
        calculate(scoreData) {
            let result = ingamehotfix.innerCalculate(scoreData).difficultyDensity;
            if (result > 5) {
                result = 5 * Math.pow(result / 5, 0.4);
            }
            return result;
        }
    },
    buildup: {
        calculate(scoreData) {
            result = ingamehotfix.innerCalculate(scoreData);
            return result;
        }
    },
    innerCalculate(scoreData) {
        // Keyboard layout used as a reference for key positions, except for space
        // because I would rather have underweight space chords than overweight ones
        // (Vertical chord incident v2 if space chord was tried to be weighted)
        const KEYBOARDLAYOUT = [
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
            "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
            "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
            "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
            " "
        ];
        let noteBaseValuesForBuildUp = [];
        let noteStartTimesForBuildUp = [];
        let noteMultiplierNames = ["noteAmountNerfBuff", "chordBuff", "stackBuff", "distanceFactor", "timeDurationBonus", "heldNoteBonus", "lengthBonus", "odbonus"];
        let noteMultiplierValues = [];
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = ["letterLackNerf"];
        let typingSectionMultiplierValues = [];
        let filteredNotes = [];

        for (let i = 0; i < noteMultiplierNames.length; ++i) {
            noteMultiplierValues.push([]);
        }

        //Start a for loop from 0 so that all notes are included
        //Ending at scoreData.notes.length so that the last note
        //is included
        //++i because we don't want to skip any notes without
        //checking it if its valid or not
        //We also have to makes sure that maps without any notes
        //don't break the map
        for (let i = 0; i < (scoreData.notes || []).length; ++i) {
            //Since tap notes only have startTime and hold notes
            //also have endTime they need to be separately filtered
            //This mainly filteres catch notes and notes with keys
            //that are not on the map itself
            if (!KEYBOARDLAYOUT.includes(scoreData.notes[i].key)) continue
            //startTime, endTime is multiplied by 1000 because all my calculations
            //rely on the fact that both are given in milliseconds, not in seconds
            if (scoreData.notes[i].type == "tap") {
                let tempNote = {
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime * 1000,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempNote);
            }
            else if (scoreData.notes[i].type == "hold") {

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
        for (let i = 0; i < (scoreData.typingSections || []).length; ++i) {
            //In case there are typingSections which had their text edited through
            //a text editor and have no text then they must be skipped
            if (!scoreData.typingSections[i].text) continue;
            let tempTypingSection = {
                endTime: scoreData.typingSections[i].endTime * 1000,
                startTime: scoreData.typingSections[i].startTime * 1000,
                text: scoreData.typingSections[i].text,
            }
            filteredTypingSections.push(tempTypingSection);

        }

        //Sort all notes/typingSections by startTime for calculating speed more easily
        const notes = filteredNotes.sort((a, b) => a.startTime - b.startTime);
        const typingSections = filteredTypingSections.sort((a, b) => a.startTime - b.startTime);


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

        //Getting the min and max time for drainTime 
        //since we have already sorted both notes and
        //typingSections we can just check the first
        //of both to get the min time
        let minTime = typingSections.length > 0 ? 
        notes.length > 0 ? getStartTime(typingSections[0]) > getStartTime(notes[0]) ? getStartTime(notes[0]) : getStartTime(typingSections[0]) : getStartTime(typingSections[0]) :
        notes.length > 0 ? getStartTime(notes[0]) : 0
        //The same trick cannot be used for max so
        //Instead we use .reduce() and Math.max for it
        let maxTime = Math.max(notes.reduce((a, b) => Math.max(Object.keys(a).includes("startTime") ? getEndTime(a) : a, Object.keys(b).includes("startTime") ? getEndTime(b) : b), -Infinity), typingSections.length > 0 ? typingSections.reduce((a, b) => Math.max(Object.keys(a).includes("startTime") ? getEndTime(a) : a, Object.keys(b).includes("startTime") ? getEndTime(b) : b), -Infinity) : -Infinity);
        let typingSectionDifficulties = new Array(typingSections.length).fill(100);

        const drainTime = Math.max(maxTime - minTime, 1000);

        const noteFewNerfLimit = 100;
        const noteLotBuffLimit = 1000;
        const noteDefaultDiff = 1000;

        let noteDifficulties = [];
        let heldNoteCounts = new Array(notes.length).fill(0);
        let alreadyUsedForChord = new Array(notes.length).fill(false);
        let chordBuffForNote = new Array(notes.length).fill(1);

        //Nerf/buff for basically having more notes based in the map
        for (let i = 0; i < notes.length; ++i) {
            if (i <= noteFewNerfLimit) {
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteFewNerfLimit, 0.1));
                noteMultiplierValues[0].push(Math.pow((i + 1) / noteFewNerfLimit, 0.1));
            }
            else if (i >= noteLotBuffLimit) {
                noteDifficulties.push(noteDefaultDiff * Math.pow((i + 1) / noteLotBuffLimit, 0.05));
                noteMultiplierValues[0].push(Math.pow((i + 1) / noteLotBuffLimit, 0.05));
            }
            else {
                noteDifficulties.push(noteDefaultDiff);
                noteMultiplierValues[0].push(1);
            }

            noteBaseValuesForBuildUp.push(noteDefaultDiff);
            noteStartTimesForBuildUp.push(getStartTime(notes[i]))
            for (let j = 1; j < noteMultiplierValues.length; ++j) {
                noteMultiplierValues[j].push(1);
            }
        }

        //Create chords
        let chords = [];
        //We are going to notes.length - 1 because
        //after notes.length we don't have any more notes
        //that could be used to merged notes with the last
        //one
        for (let i = 0; i < notes.length - 1; ++i) {
            //We don't want notes to appear in two chords
            //because that would cause issues
            //Also due to space being very unique it would
            //be rather foolish to try to understand the
            //implications of space being a part of a chord
            if (alreadyUsedForChord[i] || notes[i].key == " ")
                continue;
            let currentNoteTime = getStartTime(notes[i]);
            let addedCurrentNote = false;
            for (let j = i + 1; j < notes.length; ++j) {
                //Same applies here as to the if statement
                //that contains the same conditions
                if (alreadyUsedForChord[j] || notes[j].key == " ")
                    continue;
                let selectedNoteTime = getStartTime(notes[j]);
                //The +12ms is for chords that are have notes
                //which are offset by some ms to not be classified
                //as chords and therefore gain some advantage
                if (selectedNoteTime < currentNoteTime + 12) {
                    if (!addedCurrentNote) {
                        alreadyUsedForChord[i] = true;
                        chords.push([]);
                        addedCurrentNote = true;
                        chords[chords.length - 1].push(i);
                    }
                    chords[chords.length - 1].push(j);
                    alreadyUsedForChord[j] = true;
                }
                else
                    break;
            }
        }

        //Evaluate chords difficulty
        for (let i = 0; i < chords.length; ++i) {
            //Creating a 2d array for easier calculations of chord diffs
            let columnPlacement = new Array(10);
            for (let j = 0; j < columnPlacement.length; ++j) {
                columnPlacement[j] = new Array(4).fill(-1);
            }
            //Filling it up with notes id from chords
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
                            //This is the vertical chord buff
                            //DO NOT INCREASE THIS VALUE UNDER ANY CIRCUMSTANCE
                            //(OR EXPERIENCE VERTICAL CHORDS ROUND 2)
                            chordDifficulty += 0.5;
                        }
                    }
                    if (lastMaxRowPos != -1) {
                        //This buffs chords which have a higher than 1 width,
                        //but less than 4 due to two hands being able to separate
                        //the chord between themselves
                        if (Math.abs(lastColumnPos - j) <= 4 && (lastMinRowPos != k || lastMaxRowPos != k)) {
                            chordDifficulty += 0.02 * (4 - Math.abs(lastColumnPos - j));
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
                //This is stored so that it can be used for
                //more accurate heldNoteBonus calculation
                chordBuffForNote[chords[i][j]] = Math.max(chordDifficulty, 1);
                //Just because the map has large chords doesn't mean
                //it needs to have insanely large numbers
                if (chordDifficulty > 9)
                    chordDifficulty = Math.pow(chordDifficulty - 8, 0.01) + 8;
                noteDifficulties[chords[i][j]] *= Math.max(chordDifficulty, 1);
                noteMultiplierValues[1][chords[i][j]] = Math.max(chordDifficulty, 1);
            }
        }

        //Idea is that it is way easier to check stacks if each note is stored in each of its positions
        let keyboardNotes = [
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [],
        ];
        let keyboardSortedIds = [
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [],
        ];
        for (let i = 0; i < notes.length; ++i) {
            let keyboardIndex = KEYBOARDLAYOUT.indexOf(notes[i].key);
            keyboardNotes[keyboardIndex].push(notes[i]);
            keyboardSortedIds[keyboardIndex].push(i);
        }

        for (let i = 0; i < keyboardNotes.length; ++i) {
            let stackStrength = 0;
            let stackNotes = [];
            let stackNotesIds = [];
            for (let j = keyboardNotes[i].length - 1; j > 0; --j) {
                let laterNote = keyboardNotes[i][j];
                let earlierNote = keyboardNotes[i][j - 1];
                let laterStartTime = getStartTime(laterNote);
                let earlierEndTime = getEndTime(earlierNote);
                let distance = laterStartTime - earlierEndTime;
                //This check may seem dumb since you can't place
                //notes inside of a hold note, but people can still
                //edit their map with a text editor and add a note
                //that is inside of a hold note.      
                if (distance <= 0)
                    continue;
                //Distances are recorded for use in stack calculations  
                if (stackStrength == 0 && distance < 250) {
                    stackNotes.push(distance);
                    stackNotesIds.push(j);
                    stackStrength = distance;
                }
                else {
                    if (250 > distance) {
                        stackNotes.push(Math.max(distance, 1));
                        stackNotesIds.push(j);
                    }
                    else {
                        stackNotes.push(distance);
                        stackNotesIds.push(j);
                        for (let k = 0; k < stackNotesIds.length; ++k) {
                            //StackBonus is calculated using distance
                            //the less distance, the more faster it needs to be pressed
                            //as for why stackNotes amount needs to be included is
                            //to ensure that having more notes in the stack shouldn't
                            //majorly increase difficulty of stacks
                            let stackBonus = 40 / stackNotes[k] + 1;
                            //stackbonus above 3 should just slightly increase buff
                            if (stackBonus > 3)
                                stackBonus = Math.pow(stackBonus - 2, 0.01) + 2;
                            noteDifficulties[keyboardSortedIds[i][stackNotesIds[k]]] *= stackBonus;
                            noteMultiplierValues[2][keyboardSortedIds[i][stackNotesIds[k]]] = stackBonus;
                        }
                        stackNotes = [];
                        stackNotesIds = [];
                        stackStrength = 1;
                    }
                }
            }
        }

        //This is basically rhythmNerf v0.5
        //The idea is that repeated distances should be nerfed
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
                    //This check may seem dumb since you can't place
                    //notes inside of a hold note, but people can still
                    //edit their map with a text editor and add a note
                    //that is inside of a hold note.    
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
                let calculatedDistanceFactor = Math.pow(Math.min(3 / (maxCount + 1), 1), distanceFactor);
                let applyNerfToDistance = 1;
                const appliedNerfDistance = 0.3;
                const appliedBuffDistance = 1;
                if (calculatedDistanceFactor < 1) {
                    applyNerfToDistance = Math.pow(calculatedDistanceFactor, appliedNerfDistance);
                }
                else if (calculatedDistanceFactor > 1) {
                    applyNerfToDistance = Math.pow(calculatedDistanceFactor - 1, appliedBuffDistance) + 1;
                }
                noteDifficulties[keyboardSortedIds[i][j]] *= applyNerfToDistance;
                noteMultiplierValues[3][keyboardSortedIds[i][j]] = applyNerfToDistance;
            }
        }

        const overallDifficulty = scoreData.overallDifficulty;
        let odnerf = 1 / (Math.pow(Math.max(9 - overallDifficulty, 0), 1.5) / 100 + 1);
        let odbonus = Math.pow(Math.max(overallDifficulty - 7, 0), 1.1) / 100 + 1;
        odbonus = odbonus * odnerf;
        if (odbonus > 1)
            odbonus = Math.pow(odbonus, 1.1);

        const lengthBonusStart = 60000
        const lengthBonusStrength = 400000;
        let lengthBonus = Math.max(1, (drainTime - lengthBonusStart + lengthBonusStrength) / lengthBonusStrength);
        if (drainTime < lengthBonusStart)
            lengthBonus = Math.pow(drainTime / lengthBonusStart, 1.20) / (drainTime / lengthBonusStart);
        let objectDifficultySum = 0;
        for (let i = 1; i < notes.length; ++i) {
            let selectedNoteIndex = i;
            let previousNoteIndex = i - 1;

            for (let j = i + 1; j < notes.length; ++j) {
                if (notes[i].type != "hold")
                    break;
                let nextNoteIndex = j;
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
                timeDurationBonus = Math.max(OBJECTTIMEDIFFERENCE / (selectedStartTime - previousEndTime + REWARDTIMEDIFFERENCE), 1.3);
            let heldNoteBonus = Math.pow(heldNoteCounts[selectedNoteIndex] + 1, 0.52 / Math.pow(chordBuffForNote[selectedNoteIndex], 2));

            if (timeDurationBonus > 2) {
                timeDurationBonus = Math.pow(timeDurationBonus - 1, 0.1) + 1;
            }
            let trueODBonus = odbonus;
            if (alreadyUsedForChord[selectedNoteIndex] && overallDifficulty > 9.8) {
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
        }
        let difficultyDensity = objectDifficultySum / drainTime;
        let notecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204], [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        return {
            difficultyDensity: difficultyDensity, noteStartTimesForBuildUp: noteStartTimesForBuildUp, noteBaseValuesForBuildUp: noteBaseValuesForBuildUp,
            noteMultiplierNames: noteMultiplierNames, noteMultiplierValues: noteMultiplierValues, notecolors: notecolors,
            typingSectionBaseValuesForBuildUp: typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames: typingSectionMultiplierNames,
            typingSectionMultiplierValues: typingSectionMultiplierValues
        };
    }
}

reworks.push(ingamehotfix);