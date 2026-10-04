let valerusReworkV3Compressed = {
    name: "Valers9 rework v3",
    creator: "Valerus9",
    pp: {
        calculate(scoreData) {
            const acc = scoreData.accuracy / 100;
            //scoreData["ispp"] = true;
            let result = valerusReworkV3Compressed.innerCalculate(scoreData).difficultyDensity;
            return Math.pow(result * 16, 1.02) * Math.pow(acc, 5);
        }
    },
    sr: {

        calculate(scoreData) {
            //scoreData["ispp"] = false;
            let result = valerusReworkV3Compressed.innerCalculate(scoreData).difficultyDensity;
            return result;
        }
    },
    buildup:
    {
        calculate(scoreData) {
            result = valerusReworkV3Compressed.innerCalculate(scoreData);
            return result;
        }
    },
    innerCalculate(scoreData) {
        const TAPNOTEDIFFICULTY = 0.02;
        const HOLDNOTEDIFFICULTY = 0.01;
        const RELEASEDIFFICULTY = 0.01;
        const OVERALLDIFFICULTY = scoreData.overallDifficulty;
        const TYPINGSECTIONDIFFICULTY = 0.02;

        const copyObject = (x) => {
            if (typeof x === 'number')
                return x;
            let temp = {};
            let xkeys = Object.keys(x);
            for (let i = 0; i < xkeys.length; ++i) {
                if (Object.keys(x[xkeys[i]]).length == 0 || (x[xkeys[i]].length !== undefined && x[xkeys[i]].length == Object.keys(x[xkeys[i]]).length))
                    temp[xkeys[i]] = x[xkeys[i]];
                else
                    temp[xkeys[i]] = copyObject(x[xkeys[i]]);
            }
            return temp;
        }
        const KEYBOARDLAYOUT = [
            "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
            "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
            "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
        ];
        const getKeyboardLowerCase = x => {
            if (x == "<")
                return ",";
            if (x == ">")
                return ".";
            if (x == "?")
                return "/";
            if (x == ":")
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
        const getDrainTime = (inputNotes, inputTypingSections) => {
            let minTime = Infinity;
            let maxTime = 0;
            for (let i = 0; i < inputTypingSections.length; ++i) {
                if (inputTypingSections[i].startTime < minTime)
                    minTime = inputTypingSections[i].startTime;
                if (inputTypingSections[i].endTime > maxTime)
                    maxTime = inputTypingSections[i].endTime;
            }
            for (let i = 0; i < inputNotes.length; ++i) {
                if (getStartTime(inputNotes[i]) < minTime)
                    minTime = getStartTime(inputNotes[i]);
                if (getEndTime(inputNotes[i]) > maxTime)
                    maxTime = getEndTime(inputNotes[i]);
            }
            return maxTime - minTime;
        }
        const getDrainTimeV2 = (mergedNoteObjects) => {
            let drainTime = 0;
            for (let i = 1; i < mergedNoteObjects.length; ++i) {
                drainTime += Math.min(mergedNoteObjects[i].startTime - mergedNoteObjects[i - 1].startTime, 5000);
            }
            return Math.max(drainTime, 1000);
        }

        let createNewTempConvertedNote = (note) => {
            return {
                id: note.id,
                type: note.type,
                startTime: getStartTime(note),
                endTime: getEndTime(note),
                keyPosition:
                {
                    row: getKeyboardRow(note.key),
                    column: getKeyboardColumn(note.key),
                }
            }
        }

        const calculateDistance = (x1, y1, x2, y2) => {
            return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
        }
        const distanceBetweenObjects = (difficultyObject1, difficultyObject2) => {
            let vectorDistance = distanceBetweenObjectsVector(difficultyObject1, difficultyObject2);
            return Math.sqrt(Math.pow(vectorDistance.x, 2) + Math.pow(vectorDistance.y, 2));
        }
        const calculateChordCenter = (chord) => {
            let center = {
                row: 0,
                column: 0
            }
            for (let i = 0; i < chord.keyPositions.length; ++i) {
                center.row += chord.keyPositions[i].row;
                center.column += chord.keyPositions[i].column;
            }
            center.row /= chord.keyPositions.length;
            center.column /= chord.keyPositions.length;
            return center;
        }
        const distanceBetweenObjectsVector = (difficultyObject1, difficultyObject2) => {
            let distance = 1;
            let vector = {
                x: 1,
                y: 1
            }

            if (!difficultyObject1.type.includes("chord") && !difficultyObject2.type.includes("chord")) {
                let x1 = difficultyObject1.keyPosition.row;
                let x2 = difficultyObject2.keyPosition.row;
                let y1 = difficultyObject1.keyPosition.column;
                let y2 = difficultyObject2.keyPosition.column;
                vector.x = x1 - x2;
                vector.y = y1 - y2;
            }
            else if (!difficultyObject1.type.includes("chord") && difficultyObject2.type.includes("chord")) {
                let minDistance = Infinity;
                for (let i = 0; i < difficultyObject2.keyPositions.length; ++i) {
                    let x1 = difficultyObject1.keyPosition.row;
                    let x2 = difficultyObject2.keyPositions[i].row;
                    let y1 = difficultyObject1.keyPosition.column;
                    let y2 = difficultyObject2.keyPositions[i].column;
                    distance = calculateDistance(x1, x2, y1, y2);
                    if (minDistance > distance) {
                        minDistance = distance;
                        vector.x = x1 - x2;
                        vector.y = y1 - y2;
                    }
                }
            }
            else if (difficultyObject1.type.includes("chord") && !difficultyObject2.type.includes("chord")) {
                let minDistance = Infinity;
                for (let i = 0; i < difficultyObject1.keyPositions.length; ++i) {
                    let x1 = difficultyObject2.keyPosition.row;
                    let x2 = difficultyObject1.keyPositions[i].row;
                    let y1 = difficultyObject2.keyPosition.column;
                    let y2 = difficultyObject1.keyPositions[i].column;
                    distance = calculateDistance(x1, x2, y1, y2);
                    if (minDistance > distance) {
                        minDistance = distance;
                        vector.x = x1 - x2;
                        vector.y = y1 - y2;
                    }

                }
            }
            else {
                let minDistance = Infinity;
                for (let i = 0; i < difficultyObject1.keyPositions.length; ++i) {
                    for (let j = 0; j < difficultyObject2.keyPositions.length; ++j) {
                        let x1 = difficultyObject2.keyPositions[j].row;
                        let x2 = difficultyObject1.keyPositions[i].row;
                        let y1 = difficultyObject2.keyPositions[j].column;
                        let y2 = difficultyObject1.keyPositions[i].column;
                        distance = calculateDistance(x1, x2, y1, y2);
                        if (minDistance > distance) {
                            minDistance = distance;
                            vector.x = x1 - x2;
                            vector.y = y1 - y2;
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
            vector.x = x1 - x2;
            vector.y = y1 - y2;

            return vector;
        }

        const matrixLayerContainsKey = (matrix, layer) => {
            for (let j = 0; j < matrix.length; ++j) {
                if (matrix[j][layer] != -1) {
                    return true;
                }
            }
            return false;
        };
        const matrixLayerGetKeyValue = (matrix, layer) => {
            for (let j = 0; j < matrix.length; ++j) {
                if (matrix[j][layer] != -1) {
                    return matrix[j][layer];
                }
            }
            return -1;
        };
        const matrixLayerGetKeyPosition = (matrix, layer) => {
            for (let j = 0; j < matrix.length; ++j) {
                if (matrix[j][layer] != -1) {
                    let tempVector = {
                        column: j % 10,
                        row: (j - j % 10) / 10
                    }
                    return tempVector;
                }
            }
            return { column: -1, row: -1 };
        };

        const getChordWidthHeight = (x) => {
            let chordObject = x;
            let chordWidthHeightMax = {
                row: 0,
                column: 0
            }
            let chordWidthHeightMin = {
                row: Infinity,
                column: Infinity
            }
            for (let i = 0; i < chordObject.keyPositions.length; ++i) {
                if (chordObject.keyPositions[i].row < chordWidthHeightMin.row)
                    chordWidthHeightMin.row = chordObject.keyPositions[i].row;
                if (chordObject.keyPositions[i].column < chordWidthHeightMin.column)
                    chordWidthHeightMin.column = chordObject.keyPositions[i].column;
                if (chordObject.keyPositions[i].row > chordWidthHeightMax.row)
                    chordWidthHeightMax.row = chordObject.keyPositions[i].row;
                if (chordObject.keyPositions[i].column > chordWidthHeightMax.column)
                    chordWidthHeightMax.column = chordObject.keyPositions[i].column;
            }
            let chordWidthHeight = {
                row: chordWidthHeightMax.row - chordWidthHeightMin.row + 1,
                column: chordWidthHeightMax.column - chordWidthHeightMin.column + 1,
            }
            return chordWidthHeight;
        }

        const createChordFromAlreadyExisting = (difficultyChord, keyIndexes) => {
            let tempDifficultyChord = {
                type: difficultyChord.type,
                ids: [],
                keyPositions: [],
                keyTypes: [],
                startTime: difficultyChord.startTime,
                endTime: difficultyChord.endTime,
            }
            for (let i = 0; i < keyIndexes.length; ++i) {
                let tempKeyPosition = {
                    row: difficultyChord.keyPositions[keyIndexes[i]].row,
                    column: difficultyChord.keyPositions[keyIndexes[i]].column,
                }
                tempDifficultyChord.keyPositions.push(tempKeyPosition);
                tempDifficultyChord.keyTypes.push(difficultyChord.keyTypes[keyIndexes[i]]);
                tempDifficultyChord.ids.push(difficultyChord.ids[keyIndexes[i]]);
            }
            return tempDifficultyChord;
        }

        const createMergedNoteObject = (convertedNoteObjects, mergBeginning, mergEnd) => {
            let tempMergedNoteObject = {
                type: "",
                ids: [],
                keyPositions: [],
                keyTypes: [],
                startTime: convertedNoteObjects[mergBeginning].startTime,
                endTime: convertedNoteObjects[mergBeginning].endTime,
            }
            for (let mergeIndexer = mergBeginning; mergeIndexer < mergEnd; ++mergeIndexer) {
                if (tempMergedNoteObject.type == "") {
                    tempMergedNoteObject.type = convertedNoteObjects[mergeIndexer].type + "chord";
                }
                else if (!tempMergedNoteObject.type.includes(convertedNoteObjects[mergeIndexer].type)) {
                    tempMergedNoteObject.type = "mixedchord";
                }
                let tempKeyPosition =
                {
                    row: convertedNoteObjects[mergeIndexer].keyPosition.row,
                    column: convertedNoteObjects[mergeIndexer].keyPosition.column,
                }
                tempMergedNoteObject.keyPositions.push(tempKeyPosition);
                tempMergedNoteObject.keyTypes.push(convertedNoteObjects[mergeIndexer].type);
                tempMergedNoteObject.ids.push(convertedNoteObjects[mergeIndexer].id);
            }
            return tempMergedNoteObject;
        }

        const sortArray = (unsortedArray, parameterToUse) => {
            for (let i = 0; i < unsortedArray.length - 1; ++i) {
                for (let j = i + 1; j < unsortedArray.length; ++j) {
                    if (parameterToUse(unsortedArray[i], unsortedArray[j])) {
                        let temp = copyObject(unsortedArray[i]);
                        unsortedArray[i] = copyObject(unsortedArray[j]);
                        unsortedArray[j] = copyObject(temp);
                    }
                }
            }
        }

        const getChordSize = (chord) => {
            let min = {
                width: Infinity,
                height: Infinity,
            }
            let max = {
                width: 1,
                height: 1,
            }
            for (let i = 0; i < chord.keyPositions.length; ++i) {
                if (min.width > chord.keyPositions.column)
                    min.width = chord.keyPositions.column

                if (min.height > chord.keyPositions.row)
                    min.height = chord.keyPositions.row

                if (max.width < chord.keyPositions.column)
                    max.width = chord.keyPositions.column

                if (max.height < chord.keyPositions.row)
                    max.height = chord.keyPositions.row
            }
            let result = {
                width: max.width - min.width + 1,
                height: max.height - min.height + 1,
            }
            return result;
        }

        const divideChordsBetweenHandPositions = (difficultyChord, leftHandPosition, rightHandPosition) => {
            let leftHandChordIndexes = [];
            let rightHandChordIndexes = [];

            for (let i = 0; i < difficultyChord.keyPositions.length; ++i) {
                if (difficultyChord.keyPositions[i].column < 5) {
                    leftHandChordIndexes.push(i);
                }
                else {
                    rightHandChordIndexes.push(i);
                }
            }

            let newLeftHandPosition = {
                keyPosition: {
                    row: -2,
                    column: -2
                }

            }
            let newRightHandPosition = {
                keyPosition: {
                    row: -2,
                    column: -2
                }
            }
            for (let i = 0; i < leftHandChordIndexes.length; ++i) {
                newLeftHandPosition.keyPosition.row += difficultyChord.keyPositions[leftHandChordIndexes[i]].row;
                newLeftHandPosition.keyPosition.column += difficultyChord.keyPositions[leftHandChordIndexes[i]].column;
            }
            if (newLeftHandPosition.keyPosition.row != -2 || newLeftHandPosition.keyPosition.column != -2) {
                newLeftHandPosition.keyPosition.row += 2;
                newLeftHandPosition.keyPosition.column += 2;
                newLeftHandPosition.keyPosition.row = newLeftHandPosition.keyPosition.row / leftHandChordIndexes.length;
                newLeftHandPosition.keyPosition.column = newLeftHandPosition.keyPosition.column / leftHandChordIndexes.length;
            }
            else {
                newLeftHandPosition.keyPosition.row += leftHandPosition.keyPosition.row;
                newLeftHandPosition.keyPosition.column += leftHandPosition.keyPosition.column;
            }
            for (let i = 0; i < rightHandChordIndexes.length; ++i) {
                newRightHandPosition.keyPosition.row += difficultyChord.keyPositions[rightHandChordIndexes[i]].row;
                newRightHandPosition.keyPosition.column += difficultyChord.keyPositions[rightHandChordIndexes[i]].column;
            }
            if (newRightHandPosition.keyPosition.row != -2 || newRightHandPosition.keyPosition.column != -2) {
                newRightHandPosition.keyPosition.row += 2;
                newRightHandPosition.keyPosition.column += 2;
                newRightHandPosition.keyPosition.row = newRightHandPosition.keyPosition.row / rightHandChordIndexes.length;
                newRightHandPosition.keyPosition.column = newRightHandPosition.keyPosition.column / rightHandChordIndexes.length;
            }
            else {
                newRightHandPosition.keyPosition.row += rightHandPosition.keyPosition.row;
                newRightHandPosition.keyPosition.column += rightHandPosition.keyPosition.column;
            }

            let leftHandChord = createChordFromAlreadyExisting(difficultyChord, leftHandChordIndexes);
            let rightHandChord = createChordFromAlreadyExisting(difficultyChord, rightHandChordIndexes);

            return { rightHandPosition: newRightHandPosition, leftHandPosition: newLeftHandPosition, leftChord: leftHandChord, rightChord: rightHandChord };
        }

        const splitMapBetweenTwoHands = (mergedNoteObjects) => {
            let leftHandPosition = {
                type: "",
                startTime: 0,
                keyPosition: {
                    row: 2,
                    column: 2
                }

            }
            let leftMergedNoteObjects = [];
            let rightHandPosition = {
                type: "",
                startTime: 0,
                keyPosition: {
                    row: 2,
                    column: 7
                }

            }
            let rightMergedNoteObjects = [];

            for (let i = 0; i < mergedNoteObjects.length; ++i) {
                if (mergedNoteObjects[i].type.includes("chord")) {
                    let divided = divideChordsBetweenHandPositions(mergedNoteObjects[i], leftHandPosition, rightHandPosition);
                    if (divided.leftChord.keyPositions.length > 0) {
                        leftHandPosition.keyPosition.row = divided.leftHandPosition.keyPosition.row;
                        leftHandPosition.keyPosition.column = divided.leftHandPosition.keyPosition.column;
                        leftMergedNoteObjects.push(divided.leftChord);
                        leftHandPosition.type = mergedNoteObjects[i].type.replace("chord", "");
                        leftHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }
                    if (divided.rightChord.keyPositions.length > 0) {
                        rightHandPosition.keyPosition.row = divided.rightHandPosition.keyPosition.row;
                        rightHandPosition.keyPosition.column = divided.rightHandPosition.keyPosition.column;
                        rightMergedNoteObjects.push(divided.rightChord);
                        rightHandPosition.type = mergedNoteObjects[i].type.replace("chord", "");
                        rightHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }

                }
                else {
                    if (mergedNoteObjects[i].keyPosition.column < 5) {
                        leftMergedNoteObjects.push(mergedNoteObjects[i]);
                        leftHandPosition.keyPosition.row = mergedNoteObjects[i].keyPosition.row;
                        leftHandPosition.keyPosition.column = mergedNoteObjects[i].keyPosition.column;
                        leftHandPosition.type = mergedNoteObjects[i].type;
                        leftHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }
                    else {
                        rightMergedNoteObjects.push(mergedNoteObjects[i]);
                        rightHandPosition.keyPosition.row = mergedNoteObjects[i].keyPosition.row;
                        rightHandPosition.keyPosition.column = mergedNoteObjects[i].keyPosition.column;
                        rightHandPosition.type = mergedNoteObjects[i].type;
                        rightHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }
                }
            }

            return { leftHand: leftMergedNoteObjects, rightHand: rightMergedNoteObjects };
        };

        const calculateSpeed = (difficultyObjects) => {
            const UPPERLIMIT = 80 - 6 * OVERALLDIFFICULTY;;
            const LOWERLIMIT = UPPERLIMIT / 2;
            const MSLIMIT = 300;
            const getSpeed = (duration) => {
                if (duration > MSLIMIT)
                    return MSLIMIT / duration;
                else
                    return ((MSLIMIT / duration - 1) / 2) + 1;
            }

            let speed = [];
            if (difficultyObjects.length > 0)
                speed.push(1);
            let lastIndex = 0;
            for (let i = 1; i < difficultyObjects.length; ++i) {
                if (difficultyObjects[i].startTime - difficultyObjects[lastIndex].startTime == 0) {
                    speed.push(1);
                    continue;
                }
                let individualSpeed = Math.max(difficultyObjects[i].startTime - difficultyObjects[lastIndex].startTime, 0);
                let samePosition = true;
                if (difficultyObjects[i].type.includes("chord") || difficultyObjects[lastIndex].type.includes("chord"))
                    samePosition = false;
                else if (difficultyObjects[i].keyPosition.row != difficultyObjects[lastIndex].keyPosition.row
                    || difficultyObjects[i].keyPosition.column != difficultyObjects[lastIndex].keyPosition.column)
                    samePosition = false;
                if (individualSpeed < LOWERLIMIT && !samePosition) {
                    speed.push(1);
                }
                else if (individualSpeed < UPPERLIMIT && !samePosition) {
                    let amount = getSpeed(UPPERLIMIT) - 1;
                    let percentage = Math.pow((individualSpeed - LOWERLIMIT) / LOWERLIMIT, 0.5);
                    speed.push(1 + amount * percentage);
                }
                else {
                    speed.push(getSpeed(individualSpeed));
                }
                //speed.push(1);
                lastIndex = i;
            }
            return speed;
        }

        const calculateDifficultySum = (difficultyObjects, drainTime, noteMultipliers) => {

            if (difficultyObjects.length == 0)
                return { difficultySum: 0 };

            let difficulties = [];
            let difficultySum = 0;
            for (let i = 0; i < difficultyObjects.length; ++i) {
                let calculatedDifficulty = 0;
                if (difficultyObjects[i].type.includes("mixedchord")) {
                    chordDifficulty = 0;
                    for (let j = 0; j < difficultyObjects[i].keyTypes.length; ++j) {
                        if (difficultyObjects[i].keyTypes[j] == "tap")
                            chordDifficulty += TAPNOTEDIFFICULTY;
                        if (difficultyObjects[i].keyTypes[j] == "hold")
                            chordDifficulty += HOLDNOTEDIFFICULTY;
                        if (difficultyObjects[i].keyTypes[j] == "release")
                            chordDifficulty += RELEASEDIFFICULTY;
                    }
                    calculatedDifficulty += chordDifficulty;
                }
                if (difficultyObjects[i].type.includes("chord") && !difficultyObjects[i].type.includes("mixedchord")) {
                    chordDifficulty = 1
                    if (difficultyObjects[i].type.includes("tap"))
                        chordDifficulty = TAPNOTEDIFFICULTY;
                    if (difficultyObjects[i].type.includes("hold"))
                        chordDifficulty = HOLDNOTEDIFFICULTY;
                    if (difficultyObjects[i].type.includes("release"))
                        chordDifficulty = RELEASEDIFFICULTY;
                    calculatedDifficulty += chordDifficulty * difficultyObjects[i].keyPositions.length;
                }
                if (difficultyObjects[i].type == "tap")
                    calculatedDifficulty = TAPNOTEDIFFICULTY;
                if (difficultyObjects[i].type == "hold")
                    calculatedDifficulty = HOLDNOTEDIFFICULTY;
                if (difficultyObjects[i].type == "release")
                    calculatedDifficulty = RELEASEDIFFICULTY;
                let multipliedDifficulty = calculatedDifficulty;
                for (let j = 0; j < noteMultipliers.length; ++j) {
                    multipliedDifficulty *= noteMultipliers[j][i];
                }
                difficulties.push(multipliedDifficulty);
                //difficultySum += multipliedDifficulty;
            }
            sortArray(difficulties, (x, y) => { return x < y });
            for (let i = 0; i < difficulties.length; ++i) {
                difficultySum += difficulties[i] * Math.pow(0.992, i);
            }

            return { difficultySum: difficultySum };
        };

        const countNumberOfObjects = (difficultyObjects) => {
            let counterNames = ["tap", "hold", "release", "tapchord", "holdchord", "releasechord", "mixedchord"]
            let counters = []
            for (let i = 0; i < counterNames.length; ++i) {
                counters.push(0)
            }
            for (let i = 0; i < difficultyObjects.length; ++i) {
                if (counterNames.includes(difficultyObjects[i].type)) {
                    counters[counterNames.indexOf(difficultyObjects[i].type)]++
                }
                else {
                    console.log(difficultyObjects[i].type)
                }
            }
            return counters
        }
        const countNumberOfDurations = (difficultyObjects) => {
            let counterNames = [
                (one) => { return one < 10 },
                (one) => { return one < 20 && one >= 10 },
                (one) => { return one < 30 && one >= 20 },
                (one) => { return one < 40 && one >= 30 },
                (one) => { return one < 50 && one >= 40 },
                (one) => { return one < 60 && one >= 50 },
                (one) => { return one < 80 && one >= 60 },
                (one) => { return one < 100 && one >= 80 },
                (one) => { return one < 150 && one >= 100 },
                (one) => { return one < 300 && one >= 150 },
                (one) => { return one < 500 && one >= 300 },
                (one) => { return one >= 500 },
            ]
            let counters = []
            for (let i = 0; i < counterNames.length; ++i) {
                counters.push(0)
            }
            for (let i = 1; i < difficultyObjects.length; ++i) {
                for (let j = 0; j < counterNames.length; ++j) {
                    if (counterNames[j](difficultyObjects[i].startTime - difficultyObjects[i - 1].startTime)) {
                        counters[j]++;
                    }
                }
            }
            return counters
        }

        const countNumberOfDistances = (difficultyObjects) => {
            let counterNames = [
                (one) => { return one < 2 },
                (one) => { return one < 3 && one >= 2 },
                (one) => { return one < 4 && one >= 3 },
                (one) => { return one < 5 && one >= 4 },
                (one) => { return one < 6 && one >= 5 },
                (one) => { return one < 7 && one >= 6 },
                (one) => { return one < 8 && one >= 7 },
                (one) => { return one < 10 && one >= 8 },
                (one) => { one >= 10 },
            ]
            let counters = []
            for (let i = 0; i < counterNames.length; ++i) {
                counters.push(0)
            }
            for (let i = 1; i < difficultyObjects.length; ++i) {
                for (let j = 0; j < counterNames.length; ++j) {
                    if (counterNames[j](distanceBetweenObjects(difficultyObjects[i], difficultyObjects[i - 1]))) {
                        counters[j]++;
                    }
                }
            }
            return counters
        }





        let filteredNotes = [];

        //first we filter out anything that is currently not handled by the rework
        for (let i = 0; i < scoreData.notes.length; ++i) {
            if (scoreData.notes[i].type == "tap") {
                if (getKeyboardColumn(scoreData.notes[i].key) == -1)
                    continue;
                let tempNote = {
                    id: i,
                    key: scoreData.notes[i].key,
                    startTime: scoreData.notes[i].startTime * 1000,
                    type: scoreData.notes[i].type,
                }
                filteredNotes.push(tempNote);
            }
            else if (scoreData.notes[i].type == "hold") {
                if (getKeyboardColumn(scoreData.notes[i].key) == -1)
                    continue;
                let tempHoldNote = {
                    id: i,
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
            let tempTypingSection = {
                endTime: scoreData.typingSections[i].endTime * 1000,
                startTime: scoreData.typingSections[i].startTime * 1000,
                text: scoreData.typingSections[i].text,
                type: "typingsection",
            }
            if (tempTypingSection.text !== undefined)
                filteredTypingSections.push(tempTypingSection);

        }
        const notes = filteredNotes;
        const typingSections = filteredTypingSections;

        //Sort typingSections
        //for (let i = 0; i < typingSections.length - 1; ++i) {
        //    for (let j = i + 1; j < typingSections.length; ++j) {
        //        if (getStartTime(typingSections[i]) > getStartTime(typingSections[j])) {
        //            let temp = copyObject(typingSections[i]);
        //            typingSections[i] = copyObject(typingSections[j]);
        //            typingSections[j].type = temp;
        //        }
        //    }
        //}

        //start the conversion of placed objects into a more calculation friendly form
        let convertedNoteObjects = [];
        for (let i = 0; i < notes.length; ++i) {
            let selectedNote = notes[i];

            let tempConvertedNote = createNewTempConvertedNote(selectedNote);
            if (tempConvertedNote.keyPosition.column == -1)
                continue;

            if (selectedNote.type == "hold") {
                tempConvertedNote.endTime = getStartTime(selectedNote);
                convertedNoteObjects.push(tempConvertedNote);

                tempConvertedNote = createNewTempConvertedNote(selectedNote);
                tempConvertedNote.type = "release";
                tempConvertedNote.startTime = getEndTime(selectedNote);
            }
            convertedNoteObjects.push(tempConvertedNote);
        }
        sortArray(convertedNoteObjects, (one, two) => {
            return one.startTime > two.startTime;
        })




        let mergedNoteObjects = [];
        let merger = 0;

        for (let convertedIndexer = 1; convertedIndexer < convertedNoteObjects.length; ++convertedIndexer) {
            let previousMerger = merger;
            if (convertedNoteObjects[merger].startTime != convertedNoteObjects[convertedIndexer].startTime) {
                merger = convertedIndexer;
            }
            if (previousMerger != merger) {
                if (merger - previousMerger == 1) {
                    mergedNoteObjects.push(convertedNoteObjects[previousMerger]);
                }
                else {
                    let mergedNotes = [];
                    for (let i = previousMerger; i < merger; ++i) {
                        mergedNotes.push(convertedNoteObjects[i]);
                    }
                    if (mergedNotes.length == 0) {

                    }
                    else if (mergedNotes.length == 1) {
                        mergedNoteObjects.push(mergedNotes[0]);
                    }
                    else {
                        mergedNoteObjects.push(createMergedNoteObject(mergedNotes, 0, mergedNotes.length));
                    }
                }
            }
        }

        while (merger < convertedNoteObjects.length) {
            mergedNoteObjects.push(convertedNoteObjects[merger]);
            merger++;
        }





        let coordinates = [
            [0, 56, 33, 21, 23, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 75, 44, 2, 21, 4, 2, 2, 2, 0, 0.39],
[0, 56, 33, 21, 23, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 14, 61, 44, 2, 21, 4, 2, 2, 2, 0, 0.60],
[0, 56, 33, 21, 23, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 75, 44, 2, 21, 4, 2, 2, 2, 0, 0.28],
[1, 303, 244, 25, 25, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 58, 200, 34, 209, 30, 43, 6, 10, 6, 3, 3, 2.21],
[1, 303, 244, 25, 25, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 58, 200, 5, 29, 209, 30, 43, 6, 10, 6, 3, 3, 3.26],
[1, 303, 244, 25, 25, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 58, 2, 232, 209, 30, 43, 6, 10, 6, 3, 3, 1.64],
[0, 600, 488, 8, 8, 50, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 111, 281, 144, 20, 250, 202, 34, 13, 19, 21, 7, 11, 4.41],
[0, 600, 488, 8, 8, 50, 0, 0, 4, 1, 0, 0, 0, 0, 0, 111, 0, 281, 144, 13, 7, 250, 202, 34, 13, 19, 21, 7, 11, 6.55],
[0, 600, 488, 8, 8, 50, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 111, 281, 33, 131, 250, 202, 34, 13, 19, 21, 7, 11, 3.27],
[0, 58, 42, 14, 10, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 52, 33, 13, 5, 5, 6, 3, 0, 4, 0.72],
[0, 58, 42, 14, 10, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 27, 41, 33, 13, 5, 5, 6, 3, 0, 4, 1.13],
[0, 58, 42, 14, 10, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 68, 33, 13, 5, 5, 6, 3, 0, 4, 0.50],
[0, 90, 64, 5, 5, 0, 9, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 34, 71, 12, 5, 2, 2, 1, 1, 0, 1.40],
[0, 90, 64, 5, 5, 0, 9, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 49, 25, 71, 12, 5, 2, 2, 1, 1, 0, 2.16],
[0, 90, 64, 5, 5, 0, 9, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 74, 71, 12, 5, 2, 2, 1, 1, 0, 0.98],
[0, 112, 40, 9, 14, 19, 6, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 31, 66, 20, 9, 3, 1, 1, 0, 0, 1.55],
[0, 112, 40, 9, 14, 19, 6, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 58, 19, 66, 20, 9, 3, 1, 1, 0, 0, 2.36],
[0, 112, 40, 9, 14, 19, 6, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 77, 66, 20, 9, 3, 1, 1, 0, 0, 1.10],
[0, 181, 114, 12, 2, 17, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 0, 58, 31, 55, 21, 130, 17, 8, 7, 1, 1, 1, 0, 2.56],
[0, 181, 114, 12, 2, 17, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 58, 0, 42, 51, 14, 130, 17, 8, 7, 1, 1, 1, 0, 4.14],
[0, 181, 114, 12, 2, 17, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 58, 42, 65, 130, 17, 8, 7, 1, 1, 1, 0, 1.78],
[0, 705, 537, 30, 26, 48, 9, 10, 12, 1, 0, 17, 2, 0, 2, 6, 0, 86, 319, 157, 81, 366, 81, 102, 58, 41, 6, 10, 7, 4.05],
[0, 705, 537, 30, 26, 48, 9, 10, 12, 1, 17, 2, 2, 6, 0, 56, 30, 305, 171, 40, 41, 366, 81, 102, 58, 41, 6, 10, 7, 5.92],
[0, 705, 537, 30, 26, 48, 9, 10, 12, 1, 0, 0, 17, 2, 0, 2, 6, 56, 335, 57, 195, 366, 81, 102, 58, 41, 6, 10, 7, 3.02],
[0, 72, 40, 10, 10, 7, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 13, 3, 57, 65, 4, 3, 2, 0, 0, 0, 0, 1.16],
[0, 72, 40, 10, 10, 7, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 16, 56, 1, 65, 4, 3, 2, 0, 0, 0, 0, 1.85],
[0, 72, 40, 10, 10, 7, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 60, 65, 4, 3, 2, 0, 0, 0, 0, 0.80],
[0, 129, 87, 7, 4, 12, 4, 4, 3, 1, 0, 0, 0, 0, 0, 0, 0, 10, 90, 0, 19, 64, 29, 12, 5, 3, 3, 2, 2, 2.43],
[0, 129, 87, 7, 4, 12, 4, 4, 3, 1, 0, 0, 0, 0, 0, 0, 10, 0, 90, 19, 0, 64, 29, 12, 5, 3, 3, 2, 2, 3.80],
[0, 129, 87, 7, 4, 12, 4, 4, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 10, 90, 19, 64, 29, 12, 5, 3, 3, 2, 2, 1.72],
[0, 242, 128, 12, 3, 41, 2, 1, 7, 1, 0, 0, 0, 0, 0, 0, 0, 132, 55, 2, 3, 83, 32, 10, 8, 42, 6, 6, 6, 4.61],
[0, 242, 128, 12, 3, 41, 2, 1, 7, 1, 0, 0, 0, 0, 0, 0, 132, 0, 57, 2, 1, 83, 32, 10, 8, 42, 6, 6, 6, 8.11],
[0, 242, 128, 12, 3, 41, 2, 1, 7, 1, 0, 0, 0, 0, 0, 0, 0, 0, 132, 55, 5, 83, 32, 10, 8, 42, 6, 6, 6, 3.29],
[0, 268, 113, 0, 0, 48, 9, 2, 22, 1, 0, 0, 0, 0, 0, 0, 0, 129, 59, 0, 4, 111, 8, 26, 6, 14, 13, 10, 5, 5.30],
[0, 268, 113, 0, 0, 48, 9, 2, 22, 1, 0, 0, 0, 0, 0, 0, 129, 2, 57, 3, 1, 111, 8, 26, 6, 14, 13, 10, 5, 8.25],
[0, 268, 113, 0, 0, 48, 9, 2, 22, 1, 0, 0, 0, 0, 0, 0, 0, 0, 131, 57, 4, 111, 8, 26, 6, 14, 13, 10, 5, 3.94],
[0, 424, 189, 8, 1, 62, 4, 3, 17, 6, 0, 0, 0, 0, 0, 88, 0, 160, 27, 0, 2, 145, 46, 44, 7, 11, 11, 12, 7, 10.10],
[0, 424, 189, 8, 1, 62, 4, 3, 17, 6, 0, 0, 0, 85, 3, 0, 160, 4, 23, 1, 1, 145, 46, 44, 7, 11, 11, 12, 7, 16.86],
[0, 424, 189, 8, 1, 62, 4, 3, 17, 6, 0, 0, 0, 0, 0, 0, 85, 3, 164, 23, 2, 145, 46, 44, 7, 11, 11, 12, 7, 7.78],
[0, 87, 69, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 37, 21, 91, 10, 1, 0, 2, 0, 0, 0, 1.58],
[0, 87, 69, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 37, 15, 6, 91, 10, 1, 0, 2, 0, 0, 0, 2.48],
[0, 87, 69, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 58, 91, 10, 1, 0, 2, 0, 0, 0, 1.07],
[0, 91, 77, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 37, 21, 84, 13, 1, 0, 2, 0, 4, 0, 1.71],
[0, 91, 77, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 37, 15, 6, 84, 13, 1, 0, 2, 0, 4, 0, 2.63],
[0, 91, 77, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 58, 84, 13, 1, 0, 2, 0, 4, 0, 1.19],
[0, 101, 68, 7, 7, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 38, 20, 79, 10, 5, 1, 0, 4, 4, 4, 2.00],
[0, 101, 68, 7, 7, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 38, 16, 4, 79, 10, 5, 1, 0, 4, 4, 4, 3.02],
[0, 101, 68, 7, 7, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 0, 58, 79, 10, 5, 1, 0, 4, 4, 4, 1.42],
[0, 110, 90, 6, 5, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 38, 13, 70, 19, 13, 2, 4, 3, 3, 0, 2.14],
[0, 110, 90, 6, 5, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 63, 38, 0, 13, 70, 19, 13, 2, 4, 3, 3, 0, 3.22],
[0, 110, 90, 6, 5, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 51, 70, 19, 13, 2, 4, 3, 3, 0, 1.52],
[0, 107, 72, 9, 9, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 49, 38, 20, 95, 1, 2, 2, 1, 0, 8, 6, 2.20],
[0, 107, 72, 9, 9, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 8, 0, 49, 38, 16, 4, 95, 1, 2, 2, 1, 0, 8, 6, 3.32],
[0, 107, 72, 9, 9, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 49, 8, 50, 95, 1, 2, 2, 1, 0, 8, 6, 1.58],
[0, 130, 92, 38, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 167, 108, 13, 27, 11, 8, 0, 0, 0, 0.78],
[0, 130, 92, 38, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 117, 108, 13, 27, 11, 8, 0, 0, 0, 1.13],
[0, 130, 92, 38, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 167, 108, 13, 27, 11, 8, 0, 0, 0, 0.59],
[0, 197, 126, 71, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 201, 212, 29, 17, 0, 4, 5, 0, 0, 1.25],
[0, 197, 126, 71, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 138, 63, 212, 29, 17, 0, 4, 5, 0, 0, 1.80],
[0, 197, 126, 71, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 201, 212, 29, 17, 0, 4, 5, 0, 0, 0.95],
[0, 399, 286, 113, 113, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 357, 21, 64, 410, 41, 26, 20, 7, 3, 4, 0, 2.60],
[0, 399, 286, 113, 113, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 0, 378, 47, 17, 410, 41, 26, 20, 7, 3, 4, 0, 3.74],
[0, 399, 286, 113, 113, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 357, 85, 410, 41, 26, 20, 7, 3, 4, 0, 2.01],
[0, 645, 356, 56, 39, 95, 9, 9, 17, 0, 0, 0, 0, 0, 0, 0, 0, 87, 432, 15, 46, 260, 185, 48, 27, 24, 20, 14, 2, 4.26],
[0, 645, 356, 56, 39, 95, 9, 9, 17, 0, 0, 0, 0, 0, 0, 0, 87, 0, 447, 32, 14, 260, 185, 48, 27, 24, 20, 14, 2, 6.15],
[0, 645, 356, 56, 39, 95, 9, 9, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 432, 61, 260, 185, 48, 27, 24, 20, 14, 2, 3.31],
[0, 915, 354, 43, 16, 163, 31, 23, 45, 0, 0, 0, 0, 0, 0, 0, 0, 196, 445, 4, 29, 351, 127, 61, 58, 33, 29, 8, 7, 6.00],
[0, 915, 354, 43, 16, 163, 31, 23, 45, 0, 0, 0, 0, 0, 0, 0, 196, 0, 449, 24, 5, 351, 127, 61, 58, 33, 29, 8, 7, 8.75],
[0, 915, 354, 43, 16, 163, 31, 23, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 196, 445, 33, 351, 127, 61, 58, 33, 29, 8, 7, 4.71],
[3, 602, 372, 107, 49, 5, 1, 1, 111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 413, 228, 551, 53, 12, 5, 7, 3, 9, 5, 2.11],
[3, 602, 372, 107, 49, 5, 1, 1, 111, 0, 0, 0, 0, 0, 0, 0, 0, 4, 412, 89, 140, 551, 53, 12, 5, 7, 3, 9, 5, 2.88],
[3, 602, 372, 107, 49, 5, 1, 1, 111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 412, 229, 551, 53, 12, 5, 7, 3, 9, 5, 1.69],
[3, 76, 70, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 2, 41, 55, 9, 9, 4, 4, 0, 0, 0, 1.23],
[3, 76, 70, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 36, 5, 55, 9, 9, 4, 4, 0, 0, 0, 1.94],
[3, 76, 70, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 43, 55, 9, 9, 4, 4, 0, 0, 0, 0.87],
[3, 108, 82, 12, 10, 6, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 7, 90, 0, 14, 52, 12, 21, 3, 7, 6, 2, 8, 1.90],
[3, 108, 82, 12, 10, 6, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 7, 0, 90, 8, 6, 52, 12, 21, 3, 7, 6, 2, 8, 2.91],
[3, 108, 82, 12, 10, 6, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 90, 14, 52, 12, 21, 3, 7, 6, 2, 8, 1.36],
[0, 75, 44, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 100, 93, 0, 2, 0, 1, 6, 2, 1, 0.76],
[0, 75, 44, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 63, 38, 93, 0, 2, 0, 1, 6, 2, 1, 1.20],
[0, 75, 44, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 105, 93, 0, 2, 0, 1, 6, 2, 1, 0.52],
[0, 103, 36, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 68, 17, 84, 151, 8, 6, 1, 2, 1, 0, 0, 1.13],
[0, 103, 36, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84, 68, 17, 151, 8, 6, 1, 2, 1, 0, 0, 1.78],
[0, 103, 36, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 100, 151, 8, 6, 1, 2, 1, 0, 0, 0.79],
[0, 153, 104, 47, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 115, 18, 64, 165, 10, 12, 4, 2, 1, 3, 1, 1.80],
[0, 153, 104, 47, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 132, 53, 12, 165, 10, 12, 4, 2, 1, 3, 1, 2.82],
[0, 153, 104, 47, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 116, 81, 165, 10, 12, 4, 2, 1, 3, 1, 1.29],
[0, 293, 164, 51, 39, 31, 0, 4, 12, 1, 0, 0, 0, 0, 0, 0, 0, 65, 204, 13, 17, 217, 14, 11, 19, 14, 3, 16, 6, 3.38],
[0, 293, 164, 51, 39, 31, 0, 4, 12, 1, 0, 0, 0, 0, 0, 0, 65, 0, 217, 12, 5, 217, 14, 11, 19, 14, 3, 16, 6, 5.49],
[0, 293, 164, 51, 39, 31, 0, 4, 12, 1, 0, 0, 0, 0, 0, 0, 0, 0, 65, 204, 30, 217, 14, 11, 19, 14, 3, 16, 6, 2.46],
[0, 459, 358, 2, 2, 43, 3, 1, 4, 3, 0, 0, 0, 0, 0, 0, 0, 286, 96, 10, 17, 144, 78, 67, 40, 28, 25, 12, 18, 6.04],
[0, 459, 358, 2, 2, 43, 3, 1, 4, 3, 0, 0, 0, 0, 0, 0, 286, 0, 106, 13, 4, 144, 78, 67, 40, 28, 25, 12, 18, 10.45],
[0, 459, 358, 2, 2, 43, 3, 1, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 286, 96, 27, 144, 78, 67, 40, 28, 25, 12, 18, 4.24],
[0, 838, 511, 15, 14, 96, 25, 20, 15, 2, 0, 0, 0, 0, 0, 328, 0, 310, 47, 4, 4, 377, 29, 29, 57, 47, 56, 48, 52, 11.75],
[0, 838, 511, 15, 14, 96, 25, 20, 15, 2, 0, 0, 0, 328, 0, 0, 310, 0, 51, 2, 2, 377, 29, 29, 57, 47, 56, 48, 52, 19.57],
[0, 838, 511, 15, 14, 96, 25, 20, 15, 2, 0, 0, 0, 0, 0, 0, 328, 0, 310, 47, 8, 377, 29, 29, 57, 47, 56, 48, 52, 8.35],
[0, 922, 492, 2, 0, 97, 43, 0, 81, 2, 0, 0, 0, 0, 0, 358, 0, 295, 55, 0, 4, 288, 79, 67, 84, 46, 74, 30, 46, 12.69],
[0, 922, 492, 2, 0, 97, 43, 0, 81, 2, 0, 0, 0, 358, 0, 0, 295, 0, 55, 4, 0, 288, 79, 67, 84, 46, 74, 30, 46, 19.18],
[0, 922, 492, 2, 0, 97, 43, 0, 81, 2, 0, 0, 0, 0, 0, 0, 358, 0, 295, 55, 4, 288, 79, 67, 84, 46, 74, 30, 46, 9.26],
[0, 1182, 686, 68, 47, 126, 25, 15, 44, 0, 0, 0, 0, 0, 0, 0, 470, 0, 350, 174, 16, 581, 178, 95, 72, 45, 16, 13, 10, 9.05],
[0, 1182, 686, 68, 47, 126, 25, 15, 44, 0, 0, 0, 0, 0, 0, 470, 0, 346, 178, 1, 15, 581, 178, 95, 72, 45, 16, 13, 10, 15.12],
[0, 1182, 686, 68, 47, 126, 25, 15, 44, 0, 0, 0, 0, 0, 0, 0, 0, 470, 346, 4, 190, 581, 178, 95, 72, 45, 16, 13, 10, 6.22],
[0, 746, 237, 20, 9, 140, 20, 15, 53, 0, 0, 0, 0, 0, 0, 24, 0, 4, 198, 222, 45, 198, 114, 68, 33, 30, 19, 14, 17, 5.31],
[0, 746, 237, 20, 9, 140, 20, 15, 53, 0, 0, 0, 0, 10, 14, 3, 68, 129, 205, 51, 13, 198, 114, 68, 33, 30, 19, 14, 17, 8.24],
[0, 746, 237, 20, 9, 140, 20, 15, 53, 0, 0, 0, 0, 0, 0, 0, 10, 17, 197, 201, 68, 198, 114, 68, 33, 30, 19, 14, 17, 3.97],
[1, 78, 76, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 47, 15, 14, 21, 7, 4, 3, 3, 12, 0.78],
[1, 78, 76, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 47, 15, 14, 21, 7, 4, 3, 3, 12, 1.23],
[1, 78, 76, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 15, 14, 21, 7, 4, 3, 3, 12, 0.55],
[1, 115, 113, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 71, 25, 44, 35, 4, 9, 3, 0, 1, 20, 1.25],
[1, 115, 113, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 75, 21, 44, 35, 4, 9, 3, 0, 1, 20, 1.91],
[1, 115, 113, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 96, 44, 35, 4, 9, 3, 0, 1, 20, 0.89],
[1, 156, 86, 4, 0, 33, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 69, 23, 40, 17, 4, 50, 11, 0, 0, 2, 1.74],
[1, 156, 86, 4, 0, 33, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 73, 19, 40, 17, 4, 50, 11, 0, 0, 2, 2.61],
[1, 156, 86, 4, 0, 33, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 92, 40, 17, 4, 50, 11, 0, 0, 2, 1.27],
[0, 54, 38, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 63, 52, 3, 3, 2, 5, 1, 3, 0, 0.90],
[0, 54, 38, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 61, 2, 52, 3, 3, 2, 5, 1, 3, 0, 1.39],
[0, 54, 38, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 63, 52, 3, 3, 2, 5, 1, 3, 0, 0.63],
[0, 80, 39, 37, 37, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 98, 0, 16, 73, 4, 2, 4, 3, 5, 11, 12, 1.46],
[0, 80, 39, 37, 37, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 98, 15, 1, 73, 4, 2, 4, 3, 5, 11, 12, 2.24],
[0, 80, 39, 37, 37, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 98, 16, 73, 4, 2, 4, 3, 5, 11, 12, 1.04],
[0, 117, 89, 18, 18, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 20, 92, 0, 14, 58, 10, 8, 7, 9, 9, 8, 20, 2.32],
[0, 117, 89, 18, 18, 5, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 20, 3, 89, 13, 1, 58, 10, 8, 7, 9, 9, 8, 20, 3.54],
[0, 117, 89, 18, 18, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 23, 89, 14, 58, 10, 8, 7, 9, 9, 8, 20, 1.67],
[0, 190, 40, 12, 14, 65, 4, 3, 0, 1, 0, 0, 0, 0, 0, 11, 0, 20, 90, 0, 15, 66, 14, 7, 16, 7, 6, 17, 4, 3.69],
[0, 190, 40, 12, 14, 65, 4, 3, 0, 1, 0, 0, 0, 11, 0, 0, 20, 3, 87, 13, 2, 66, 14, 7, 16, 7, 6, 17, 4, 5.61],
[0, 190, 40, 12, 14, 65, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 11, 0, 23, 87, 15, 66, 14, 7, 16, 7, 6, 17, 4, 2.69],
[1, 360, 86, 8, 3, 88, 7, 3, 21, 2, 0, 0, 0, 0, 0, 8, 0, 108, 86, 0, 11, 102, 47, 18, 11, 18, 13, 5, 1, 6.00],
[1, 360, 86, 8, 3, 88, 7, 3, 21, 2, 0, 0, 0, 8, 0, 0, 108, 0, 86, 9, 2, 102, 47, 18, 11, 18, 13, 5, 1, 9.19],
[1, 360, 86, 8, 3, 88, 7, 3, 21, 2, 0, 0, 0, 0, 0, 0, 8, 0, 108, 86, 11, 102, 47, 18, 11, 18, 13, 5, 1, 4.45],
[0, 70, 34, 25, 25, 1, 4, 4, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 76, 59, 15, 10, 5, 2, 1, 0, 0, 0.78],
[0, 70, 34, 25, 25, 1, 4, 4, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 14, 17, 59, 59, 15, 10, 5, 2, 1, 0, 0, 1.20],
[0, 70, 34, 25, 25, 1, 4, 4, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 76, 59, 15, 10, 5, 2, 1, 0, 0, 0.55],
[0, 36, 24, 8, 8, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 17, 7, 12, 2, 2, 1, 1, 0, 0.34],
[0, 36, 24, 8, 8, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 40, 17, 7, 12, 2, 2, 1, 1, 0, 0.55],
[0, 36, 24, 8, 8, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 17, 7, 12, 2, 2, 1, 1, 0, 0.23],
[1, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 40, 38, 20, 2, 2, 2, 0, 0, 0, 0.91],
[1, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 36, 4, 38, 20, 2, 2, 2, 0, 0, 0, 1.49],
[1, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 40, 38, 20, 2, 2, 2, 0, 0, 0, 0.61],
[1, 60, 51, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 51, 32, 14, 14, 1, 1, 1, 4, 1, 0.83],
[1, 60, 51, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 47, 4, 32, 14, 14, 1, 1, 1, 4, 1, 1.33],
[1, 60, 51, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 51, 32, 14, 14, 1, 1, 1, 4, 1, 0.56],
[1, 89, 59, 30, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 78, 13, 88, 17, 8, 1, 3, 1, 0, 0, 1.28],
[1, 89, 59, 30, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 78, 5, 8, 88, 17, 8, 1, 3, 1, 0, 0, 2.08],
[1, 89, 59, 30, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 78, 13, 88, 17, 8, 1, 3, 1, 0, 0, 0.88],
[1, 99, 63, 28, 28, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 63, 22, 70, 30, 9, 7, 6, 0, 0, 0, 1.42],
[1, 99, 63, 28, 28, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 63, 14, 8, 70, 30, 9, 7, 6, 0, 0, 0, 2.32],
[1, 99, 63, 28, 28, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 63, 22, 70, 30, 9, 7, 6, 0, 0, 0, 0.98],
[6, 232, 104, 120, 120, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 314, 37, 276, 41, 17, 8, 6, 1, 1, 1, 1.41],
[6, 232, 104, 120, 120, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 314, 19, 18, 276, 41, 17, 8, 6, 1, 1, 1, 2.15],
[6, 232, 104, 120, 120, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 314, 37, 276, 41, 17, 8, 6, 1, 1, 1, 1.05],
[4, 341, 192, 107, 107, 11, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 331, 18, 323, 57, 16, 10, 14, 9, 5, 2, 2.28],
[4, 341, 192, 107, 107, 11, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 333, 5, 13, 323, 57, 16, 10, 14, 9, 5, 2, 3.41],
[4, 341, 192, 107, 107, 11, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 333, 18, 323, 57, 16, 10, 14, 9, 5, 2, 1.74],
[0, 61, 51, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 54, 15, 0, 0, 0, 0, 0, 1, 0.73],
[0, 61, 51, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 22, 54, 15, 0, 0, 0, 0, 0, 1, 1.15],
[0, 61, 51, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 54, 15, 0, 0, 0, 0, 0, 1, 0.49],
[0, 77, 65, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 19, 68, 74, 10, 0, 0, 0, 1, 2, 1, 1.00],
[0, 77, 65, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 54, 14, 74, 10, 0, 0, 0, 1, 2, 1, 1.57],
[0, 77, 65, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 68, 74, 10, 0, 0, 0, 1, 2, 1, 0.70],
[0, 92, 56, 24, 18, 2, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 49, 56, 64, 29, 9, 3, 2, 0, 0, 0, 1.21],
[0, 92, 56, 24, 18, 2, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 50, 42, 14, 64, 29, 9, 3, 2, 0, 0, 0, 1.83],
[0, 92, 56, 24, 18, 2, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 56, 64, 29, 9, 3, 2, 0, 0, 0, 0.86],
[1, 122, 40, 8, 2, 24, 2, 2, 20, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 25, 70, 47, 24, 12, 7, 4, 3, 0, 0, 1.48],
[1, 122, 40, 8, 2, 24, 2, 2, 20, 1, 0, 0, 0, 0, 0, 0, 0, 0, 26, 58, 12, 47, 24, 12, 7, 4, 3, 0, 0, 2.22],
[1, 122, 40, 8, 2, 24, 2, 2, 20, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 70, 47, 24, 12, 7, 4, 3, 0, 0, 1.07],
[1, 152, 62, 28, 19, 4, 7, 0, 39, 0, 0, 0, 0, 0, 38, 0, 1, 33, 2, 30, 54, 79, 28, 22, 12, 10, 6, 1, 0, 2.13],
[1, 152, 62, 28, 19, 4, 7, 0, 39, 0, 0, 0, 38, 0, 0, 34, 0, 0, 32, 38, 16, 79, 28, 22, 12, 10, 6, 1, 0, 3.30],
[1, 152, 62, 28, 19, 4, 7, 0, 39, 0, 0, 0, 0, 0, 0, 38, 0, 34, 0, 32, 54, 79, 28, 22, 12, 10, 6, 1, 0, 1.50],
[0, 337, 252, 37, 37, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 229, 115, 1, 214, 53, 32, 14, 16, 6, 14, 0, 2.95],
[0, 337, 252, 37, 37, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 229, 116, 0, 214, 53, 32, 14, 16, 6, 14, 0, 4.54],
[0, 337, 252, 37, 37, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 229, 116, 214, 53, 32, 14, 16, 6, 14, 0, 2.08],
[0, 557, 158, 10, 23, 66, 74, 24, 85, 1, 0, 0, 4, 0, 24, 0, 0, 16, 337, 53, 4, 238, 102, 54, 27, 10, 3, 1, 4, 5.46],
[0, 557, 158, 10, 23, 66, 74, 24, 85, 1, 0, 4, 24, 0, 0, 16, 0, 11, 341, 42, 0, 238, 102, 54, 27, 10, 3, 1, 4, 8.72],
[0, 557, 158, 10, 23, 66, 74, 24, 85, 1, 0, 0, 0, 0, 4, 24, 0, 0, 27, 326, 57, 238, 102, 54, 27, 10, 3, 1, 4, 3.71],
[0, 651, 333, 26, 24, 98, 20, 16, 21, 3, 0, 0, 0, 0, 40, 0, 0, 142, 312, 40, 0, 286, 97, 68, 31, 11, 20, 7, 17, 7.63],
[0, 651, 333, 26, 24, 98, 20, 16, 21, 3, 0, 0, 40, 0, 0, 142, 0, 7, 305, 40, 0, 286, 97, 68, 31, 11, 20, 7, 17, 12.08],
[0, 651, 333, 26, 24, 98, 20, 16, 21, 3, 0, 0, 0, 0, 0, 40, 0, 0, 149, 305, 40, 286, 97, 68, 31, 11, 20, 7, 17, 5.38],
[0, 634, 164, 26, 25, 143, 41, 41, 7, 0, 0, 0, 0, 0, 0, 0, 0, 12, 403, 31, 0, 193, 82, 68, 38, 23, 17, 18, 7, 5.53],
[0, 634, 164, 26, 25, 143, 41, 41, 7, 0, 0, 0, 0, 0, 0, 12, 0, 0, 403, 31, 0, 193, 82, 68, 38, 23, 17, 18, 7, 8.28],
[0, 634, 164, 26, 25, 143, 41, 41, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 403, 31, 193, 82, 68, 38, 23, 17, 18, 7, 4.06],
[0, 339, 325, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 89, 192, 71, 203, 80, 60, 6, 3, 0, 0, 0, 2.49],
[0, 339, 325, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 89, 192, 61, 10, 203, 80, 60, 6, 3, 0, 0, 0, 3.83],
[0, 339, 325, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 89, 0, 263, 203, 80, 60, 6, 3, 0, 0, 0, 1.75],
[0, 460, 440, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 298, 136, 45, 192, 146, 86, 31, 21, 3, 0, 0, 3.43],
[0, 460, 440, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 298, 136, 41, 4, 192, 146, 86, 31, 21, 3, 0, 0, 5.19],
[0, 460, 440, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 298, 0, 181, 192, 146, 86, 31, 21, 3, 0, 0, 2.50],
[0, 600, 493, 5, 5, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 429, 97, 27, 149, 167, 130, 51, 39, 12, 4, 1, 4.64],
[0, 600, 493, 5, 5, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 429, 97, 22, 5, 149, 167, 130, 51, 39, 12, 4, 1, 6.97],
[0, 600, 493, 5, 5, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 429, 0, 124, 149, 167, 130, 51, 39, 12, 4, 1, 3.42],
[0, 755, 493, 0, 0, 131, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 477, 95, 5, 144, 165, 124, 76, 58, 21, 23, 12, 5.92],
[0, 755, 493, 0, 0, 131, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 475, 97, 2, 3, 144, 165, 124, 76, 58, 21, 23, 12, 8.81],
[0, 755, 493, 0, 0, 131, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 475, 2, 100, 144, 165, 124, 76, 58, 21, 23, 12, 4.46],
[0, 1305, 749, 20, 5, 259, 0, 0, 17, 0, 0, 0, 0, 0, 0, 12, 0, 353, 541, 135, 8, 340, 376, 171, 78, 38, 20, 14, 12, 6.44],
[0, 1305, 749, 20, 5, 259, 0, 0, 17, 0, 0, 0, 0, 0, 12, 353, 0, 2, 543, 135, 4, 340, 376, 171, 78, 38, 20, 14, 12, 9.47],
[0, 1305, 749, 20, 5, 259, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 12, 355, 543, 139, 340, 376, 171, 78, 38, 20, 14, 12, 4.88],
[0, 532, 207, 48, 52, 96, 6, 4, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 277, 134, 15, 234, 81, 50, 18, 18, 16, 9, 0, 4.31],
[0, 532, 207, 48, 52, 96, 6, 4, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 277, 143, 6, 234, 81, 50, 18, 18, 16, 9, 0, 6.39],
[0, 532, 207, 48, 52, 96, 6, 4, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 277, 149, 234, 81, 50, 18, 18, 16, 9, 0, 3.13],
[0, 1062, 654, 43, 10, 143, 9, 9, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 726, 143, 47, 478, 340, 54, 17, 18, 3, 5, 1, 6.04],
[0, 1062, 654, 43, 10, 143, 9, 9, 49, 0, 0, 0, 0, 0, 0, 0, 0, 726, 143, 31, 16, 478, 340, 54, 17, 18, 3, 5, 1, 10.30],
[0, 1062, 654, 43, 10, 143, 9, 9, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 726, 143, 47, 478, 340, 54, 17, 18, 3, 5, 1, 4.60],
[1, 67, 63, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 38, 0, 28, 48, 16, 2, 2, 1, 1, 0, 0, 1.45],
[1, 67, 63, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 38, 25, 3, 48, 16, 2, 2, 1, 1, 0, 0, 2.22],
[1, 67, 63, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 38, 28, 48, 16, 2, 2, 1, 1, 0, 0, 1.03],
[0, 113, 111, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 54, 2, 12, 59, 51, 4, 0, 0, 0, 0, 0, 2.81],
[0, 113, 111, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 56, 10, 2, 59, 51, 4, 0, 0, 0, 0, 0, 4.54],
[0, 113, 111, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 54, 14, 59, 51, 4, 0, 0, 0, 0, 0, 2.04],
[0, 125, 124, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 54, 0, 11, 71, 46, 6, 0, 0, 0, 0, 2, 3.26],
[0, 125, 124, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 0, 54, 10, 1, 71, 46, 6, 0, 0, 0, 0, 2, 5.03],
[0, 125, 124, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 54, 11, 71, 46, 6, 0, 0, 0, 0, 2, 2.44],
[1, 32, 30, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 25, 23, 8, 0, 2, 0, 0, 0, 0, 0.56],
[1, 32, 30, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 11, 14, 23, 8, 0, 2, 0, 0, 0, 0, 0.90],
[1, 32, 30, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 25, 23, 8, 0, 2, 0, 0, 0, 0, 0.38],
[2, 156, 136, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 93, 44, 3, 1, 83, 43, 5, 3, 0, 1, 0, 10, 4.06],
[2, 156, 136, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 93, 0, 47, 0, 1, 83, 43, 5, 3, 0, 1, 0, 10, 6.36],
[2, 156, 136, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 93, 45, 3, 83, 43, 5, 3, 0, 1, 0, 10, 3.04],
[1, 32, 18, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 3, 2, 2, 0, 0, 0, 1, 0.52],
[1, 32, 18, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 43, 2, 37, 3, 2, 2, 0, 0, 0, 1, 0.83],
[1, 32, 18, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 3, 2, 2, 0, 0, 0, 1, 0.35],
[0, 40, 30, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 21, 20, 9, 9, 2, 3, 1, 5, 0, 0.73],
[0, 40, 30, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 21, 20, 9, 9, 2, 3, 1, 5, 0, 1.13],
[0, 40, 30, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 20, 9, 9, 2, 3, 1, 5, 0, 0.51],
[0, 73, 42, 19, 19, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 29, 8, 63, 5, 7, 9, 1, 0, 0, 0, 1.46],
[0, 73, 42, 19, 19, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 31, 6, 63, 5, 7, 9, 1, 0, 0, 0, 2.24],
[0, 73, 42, 19, 19, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 37, 63, 5, 7, 9, 1, 0, 0, 0, 1.03],
[0, 109, 89, 4, 0, 6, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 74, 21, 6, 80, 11, 7, 3, 0, 1, 0, 0, 2.52],
[0, 109, 89, 4, 0, 6, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 74, 26, 1, 80, 11, 7, 3, 0, 1, 0, 0, 3.78],
[0, 109, 89, 4, 0, 6, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 74, 27, 80, 11, 7, 3, 0, 1, 0, 0, 1.81],
[0, 169, 72, 3, 0, 32, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 6, 80, 19, 6, 31, 44, 12, 9, 5, 7, 3, 0, 3.47],
[0, 169, 72, 3, 0, 32, 1, 0, 4, 0, 0, 0, 0, 0, 0, 6, 0, 0, 80, 24, 1, 31, 44, 12, 9, 5, 7, 3, 0, 5.19],
[0, 169, 72, 3, 0, 32, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 80, 25, 31, 44, 12, 9, 5, 7, 3, 0, 2.53],
[0, 295, 257, 28, 28, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 158, 65, 34, 238, 39, 24, 7, 5, 2, 3, 1, 2.57],
[0, 295, 257, 28, 28, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 63, 11, 206, 18, 21, 238, 39, 24, 7, 5, 2, 3, 1, 4.15],
[0, 295, 257, 28, 28, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 74, 181, 64, 238, 39, 24, 7, 5, 2, 3, 1, 1.85],
[1, 599, 325, 35, 35, 106, 13, 13, 0, 3, 0, 0, 0, 0, 0, 0, 0, 278, 171, 57, 17, 271, 68, 66, 52, 49, 15, 1, 4, 4.83],
[1, 599, 325, 35, 35, 106, 13, 13, 0, 3, 0, 0, 0, 0, 0, 0, 285, 72, 147, 6, 13, 271, 68, 66, 52, 49, 15, 1, 4, 7.71],
[1, 599, 325, 35, 35, 106, 13, 13, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 357, 129, 37, 271, 68, 66, 52, 49, 15, 1, 4, 3.61],
[1, 702, 372, 25, 19, 130, 19, 18, 7, 4, 0, 0, 0, 0, 0, 0, 0, 299, 234, 47, 5, 279, 182, 50, 34, 22, 17, 2, 3, 6.02],
[1, 702, 372, 25, 19, 130, 19, 18, 7, 4, 0, 0, 0, 0, 0, 0, 308, 109, 163, 4, 1, 279, 182, 50, 34, 22, 17, 2, 3, 10.02],
[1, 702, 372, 25, 19, 130, 19, 18, 7, 4, 0, 0, 0, 0, 0, 0, 0, 0, 417, 158, 10, 279, 182, 50, 34, 22, 17, 2, 3, 4.43],
[1, 390, 203, 5, 5, 68, 3, 1, 24, 1, 0, 0, 0, 0, 0, 0, 0, 47, 207, 1, 52, 150, 50, 17, 17, 15, 9, 24, 26, 3.63],
[1, 390, 203, 5, 5, 68, 3, 1, 24, 1, 0, 0, 0, 0, 0, 0, 47, 0, 208, 51, 1, 150, 50, 17, 17, 15, 9, 24, 26, 5.57],
[1, 390, 203, 5, 5, 68, 3, 1, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 47, 207, 53, 150, 50, 17, 17, 15, 9, 24, 26, 2.69],
[0, 30, 10, 18, 18, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 25, 38, 8, 0, 0, 0, 0, 0, 0, 0.45],
[0, 30, 10, 18, 18, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 25, 38, 8, 0, 0, 0, 0, 0, 0, 0.72],
[0, 30, 10, 18, 18, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 38, 8, 0, 0, 0, 0, 0, 0, 0.30],
[0, 62, 28, 30, 30, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 9, 73, 18, 0, 0, 0, 0, 0, 0, 1.08],
[0, 62, 28, 30, 30, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 1, 8, 73, 18, 0, 0, 0, 0, 0, 0, 1.74],
[0, 62, 28, 30, 30, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 0, 46, 73, 18, 0, 0, 0, 0, 0, 0, 0.72],
[0, 115, 77, 32, 32, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 16, 11, 102, 13, 3, 117, 16, 2, 0, 5, 2, 1, 2, 2.37],
[0, 115, 77, 32, 32, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 27, 0, 86, 29, 1, 2, 117, 16, 2, 0, 5, 2, 1, 2, 3.83],
[0, 115, 77, 32, 32, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 86, 16, 16, 117, 16, 2, 0, 5, 2, 1, 2, 1.61],
[0, 248, 180, 0, 0, 34, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 60, 28, 118, 4, 2, 114, 0, 0, 0, 0, 0, 37, 62, 5.34],
[0, 248, 180, 0, 0, 34, 0, 0, 0, 1, 0, 0, 0, 0, 0, 88, 0, 99, 23, 0, 2, 114, 0, 0, 0, 0, 0, 37, 62, 9.93],
[0, 248, 180, 0, 0, 34, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 88, 99, 19, 6, 114, 0, 0, 0, 0, 0, 37, 62, 3.33],
[0, 396, 344, 12, 12, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 237, 87, 53, 256, 69, 12, 14, 4, 6, 3, 13, 3.19],
[0, 396, 344, 12, 12, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 237, 87, 38, 15, 256, 69, 12, 14, 4, 6, 3, 13, 5.22],
[0, 396, 344, 12, 12, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 237, 87, 53, 256, 69, 12, 14, 4, 6, 3, 13, 2.26],
[0, 556, 349, 10, 11, 74, 9, 9, 7, 3, 0, 0, 0, 0, 0, 0, 52, 0, 262, 118, 33, 293, 92, 18, 13, 21, 6, 14, 11, 4.64],
[0, 556, 349, 10, 11, 74, 9, 9, 7, 3, 0, 0, 0, 0, 52, 0, 0, 262, 118, 24, 9, 293, 92, 18, 13, 21, 6, 14, 11, 7.55],
[0, 556, 349, 10, 11, 74, 9, 9, 7, 3, 0, 0, 0, 0, 0, 0, 0, 52, 262, 118, 33, 293, 92, 18, 13, 21, 6, 14, 11, 3.29],
[0, 130, 82, 7, 10, 11, 9, 8, 0, 2, 0, 0, 0, 0, 0, 0, 0, 6, 56, 0, 62, 76, 14, 3, 5, 0, 5, 21, 2, 1.16],
[0, 130, 82, 7, 10, 11, 9, 8, 0, 2, 0, 0, 0, 0, 0, 0, 6, 0, 56, 33, 29, 76, 14, 3, 5, 0, 5, 21, 2, 1.82],
[0, 130, 82, 7, 10, 11, 9, 8, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 6, 56, 62, 76, 14, 3, 5, 0, 5, 21, 2, 0.82],
[0, 175, 44, 69, 72, 19, 11, 10, 0, 2, 0, 0, 0, 0, 0, 0, 0, 120, 56, 0, 46, 161, 3, 6, 6, 12, 15, 14, 7, 1.69],
[0, 175, 44, 69, 72, 19, 11, 10, 0, 2, 0, 0, 0, 0, 0, 0, 120, 0, 56, 19, 27, 161, 3, 6, 6, 12, 15, 14, 7, 2.65],
[0, 175, 44, 69, 72, 19, 11, 10, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 120, 56, 46, 161, 3, 6, 6, 12, 15, 14, 7, 1.23],
[0, 347, 147, 0, 5, 80, 2, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 33, 160, 4, 33, 122, 23, 11, 11, 11, 12, 22, 22, 3.51],
[0, 347, 147, 0, 5, 80, 2, 1, 0, 4, 0, 0, 0, 0, 0, 0, 33, 0, 164, 15, 18, 122, 23, 11, 11, 11, 12, 22, 22, 5.60],
[0, 347, 147, 0, 5, 80, 2, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 33, 160, 37, 122, 23, 11, 11, 11, 12, 22, 22, 2.61],
[1, 514, 103, 2, 8, 148, 5, 5, 1, 5, 0, 0, 0, 0, 0, 4, 0, 36, 199, 9, 18, 130, 40, 14, 16, 19, 16, 20, 16, 5.02],
[1, 514, 103, 2, 8, 148, 5, 5, 1, 5, 0, 0, 0, 4, 0, 0, 36, 0, 208, 10, 8, 130, 40, 14, 16, 19, 16, 20, 16, 7.76],
[1, 514, 103, 2, 8, 148, 5, 5, 1, 5, 0, 0, 0, 0, 0, 0, 4, 0, 36, 199, 27, 130, 40, 14, 16, 19, 16, 20, 16, 3.84],
[0, 179, 126, 38, 38, 0, 1, 1, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 196, 0, 19, 134, 30, 10, 8, 11, 5, 18, 0, 2.28],
[0, 179, 126, 38, 38, 0, 1, 1, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 196, 16, 3, 134, 30, 10, 8, 11, 5, 18, 0, 3.68],
[0, 179, 126, 38, 38, 0, 1, 1, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 196, 19, 134, 30, 10, 8, 11, 5, 18, 0, 1.57],
[1, 225, 146, 63, 61, 0, 0, 1, 15, 1, 0, 0, 0, 0, 0, 0, 0, 136, 128, 1, 19, 160, 60, 16, 18, 11, 6, 12, 2, 3.16],
[1, 225, 146, 63, 61, 0, 0, 1, 15, 1, 0, 0, 0, 0, 0, 0, 136, 0, 128, 18, 2, 160, 60, 16, 18, 11, 6, 12, 2, 5.31],
[1, 225, 146, 63, 61, 0, 0, 1, 15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 136, 128, 20, 160, 60, 16, 18, 11, 6, 12, 2, 2.16],
[0, 264, 194, 51, 51, 0, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 0, 184, 112, 0, 17, 144, 89, 30, 8, 14, 7, 17, 5, 3.87],
[0, 264, 194, 51, 51, 0, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 184, 0, 112, 16, 1, 144, 89, 30, 8, 14, 7, 17, 5, 6.37],
[0, 264, 194, 51, 51, 0, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 184, 112, 17, 144, 89, 30, 8, 14, 7, 17, 5, 2.69],
[1, 464, 336, 6, 2, 26, 29, 26, 8, 1, 0, 0, 0, 0, 0, 128, 0, 230, 36, 32, 5, 176, 132, 65, 23, 16, 8, 7, 5, 6.51],
[1, 464, 336, 6, 2, 26, 29, 26, 8, 1, 0, 0, 0, 128, 0, 0, 230, 0, 68, 1, 4, 176, 132, 65, 23, 16, 8, 7, 5, 11.33],
[1, 464, 336, 6, 2, 26, 29, 26, 8, 1, 0, 0, 0, 0, 0, 0, 128, 0, 230, 38, 35, 176, 132, 65, 23, 16, 8, 7, 5, 4.58],
[0, 787, 139, 2, 1, 280, 39, 39, 2, 1, 0, 0, 0, 0, 0, 138, 0, 316, 44, 0, 2, 204, 64, 38, 66, 37, 34, 42, 16, 12.02],
[0, 787, 139, 2, 1, 280, 39, 39, 2, 1, 0, 0, 0, 138, 0, 0, 316, 2, 42, 2, 0, 204, 64, 38, 66, 37, 34, 42, 16, 19.46],
[0, 787, 139, 2, 1, 280, 39, 39, 2, 1, 0, 0, 0, 0, 0, 0, 138, 0, 318, 42, 2, 204, 64, 38, 66, 37, 34, 42, 16, 8.46],
[2, 285, 223, 50, 50, 0, 3, 3, 6, 1, 0, 0, 0, 0, 0, 0, 0, 62, 221, 33, 17, 217, 24, 28, 21, 9, 8, 13, 14, 2.66],
[2, 285, 223, 50, 50, 0, 3, 3, 6, 1, 0, 0, 0, 0, 0, 0, 62, 1, 253, 7, 10, 217, 24, 28, 21, 9, 8, 13, 14, 4.06],
[2, 285, 223, 50, 50, 0, 3, 3, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 63, 220, 50, 217, 24, 28, 21, 9, 8, 13, 14, 1.97],
[0, 94, 79, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 74, 0, 22, 4, 0, 8, 0, 0, 1.07],
[0, 94, 79, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 20, 74, 0, 22, 4, 0, 8, 0, 0, 1.69],
[0, 94, 79, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 74, 0, 22, 4, 0, 8, 0, 0, 0.73],
[0, 187, 98, 42, 43, 0, 0, 0, 30, 1, 0, 0, 0, 0, 0, 0, 0, 0, 173, 0, 38, 161, 27, 6, 4, 7, 7, 0, 0, 2.14],
[0, 187, 98, 42, 43, 0, 0, 0, 30, 1, 0, 0, 0, 0, 0, 0, 0, 0, 173, 32, 6, 161, 27, 6, 4, 7, 7, 0, 0, 4.09],
[0, 187, 98, 42, 43, 0, 0, 0, 30, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 173, 38, 161, 27, 6, 4, 7, 7, 0, 0, 1.48],
[0, 251, 120, 16, 27, 0, 0, 0, 72, 1, 0, 0, 0, 0, 0, 0, 0, 0, 211, 0, 22, 131, 24, 28, 10, 9, 15, 7, 10, 3.12],
[0, 251, 120, 16, 27, 0, 0, 0, 72, 1, 0, 0, 0, 0, 0, 0, 0, 0, 211, 22, 0, 131, 24, 28, 10, 9, 15, 7, 10, 5.47],
[0, 251, 120, 16, 27, 0, 0, 0, 72, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 211, 22, 131, 24, 28, 10, 9, 15, 7, 10, 2.18],
[0, 368, 91, 0, 2, 32, 0, 0, 133, 2, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 124, 19, 92, 2, 8, 5, 6, 1, 4.55],
[0, 368, 91, 0, 2, 32, 0, 0, 133, 2, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 124, 19, 92, 2, 8, 5, 6, 1, 7.53],
[0, 368, 91, 0, 2, 32, 0, 0, 133, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 124, 19, 92, 2, 8, 5, 6, 1, 3.28],
[0, 74, 59, 1, 1, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 58, 29, 10, 7, 3, 4, 3, 0, 11, 0.64],
[0, 74, 59, 1, 1, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 58, 29, 10, 7, 3, 4, 3, 0, 11, 1.03],
[0, 74, 59, 1, 1, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 58, 29, 10, 7, 3, 4, 3, 0, 11, 0.45],
[0, 184, 170, 12, 12, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 6, 156, 32, 163, 8, 4, 3, 2, 4, 3, 8, 1.86],
[0, 184, 170, 12, 12, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 6, 156, 15, 17, 163, 8, 4, 3, 2, 4, 3, 8, 2.93],
[0, 184, 170, 12, 12, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 6, 156, 32, 163, 8, 4, 3, 2, 4, 3, 8, 1.32],
[0, 300, 279, 13, 13, 3, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 182, 97, 29, 268, 17, 5, 7, 5, 3, 2, 2, 3.30],
[0, 300, 279, 13, 13, 3, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 182, 97, 23, 6, 268, 17, 5, 7, 5, 3, 2, 2, 5.51],
[0, 300, 279, 13, 13, 3, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 182, 97, 29, 268, 17, 5, 7, 5, 3, 2, 2, 2.32],
[0, 319, 232, 29, 29, 28, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 197, 92, 29, 220, 44, 15, 12, 11, 7, 6, 4, 3.51],
[0, 319, 232, 29, 29, 28, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 197, 92, 25, 4, 220, 44, 15, 12, 11, 7, 6, 4, 5.49],
[0, 319, 232, 29, 29, 28, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 197, 92, 29, 220, 44, 15, 12, 11, 7, 6, 4, 2.59],
[0, 461, 440, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 399, 21, 21, 233, 81, 56, 33, 17, 21, 20, 20, 5.30],
[0, 461, 440, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 391, 29, 17, 4, 233, 81, 56, 33, 17, 21, 20, 20, 8.23],
[0, 461, 440, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 391, 29, 21, 233, 81, 56, 33, 17, 21, 20, 20, 4.02],
[0, 465, 430, 25, 25, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 328, 154, 2, 420, 56, 2, 0, 1, 5, 0, 0, 3.94],
[0, 465, 430, 25, 25, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 328, 154, 1, 1, 420, 56, 2, 0, 1, 5, 0, 0, 6.49],
[0, 465, 430, 25, 25, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 328, 154, 2, 420, 56, 2, 0, 1, 5, 0, 0, 2.78],
[1, 425, 320, 105, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 395, 111, 3, 496, 24, 1, 3, 3, 1, 1, 0, 3.74],
[1, 425, 320, 105, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 387, 119, 3, 0, 496, 24, 1, 3, 3, 1, 1, 0, 5.83],
[1, 425, 320, 105, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 387, 119, 3, 496, 24, 1, 3, 3, 1, 1, 0, 2.78],
[1, 465, 347, 118, 118, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 516, 58, 0, 443, 134, 5, 0, 0, 0, 0, 0, 4.44],
[1, 465, 347, 118, 118, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 508, 66, 0, 0, 443, 134, 5, 0, 0, 0, 0, 0, 6.66],
[1, 465, 347, 118, 118, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 508, 66, 0, 443, 134, 5, 0, 0, 0, 0, 0, 3.42],
[1, 187, 154, 9, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 170, 81, 27, 21, 11, 21, 9, 10, 6, 1.03],
[1, 187, 154, 9, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 101, 81, 27, 21, 11, 21, 9, 10, 6, 1.56],
[1, 187, 154, 9, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 186, 81, 27, 21, 11, 21, 9, 10, 6, 0.74],
[5, 518, 518, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 268, 153, 95, 310, 51, 61, 22, 26, 22, 11, 14, 3.81],
[5, 518, 518, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 268, 152, 93, 3, 310, 51, 61, 22, 26, 22, 11, 14, 6.06],
[5, 518, 518, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 268, 152, 96, 310, 51, 61, 22, 26, 22, 11, 14, 2.84],
[0, 645, 176, 93, 90, 87, 32, 21, 68, 1, 0, 0, 0, 0, 0, 0, 0, 223, 224, 87, 31, 303, 139, 37, 22, 23, 26, 12, 4, 4.63],
[0, 645, 176, 93, 90, 87, 32, 21, 68, 1, 0, 0, 0, 0, 0, 211, 12, 219, 92, 9, 22, 303, 139, 37, 22, 23, 26, 12, 4, 7.08],
[0, 645, 176, 93, 90, 87, 32, 21, 68, 1, 0, 0, 0, 0, 0, 0, 0, 211, 231, 32, 91, 303, 139, 37, 22, 23, 26, 12, 4, 3.36],
[0, 894, 278, 36, 9, 135, 29, 13, 87, 1, 0, 0, 0, 0, 0, 7, 0, 213, 241, 99, 25, 244, 98, 89, 62, 45, 24, 14, 10, 6.72],
[0, 894, 278, 36, 9, 135, 29, 13, 87, 1, 0, 0, 0, 7, 0, 199, 14, 230, 110, 12, 13, 244, 98, 89, 62, 45, 24, 14, 10, 10.10],
[0, 894, 278, 36, 9, 135, 29, 13, 87, 1, 0, 0, 0, 0, 0, 0, 7, 199, 244, 36, 99, 244, 98, 89, 62, 45, 24, 14, 10, 5.00],
[1, 340, 141, 18, 17, 27, 20, 14, 42, 1, 0, 0, 0, 0, 0, 0, 0, 198, 61, 18, 0, 77, 51, 18, 20, 35, 26, 26, 25, 6.92],
[1, 340, 141, 18, 17, 27, 20, 14, 42, 1, 0, 0, 0, 0, 0, 198, 0, 0, 78, 1, 0, 77, 51, 18, 20, 35, 26, 26, 25, 11.11],
[1, 340, 141, 18, 17, 27, 20, 14, 42, 1, 0, 0, 0, 0, 0, 0, 0, 0, 198, 78, 1, 77, 51, 18, 20, 35, 26, 26, 25, 4.73],
[1, 97, 75, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 118, 69, 19, 10, 9, 3, 2, 4, 2, 0.73],
[1, 97, 75, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 93, 25, 69, 19, 10, 9, 3, 2, 4, 2, 1.13],
[1, 97, 75, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 118, 69, 19, 10, 9, 3, 2, 4, 2, 0.52],
[1, 179, 119, 60, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 190, 42, 157, 44, 21, 3, 3, 3, 0, 7, 1.47],
[1, 179, 119, 60, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 190, 30, 12, 157, 44, 21, 3, 3, 3, 0, 7, 2.40],
[1, 179, 119, 60, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 190, 42, 157, 44, 21, 3, 3, 3, 0, 7, 1.05],
[1, 380, 203, 101, 44, 5, 1, 4, 60, 0, 0, 0, 0, 0, 0, 10, 0, 0, 276, 107, 24, 276, 38, 28, 28, 17, 17, 6, 7, 3.44],
[1, 380, 203, 101, 44, 5, 1, 4, 60, 0, 0, 0, 0, 0, 10, 0, 0, 276, 106, 15, 10, 276, 38, 28, 28, 17, 17, 6, 7, 6.01],
[1, 380, 203, 101, 44, 5, 1, 4, 60, 0, 0, 0, 0, 0, 0, 0, 0, 10, 276, 106, 25, 276, 38, 28, 28, 17, 17, 6, 7, 2.41],
[0, 120, 78, 42, 42, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 72, 80, 83, 5, 22, 21, 14, 11, 3, 2, 0.85],
[0, 120, 78, 42, 42, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 116, 36, 83, 5, 22, 21, 14, 11, 3, 2, 1.30],
[0, 120, 78, 42, 42, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 152, 83, 5, 22, 21, 14, 11, 3, 2, 0.61],
[0, 278, 235, 43, 43, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 240, 47, 32, 231, 31, 21, 13, 10, 12, 0, 2, 2.27],
[0, 278, 235, 43, 43, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 240, 66, 13, 231, 31, 21, 13, 10, 12, 0, 2, 3.46],
[0, 278, 235, 43, 43, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 79, 231, 31, 21, 13, 10, 12, 0, 2, 1.61],
[3, 1219, 664, 129, 129, 176, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 880, 235, 36, 613, 294, 81, 73, 33, 17, 30, 10, 6.41],
[3, 1219, 664, 129, 129, 176, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 880, 207, 57, 7, 613, 294, 81, 73, 33, 17, 30, 10, 9.47],
[3, 1219, 664, 129, 129, 176, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 880, 207, 64, 613, 294, 81, 73, 33, 17, 30, 10, 5.16],
[1, 134, 85, 3, 3, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 57, 52, 76, 8, 11, 5, 2, 9, 1, 1, 1.24],
[1, 134, 85, 3, 3, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 57, 0, 52, 76, 8, 11, 5, 2, 9, 1, 1, 1.97],
[1, 134, 85, 3, 3, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 109, 76, 8, 11, 5, 2, 9, 1, 1, 0.84],
[1, 195, 133, 8, 8, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 71, 50, 120, 21, 10, 12, 9, 1, 2, 0, 1.98],
[1, 195, 133, 8, 8, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 71, 2, 48, 120, 21, 10, 12, 9, 1, 2, 0, 3.01],
[1, 195, 133, 8, 8, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 0, 121, 120, 21, 10, 12, 9, 1, 2, 0, 1.42],
[1, 260, 189, 5, 5, 33, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 106, 98, 26, 171, 21, 15, 11, 7, 4, 1, 1, 2.84],
[1, 260, 189, 5, 5, 33, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 106, 98, 4, 22, 171, 21, 15, 11, 7, 4, 1, 1, 4.27],
[1, 260, 189, 5, 5, 33, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 106, 0, 124, 171, 21, 15, 11, 7, 4, 1, 1, 2.08],
[1, 64, 56, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 15, 50, 37, 13, 7, 7, 3, 3, 1, 0, 0.54],
[1, 64, 56, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 18, 47, 37, 13, 7, 7, 3, 3, 1, 0, 0.85],
[1, 64, 56, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 65, 37, 13, 7, 7, 3, 3, 1, 0, 0.38],
[0, 363, 292, 43, 35, 10, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 24, 283, 78, 1, 269, 78, 10, 11, 8, 2, 6, 3, 3.61],
[0, 363, 292, 43, 35, 10, 0, 0, 8, 1, 0, 0, 0, 0, 0, 24, 0, 283, 78, 0, 1, 269, 78, 10, 11, 8, 2, 6, 3, 5.44],
[0, 363, 292, 43, 35, 10, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 24, 283, 8, 71, 269, 78, 10, 11, 8, 2, 6, 3, 2.62],
[0, 659, 592, 49, 49, 9, 0, 0, 0, 2, 0, 0, 0, 0, 0, 66, 0, 420, 200, 9, 1, 418, 113, 63, 18, 24, 27, 18, 17, 7.35],
[0, 659, 592, 49, 49, 9, 0, 0, 0, 2, 0, 0, 0, 66, 0, 420, 0, 200, 9, 0, 1, 418, 113, 63, 18, 24, 27, 18, 17, 12.24],
[0, 659, 592, 49, 49, 9, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 66, 420, 200, 5, 5, 418, 113, 63, 18, 24, 27, 18, 17, 5.02],
[0, 862, 850, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 66, 0, 728, 54, 5, 1, 446, 53, 80, 15, 93, 37, 53, 78, 10.11],
[0, 862, 850, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 66, 0, 728, 0, 54, 5, 0, 1, 446, 53, 80, 15, 93, 37, 53, 78, 18.00],
[0, 862, 850, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 66, 728, 54, 5, 1, 446, 53, 80, 15, 93, 37, 53, 78, 6.94],
[0, 72, 53, 19, 17, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 26, 61, 71, 5, 11, 1, 0, 1, 0, 0, 1.06],
[0, 72, 53, 19, 17, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 26, 59, 2, 71, 5, 11, 1, 0, 1, 0, 0, 1.66],
[0, 72, 53, 19, 17, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 26, 61, 71, 5, 11, 1, 0, 1, 0, 0, 0.73],
[0, 118, 77, 41, 39, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 60, 90, 6, 113, 12, 19, 8, 2, 2, 1, 0, 2.02],
[0, 118, 77, 41, 39, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 60, 90, 4, 2, 113, 12, 19, 8, 2, 2, 1, 0, 3.26],
[0, 118, 77, 41, 39, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 60, 90, 6, 113, 12, 19, 8, 2, 2, 1, 0, 1.41],
[0, 193, 144, 31, 31, 1, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 161, 61, 0, 96, 6, 28, 37, 21, 18, 10, 6, 3.27],
[0, 193, 144, 31, 31, 1, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 161, 61, 0, 0, 96, 6, 28, 37, 21, 18, 10, 6, 5.12],
[0, 193, 144, 31, 31, 1, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 161, 61, 0, 96, 6, 28, 37, 21, 18, 10, 6, 2.35],
[0, 326, 130, 59, 58, 51, 17, 16, 1, 1, 0, 0, 0, 0, 0, 0, 22, 0, 282, 22, 4, 144, 21, 27, 41, 42, 26, 25, 5, 4.79],
[0, 326, 130, 59, 58, 51, 17, 16, 1, 1, 0, 0, 0, 0, 22, 0, 0, 282, 22, 4, 0, 144, 21, 27, 41, 42, 26, 25, 5, 7.44],
[0, 326, 130, 59, 58, 51, 17, 16, 1, 1, 0, 0, 0, 0, 0, 0, 0, 22, 282, 22, 4, 144, 21, 27, 41, 42, 26, 25, 5, 3.45],
[0, 453, 119, 42, 41, 127, 13, 13, 1, 0, 0, 0, 0, 0, 0, 0, 36, 0, 309, 8, 2, 121, 21, 29, 69, 45, 39, 25, 6, 6.56],
[0, 453, 119, 42, 41, 127, 13, 13, 1, 0, 0, 0, 0, 0, 36, 0, 0, 309, 8, 2, 0, 121, 21, 29, 69, 45, 39, 25, 6, 10.19],
[0, 453, 119, 42, 41, 127, 13, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 36, 309, 8, 2, 121, 21, 29, 69, 45, 39, 25, 6, 4.77],
[0, 268, 257, 1, 1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 180, 16, 41, 147, 40, 16, 17, 13, 9, 9, 12, 2.63],
[0, 268, 257, 1, 1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 0, 196, 38, 3, 147, 40, 16, 17, 13, 9, 9, 12, 4.17],
[0, 268, 257, 1, 1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 180, 57, 147, 40, 16, 17, 13, 9, 9, 12, 1.84],
[0, 415, 338, 4, 1, 31, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 190, 171, 6, 14, 208, 48, 23, 29, 18, 15, 11, 29, 4.32],
[0, 415, 338, 4, 1, 31, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 190, 0, 177, 14, 0, 208, 48, 23, 29, 18, 15, 11, 29, 6.91],
[0, 415, 338, 4, 1, 31, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 190, 171, 20, 208, 48, 23, 29, 18, 15, 11, 29, 3.13],
[0, 19, 7, 10, 12, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 25, 4, 0, 0, 0, 0, 0, 0, 0.34],
[0, 19, 7, 10, 12, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 16, 25, 4, 0, 0, 0, 0, 0, 0, 0.53],
[0, 19, 7, 10, 12, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 25, 4, 0, 0, 0, 0, 0, 0, 0.23],
[1, 38, 13, 23, 23, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 11, 50, 8, 1, 0, 0, 0, 0, 0, 0.76],
[1, 38, 13, 23, 23, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 47, 0, 11, 50, 8, 1, 0, 0, 0, 0, 0, 1.20],
[1, 38, 13, 23, 23, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 11, 50, 8, 1, 0, 0, 0, 0, 0, 0.53],
[0, 63, 47, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 61, 11, 70, 0, 0, 1, 0, 5, 0, 2, 1.41],
[0, 63, 47, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 59, 5, 8, 70, 0, 0, 1, 0, 5, 0, 2, 2.12],
[0, 63, 47, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 59, 13, 70, 0, 0, 1, 0, 5, 0, 2, 1.02],
[1, 134, 134, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 12, 0, 0, 80, 36, 4, 73, 14, 5, 5, 8, 4, 5, 19, 3.59],
[1, 134, 134, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 12, 0, 0, 80, 34, 2, 4, 73, 14, 5, 5, 8, 4, 5, 19, 5.78],
[1, 134, 134, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 12, 80, 34, 6, 73, 14, 5, 5, 8, 4, 5, 19, 2.61],
[0, 211, 71, 0, 0, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 90, 34, 4, 94, 15, 3, 3, 3, 6, 8, 8, 5.50],
[0, 211, 71, 0, 0, 70, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 90, 30, 4, 4, 94, 15, 3, 3, 3, 6, 8, 8, 8.24],
[0, 211, 71, 0, 0, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 90, 30, 8, 94, 15, 3, 3, 3, 6, 8, 8, 4.09],
[2, 337, 305, 2, 4, 12, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 120, 0, 206, 184, 17, 5, 11, 14, 9, 43, 44, 1.14],
[2, 337, 305, 2, 4, 12, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 120, 93, 113, 184, 17, 5, 11, 14, 9, 43, 44, 1.64],
[2, 337, 305, 2, 4, 12, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 206, 184, 17, 5, 11, 14, 9, 43, 44, 0.88],
[3, 241, 193, 0, 6, 19, 2, 1, 0, 5, 0, 0, 0, 0, 0, 0, 0, 111, 78, 0, 26, 121, 34, 5, 2, 6, 4, 21, 27, 2.29],
[3, 241, 193, 0, 6, 19, 2, 1, 0, 5, 0, 0, 0, 0, 0, 0, 111, 0, 78, 20, 6, 121, 34, 5, 2, 6, 4, 21, 27, 3.61],
[3, 241, 193, 0, 6, 19, 2, 1, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 111, 78, 26, 121, 34, 5, 2, 6, 4, 21, 27, 1.70],
[0, 76, 54, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 42, 17, 10, 8, 16, 1, 3, 0, 0.66],
[0, 76, 54, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 62, 42, 17, 10, 8, 16, 1, 3, 0, 1.05],
[0, 76, 54, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 42, 17, 10, 8, 16, 1, 3, 0, 0.46],
[0, 155, 112, 27, 27, 0, 4, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 24, 126, 124, 12, 10, 13, 12, 5, 3, 2, 1.48],
[0, 155, 112, 27, 27, 0, 4, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 113, 13, 124, 12, 10, 13, 12, 5, 3, 2, 2.39],
[0, 155, 112, 27, 27, 0, 4, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 149, 124, 12, 10, 13, 12, 5, 3, 2, 1.04],
[0, 247, 193, 16, 16, 15, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 19, 106, 55, 66, 160, 36, 23, 14, 8, 4, 2, 0, 2.58],
[0, 247, 193, 16, 16, 15, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 19, 0, 161, 56, 10, 160, 36, 23, 14, 8, 4, 2, 0, 4.13],
[0, 247, 193, 16, 16, 15, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 19, 107, 120, 160, 36, 23, 14, 8, 4, 2, 0, 1.84],
[0, 304, 231, 13, 13, 19, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 131, 60, 42, 199, 46, 16, 11, 9, 14, 1, 1, 3.36],
[0, 304, 231, 13, 13, 19, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 191, 34, 8, 199, 46, 16, 11, 9, 14, 1, 1, 5.26],
[0, 304, 231, 13, 13, 19, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 133, 100, 199, 46, 16, 11, 9, 14, 1, 1, 2.44],
[0, 352, 207, 29, 16, 40, 0, 0, 31, 1, 0, 0, 0, 0, 0, 0, 0, 85, 146, 43, 47, 179, 45, 36, 28, 25, 9, 0, 0, 3.84],
[0, 352, 207, 29, 16, 40, 0, 0, 31, 1, 0, 0, 0, 0, 0, 0, 85, 0, 189, 43, 4, 179, 45, 36, 28, 25, 9, 0, 0, 6.13],
[0, 352, 207, 29, 16, 40, 0, 0, 31, 1, 0, 0, 0, 0, 0, 0, 0, 0, 85, 148, 88, 179, 45, 36, 28, 25, 9, 0, 0, 2.80],
[0, 973, 427, 63, 54, 90, 74, 76, 34, 0, 0, 0, 0, 0, 0, 0, 0, 190, 503, 2, 122, 432, 179, 26, 59, 60, 12, 16, 33, 3.94],
[0, 973, 427, 63, 54, 90, 74, 76, 34, 0, 0, 0, 0, 0, 0, 0, 190, 0, 505, 77, 45, 432, 179, 26, 59, 60, 12, 16, 33, 6.45],
[0, 973, 427, 63, 54, 90, 74, 76, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 190, 503, 124, 432, 179, 26, 59, 60, 12, 16, 33, 3.08],
[0, 369, 284, 49, 45, 8, 10, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 283, 83, 38, 250, 68, 47, 14, 7, 16, 3, 2, 3.04],
[0, 369, 284, 49, 45, 8, 10, 12, 0, 0, 0, 0, 0, 0, 0, 0, 3, 259, 107, 2, 36, 250, 68, 47, 14, 7, 16, 3, 2, 4.57],
[0, 369, 284, 49, 45, 8, 10, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 262, 24, 121, 250, 68, 47, 14, 7, 16, 3, 2, 2.22],
[0, 422, 311, 61, 27, 10, 6, 16, 8, 0, 0, 0, 0, 0, 0, 0, 8, 0, 317, 72, 41, 200, 91, 36, 31, 38, 20, 18, 4, 4.34],
[0, 422, 311, 61, 27, 10, 6, 16, 8, 0, 0, 0, 0, 0, 0, 8, 0, 311, 78, 2, 39, 200, 91, 36, 31, 38, 20, 18, 4, 6.56],
[0, 422, 311, 61, 27, 10, 6, 16, 8, 0, 0, 0, 0, 0, 0, 0, 0, 8, 311, 6, 113, 200, 91, 36, 31, 38, 20, 18, 4, 3.21],
[0, 74, 22, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 123, 1, 108, 0, 4, 0, 1, 10, 2, 0, 1.25],
[0, 74, 22, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 0, 1, 108, 0, 4, 0, 1, 10, 2, 0, 1.98],
[0, 74, 22, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 1, 108, 0, 4, 0, 1, 10, 2, 0, 0.86],
[0, 97, 62, 35, 33, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 119, 2, 90, 4, 7, 8, 2, 7, 0, 12, 1.75],
[0, 97, 62, 35, 33, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 120, 2, 0, 90, 4, 7, 8, 2, 7, 0, 12, 2.74],
[0, 97, 62, 35, 33, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 120, 2, 90, 4, 7, 8, 2, 7, 0, 12, 1.22],
[0, 136, 127, 9, 5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 113, 0, 24, 19, 35, 20, 9, 12, 7, 15, 2.71],
[0, 136, 127, 9, 5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 18, 115, 0, 0, 24, 19, 35, 20, 9, 12, 7, 15, 4.23],
[0, 136, 127, 9, 5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 115, 0, 24, 19, 35, 20, 9, 12, 7, 15, 1.92],
[0, 210, 55, 11, 7, 70, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 107, 0, 39, 22, 17, 17, 21, 13, 14, 4, 4.04],
[0, 210, 55, 11, 7, 70, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 10, 28, 109, 0, 0, 39, 22, 17, 17, 21, 13, 14, 4, 6.20],
[0, 210, 55, 11, 7, 70, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 109, 0, 39, 22, 17, 17, 21, 13, 14, 4, 2.92],
[0, 246, 209, 7, 7, 14, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 216, 18, 0, 21, 23, 37, 16, 40, 18, 40, 43, 5.11],
[0, 246, 209, 7, 7, 14, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 63, 157, 18, 0, 0, 21, 23, 37, 16, 40, 18, 40, 43, 8.66],
[0, 246, 209, 7, 7, 14, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 220, 18, 0, 21, 23, 37, 16, 40, 18, 40, 43, 3.72],
[0, 270, 223, 9, 9, 15, 4, 4, 0, 1, 0, 0, 0, 0, 0, 16, 0, 3, 242, 1, 0, 59, 99, 33, 18, 12, 17, 15, 10, 5.77],
[0, 270, 223, 9, 9, 15, 4, 4, 0, 1, 0, 0, 0, 4, 12, 0, 71, 174, 1, 0, 0, 59, 99, 33, 18, 12, 17, 15, 10, 9.39],
[0, 270, 223, 9, 9, 15, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0, 4, 12, 245, 1, 0, 59, 99, 33, 18, 12, 17, 15, 10, 4.21],
[0, 435, 62, 5, 5, 176, 8, 8, 0, 0, 0, 0, 0, 0, 0, 16, 0, 3, 243, 1, 0, 71, 49, 18, 41, 23, 28, 27, 6, 8.47],
[0, 435, 62, 5, 5, 176, 8, 8, 0, 0, 0, 0, 0, 4, 12, 0, 71, 175, 1, 0, 0, 71, 49, 18, 41, 23, 28, 27, 6, 13.36],
[0, 435, 62, 5, 5, 176, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 4, 12, 246, 1, 0, 71, 49, 18, 41, 23, 28, 27, 6, 6.25],
[0, 355, 169, 38, 36, 18, 3, 1, 97, 6, 0, 0, 0, 0, 0, 0, 0, 0, 139, 112, 104, 242, 56, 23, 12, 16, 4, 5, 3, 2.09],
[0, 355, 169, 38, 36, 18, 3, 1, 97, 6, 0, 0, 0, 0, 0, 0, 0, 137, 114, 21, 83, 242, 56, 23, 12, 16, 4, 5, 3, 3.05],
[0, 355, 169, 38, 36, 18, 3, 1, 97, 6, 0, 0, 0, 0, 0, 0, 0, 0, 137, 11, 207, 242, 56, 23, 12, 16, 4, 5, 3, 1.57],
[0, 93, 67, 4, 4, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 56, 5, 62, 1, 12, 2, 6, 2, 0, 0, 1.46],
[0, 93, 67, 4, 4, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 56, 5, 62, 1, 12, 2, 6, 2, 0, 0, 2.29],
[0, 93, 67, 4, 4, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 61, 62, 1, 12, 2, 6, 2, 0, 0, 1.01],
[0, 109, 55, 0, 4, 23, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 56, 5, 28, 2, 19, 8, 8, 14, 4, 2, 1.73],
[0, 109, 55, 0, 4, 23, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 56, 5, 28, 2, 19, 8, 8, 14, 4, 2, 2.67],
[0, 109, 55, 0, 4, 23, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 61, 28, 2, 19, 8, 8, 14, 4, 2, 1.20],
[0, 137, 33, 0, 2, 47, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 60, 3, 34, 22, 7, 0, 6, 6, 6, 6, 2.08],
[0, 137, 33, 0, 2, 47, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 60, 3, 34, 22, 7, 0, 6, 6, 6, 6, 3.17],
[0, 137, 33, 0, 2, 47, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 63, 34, 22, 7, 0, 6, 6, 6, 6, 1.47],
[0, 225, 117, 0, 2, 49, 0, 0, 6, 0, 0, 0, 0, 0, 0, 8, 0, 84, 20, 60, 1, 118, 20, 6, 0, 7, 8, 8, 6, 4.81],
[0, 225, 117, 0, 2, 49, 0, 0, 6, 0, 0, 0, 2, 6, 0, 0, 84, 6, 74, 0, 1, 118, 20, 6, 0, 7, 8, 8, 6, 8.93],
[0, 225, 117, 0, 2, 49, 0, 0, 6, 0, 0, 0, 0, 0, 0, 2, 6, 0, 90, 74, 1, 118, 20, 6, 0, 7, 8, 8, 6, 3.11],
[1, 280, 87, 15, 19, 7, 2, 2, 80, 4, 0, 0, 0, 0, 0, 76, 0, 65, 60, 0, 6, 96, 16, 2, 8, 24, 33, 15, 17, 7.84],
[1, 280, 87, 15, 19, 7, 2, 2, 80, 4, 0, 0, 0, 76, 0, 0, 65, 2, 58, 5, 1, 96, 16, 2, 8, 24, 33, 15, 17, 12.36],
[1, 280, 87, 15, 19, 7, 2, 2, 80, 4, 0, 0, 0, 0, 0, 0, 76, 0, 67, 58, 6, 96, 16, 2, 8, 24, 33, 15, 17, 5.67],
[4, 131, 57, 52, 48, 5, 6, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 114, 38, 19, 148, 6, 6, 4, 1, 2, 5, 2, 1.57],
[4, 131, 57, 52, 48, 5, 6, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 114, 49, 8, 148, 6, 6, 4, 1, 2, 5, 2, 2.47],
[4, 131, 57, 52, 48, 5, 6, 7, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 114, 57, 148, 6, 6, 4, 1, 2, 5, 2, 1.06],
[0, 90, 66, 24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 62, 4, 67, 15, 8, 5, 7, 3, 6, 2, 1.70],
[0, 90, 66, 24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 62, 2, 2, 67, 15, 8, 5, 7, 3, 6, 2, 2.60],
[0, 90, 66, 24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 0, 66, 67, 15, 8, 5, 7, 3, 6, 2, 1.19],
[0, 169, 163, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 146, 13, 3, 79, 20, 16, 16, 12, 6, 11, 8, 3.68],
[0, 169, 163, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 146, 13, 2, 1, 79, 20, 16, 16, 12, 6, 11, 8, 5.47],
[0, 169, 163, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 146, 0, 16, 79, 20, 16, 16, 12, 6, 11, 8, 2.70],
[1, 462, 368, 90, 76, 2, 0, 7, 0, 1, 0, 0, 0, 0, 0, 0, 0, 147, 300, 34, 60, 444, 35, 20, 12, 13, 11, 3, 4, 3.23],
[1, 462, 368, 90, 76, 2, 0, 7, 0, 1, 0, 0, 0, 0, 0, 147, 0, 300, 34, 21, 39, 444, 35, 20, 12, 13, 11, 3, 4, 5.14],
[1, 462, 368, 90, 76, 2, 0, 7, 0, 1, 0, 0, 0, 0, 0, 0, 0, 147, 300, 15, 79, 444, 35, 20, 12, 13, 11, 3, 4, 2.32],
[2, 617, 514, 81, 69, 8, 2, 7, 1, 1, 0, 0, 0, 0, 0, 0, 0, 369, 213, 41, 57, 403, 72, 77, 36, 38, 15, 20, 20, 4.26],
[2, 617, 514, 81, 69, 8, 2, 7, 1, 1, 0, 0, 0, 0, 0, 368, 1, 213, 41, 21, 36, 403, 72, 77, 36, 38, 15, 20, 20, 6.50],
[2, 617, 514, 81, 69, 8, 2, 7, 1, 1, 0, 0, 0, 0, 0, 0, 0, 368, 214, 26, 72, 403, 72, 77, 36, 38, 15, 20, 20, 3.17],
[1, 67, 53, 9, 9, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 48, 0, 12, 3, 2, 3, 2, 5, 0.42],
[1, 67, 53, 9, 9, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 46, 48, 0, 12, 3, 2, 3, 2, 5, 0.66],
[1, 67, 53, 9, 9, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 48, 0, 12, 3, 2, 3, 2, 5, 0.30],
[2, 143, 101, 12, 12, 4, 0, 0, 22, 2, 0, 0, 0, 0, 0, 0, 0, 0, 18, 6, 124, 91, 17, 9, 10, 2, 13, 4, 4, 0.97],
[2, 143, 101, 12, 12, 4, 0, 0, 22, 2, 0, 0, 0, 0, 0, 0, 0, 0, 24, 83, 41, 91, 17, 9, 10, 2, 13, 4, 4, 1.47],
[2, 143, 101, 12, 12, 4, 0, 0, 22, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 130, 91, 17, 9, 10, 2, 13, 4, 4, 0.70],
[0, 76, 64, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 25, 24, 23, 3, 0, 0, 0, 0, 0.64],
[0, 76, 64, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 61, 25, 24, 23, 3, 0, 0, 0, 0, 1.03],
[0, 76, 64, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 25, 24, 23, 3, 0, 0, 0, 0, 0.43],
[0, 184, 163, 1, 1, 4, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 99, 76, 79, 54, 23, 15, 3, 1, 1, 0, 1.77],
[0, 184, 163, 1, 1, 4, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 62, 14, 79, 54, 23, 15, 3, 1, 1, 0, 2.83],
[0, 184, 163, 1, 1, 4, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 76, 79, 54, 23, 15, 3, 1, 1, 0, 1.23],
[1, 220, 127, 5, 3, 36, 0, 0, 10, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 102, 74, 58, 58, 33, 22, 7, 2, 0, 0, 2.31],
[1, 220, 127, 5, 3, 36, 0, 0, 10, 0, 0, 0, 0, 0, 2, 0, 0, 1, 103, 60, 14, 58, 58, 33, 22, 7, 2, 0, 0, 3.49],
[1, 220, 127, 5, 3, 36, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 102, 75, 58, 58, 33, 22, 7, 2, 0, 0, 1.69],
[2, 257, 133, 6, 4, 41, 2, 1, 15, 0, 0, 0, 0, 0, 0, 5, 0, 0, 8, 121, 67, 83, 56, 31, 23, 3, 4, 1, 0, 2.97],
[2, 257, 133, 6, 4, 41, 2, 1, 15, 0, 0, 0, 0, 1, 4, 0, 0, 3, 126, 57, 10, 83, 56, 31, 23, 3, 4, 1, 0, 4.45],
[2, 257, 133, 6, 4, 41, 2, 1, 15, 0, 0, 0, 0, 0, 0, 0, 1, 4, 3, 125, 68, 83, 56, 31, 23, 3, 4, 1, 0, 2.25],
[0, 608, 545, 44, 40, 3, 2, 1, 9, 1, 0, 0, 0, 0, 0, 0, 2, 0, 346, 262, 32, 400, 81, 71, 17, 33, 20, 14, 7, 3.85],
[0, 608, 545, 44, 40, 3, 2, 1, 9, 1, 0, 0, 0, 0, 2, 0, 0, 315, 288, 13, 24, 400, 81, 71, 17, 33, 20, 14, 7, 5.76],
[0, 608, 545, 44, 40, 3, 2, 1, 9, 1, 0, 0, 0, 0, 0, 0, 0, 2, 315, 284, 41, 400, 81, 71, 17, 33, 20, 14, 7, 2.93],
[0, 768, 444, 35, 12, 59, 48, 45, 17, 2, 0, 0, 0, 0, 0, 0, 5, 1, 358, 264, 29, 316, 127, 74, 41, 52, 26, 14, 9, 5.04],
[0, 768, 444, 35, 12, 59, 48, 45, 17, 2, 0, 0, 0, 0, 2, 3, 1, 325, 290, 13, 23, 316, 127, 74, 41, 52, 26, 14, 9, 7.39],
[0, 768, 444, 35, 12, 59, 48, 45, 17, 2, 0, 0, 0, 0, 0, 0, 0, 5, 326, 288, 38, 316, 127, 74, 41, 52, 26, 14, 9, 3.90],
[1, 29, 19, 6, 6, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 23, 17, 2, 1, 0, 1, 2, 3, 7, 0.58],
[1, 29, 19, 6, 6, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 7, 16, 17, 2, 1, 0, 1, 2, 3, 7, 0.88],
[1, 29, 19, 6, 6, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 17, 2, 1, 0, 1, 2, 3, 7, 0.41],
[1, 39, 23, 8, 10, 3, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 20, 25, 2, 0, 0, 1, 2, 4, 10, 0.82],
[1, 39, 23, 8, 10, 3, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 23, 8, 12, 25, 2, 0, 0, 1, 2, 4, 10, 1.23],
[1, 39, 23, 8, 10, 3, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 43, 25, 2, 0, 0, 1, 2, 4, 10, 0.59],
[1, 53, 39, 10, 10, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 28, 19, 41, 1, 0, 0, 1, 3, 2, 12, 1.19],
[1, 53, 39, 10, 10, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 28, 15, 4, 41, 1, 0, 0, 1, 3, 2, 12, 1.81],
[1, 53, 39, 10, 10, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 47, 41, 1, 0, 0, 1, 3, 2, 12, 0.84],
[1, 53, 36, 15, 15, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 23, 15, 36, 3, 0, 0, 1, 4, 8, 15, 1.18],
[1, 53, 36, 15, 15, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 23, 12, 3, 36, 3, 0, 0, 1, 4, 8, 15, 1.75],
[1, 53, 36, 15, 15, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 0, 38, 36, 3, 0, 0, 1, 4, 8, 15, 0.86],
[1, 78, 46, 28, 27, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 8, 7, 51, 1, 0, 2, 5, 4, 8, 32, 1.81],
[1, 78, 46, 28, 27, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 88, 8, 5, 2, 51, 1, 0, 2, 5, 4, 8, 32, 2.67],
[1, 78, 46, 28, 27, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 0, 15, 51, 1, 0, 2, 5, 4, 8, 32, 1.34],
[0, 107, 101, 4, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 0, 27, 6, 0, 84, 17, 2, 3, 2, 0, 1, 0, 5.32],
[0, 107, 101, 4, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 57, 19, 0, 27, 6, 0, 0, 84, 17, 2, 3, 2, 0, 1, 0, 8.55],
[0, 107, 101, 4, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 27, 6, 0, 84, 17, 2, 3, 2, 0, 1, 0, 3.65],
[2, 31, 16, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 3, 2, 0, 1, 1, 1, 0, 0.25],
[2, 31, 16, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 3, 2, 0, 1, 1, 1, 0, 0.38],
[2, 31, 16, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 37, 3, 2, 0, 1, 1, 1, 0, 0.17],
[2, 78, 38, 33, 31, 2, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 41, 61, 74, 14, 9, 3, 2, 0, 4, 1, 0.69],
[2, 78, 38, 33, 31, 2, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 4, 41, 6, 55, 74, 14, 9, 3, 2, 0, 4, 1, 1.05],
[2, 78, 38, 33, 31, 2, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 102, 74, 14, 9, 3, 2, 0, 4, 1, 0.50],
[2, 90, 34, 48, 38, 1, 1, 6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 40, 67, 89, 24, 3, 6, 3, 2, 3, 1, 0.87],
[2, 90, 34, 48, 38, 1, 1, 6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 20, 44, 12, 55, 89, 24, 3, 6, 3, 2, 3, 1, 1.31],
[2, 90, 34, 48, 38, 1, 1, 6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 4, 107, 89, 24, 3, 6, 3, 2, 3, 1, 0.64],
[2, 223, 73, 56, 58, 3, 15, 12, 41, 2, 0, 0, 0, 0, 0, 0, 3, 0, 133, 86, 33, 129, 39, 20, 26, 16, 18, 7, 2, 2.56],
[2, 223, 73, 56, 58, 3, 15, 12, 41, 2, 0, 0, 0, 0, 0, 3, 0, 113, 105, 22, 12, 129, 39, 20, 26, 16, 18, 7, 2, 3.85],
[2, 223, 73, 56, 58, 3, 15, 12, 41, 2, 0, 0, 0, 0, 0, 0, 0, 3, 113, 20, 119, 129, 39, 20, 26, 16, 18, 7, 2, 1.90],
[0, 474, 335, 44, 17, 17, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 119, 258, 91, 203, 145, 67, 19, 13, 12, 6, 3, 2.43],
[0, 474, 335, 44, 17, 17, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 0, 119, 258, 78, 13, 203, 145, 67, 19, 13, 12, 6, 3, 3.60],
[0, 474, 335, 44, 17, 17, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 119, 258, 91, 203, 145, 67, 19, 13, 12, 6, 3, 1.83],
[2, 286, 214, 72, 72, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 57, 3, 296, 231, 102, 14, 4, 2, 1, 0, 3, 1.35],
[2, 286, 214, 72, 72, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 57, 202, 97, 231, 102, 14, 4, 2, 1, 0, 3, 1.95],
[2, 286, 214, 72, 72, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57, 299, 231, 102, 14, 4, 2, 1, 0, 3, 1.01],
[2, 433, 254, 113, 94, 23, 7, 14, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 235, 367, 66, 35, 9, 9, 2, 4, 16, 2.16],
[2, 433, 254, 113, 94, 23, 7, 14, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 272, 148, 87, 367, 66, 35, 9, 9, 2, 4, 16, 3.04],
[2, 433, 254, 113, 94, 23, 7, 14, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 235, 367, 66, 35, 9, 9, 2, 4, 16, 1.66],
[0, 1492, 848, 106, 57, 200, 19, 14, 49, 8, 0, 0, 0, 0, 53, 3, 4, 574, 484, 132, 34, 568, 358, 151, 82, 54, 21, 17, 41, 8.20],
[0, 1492, 848, 106, 57, 200, 19, 14, 49, 8, 0, 0, 54, 0, 6, 564, 10, 30, 495, 101, 24, 568, 358, 151, 82, 54, 21, 17, 41, 12.03],
[0, 1492, 848, 106, 57, 200, 19, 14, 49, 8, 0, 0, 0, 0, 0, 54, 0, 7, 603, 495, 125, 568, 358, 151, 82, 54, 21, 17, 41, 6.22],
[0, 116, 86, 22, 22, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 74, 55, 93, 13, 18, 1, 5, 2, 2, 1, 1.17],
[0, 116, 86, 22, 22, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 74, 36, 19, 93, 13, 18, 1, 5, 2, 2, 1, 1.82],
[0, 116, 86, 22, 22, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 74, 55, 93, 13, 18, 1, 5, 2, 2, 1, 0.83],
[0, 236, 198, 15, 8, 6, 1, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 65, 60, 157, 52, 13, 6, 1, 5, 3, 0, 2.50],
[0, 236, 198, 15, 8, 6, 1, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 112, 65, 45, 15, 157, 52, 13, 6, 1, 5, 3, 0, 3.91],
[0, 236, 198, 15, 8, 6, 1, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 65, 60, 157, 52, 13, 6, 1, 5, 3, 0, 1.80],
[0, 945, 551, 15, 12, 178, 8, 8, 3, 1, 0, 0, 0, 0, 0, 0, 108, 23, 487, 135, 20, 276, 184, 188, 65, 27, 31, 2, 1, 6.61],
[0, 945, 551, 15, 12, 178, 8, 8, 3, 1, 0, 0, 0, 0, 108, 23, 0, 445, 158, 34, 5, 276, 184, 188, 65, 27, 31, 2, 1, 11.38],
[0, 945, 551, 15, 12, 178, 8, 8, 3, 1, 0, 0, 0, 0, 0, 0, 0, 131, 445, 158, 39, 276, 184, 188, 65, 27, 31, 2, 1, 4.63],
[0, 1074, 351, 41, 32, 299, 11, 9, 42, 1, 0, 0, 0, 0, 0, 0, 108, 30, 499, 123, 23, 268, 190, 52, 44, 27, 34, 150, 19, 8.88],
[0, 1074, 351, 41, 32, 299, 11, 9, 42, 1, 0, 0, 0, 0, 108, 30, 0, 458, 151, 30, 6, 268, 190, 52, 44, 27, 34, 150, 19, 15.61],
[0, 1074, 351, 41, 32, 299, 11, 9, 42, 1, 0, 0, 0, 0, 0, 0, 0, 138, 458, 151, 36, 268, 190, 52, 44, 27, 34, 150, 19, 6.32],
[0, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 26, 32, 5, 2, 0, 0, 0, 0, 0, 0.67],
[0, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 26, 32, 5, 2, 0, 0, 0, 0, 0, 1.08],
[0, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 32, 5, 2, 0, 0, 0, 0, 0, 0.45],
[0, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 23, 30, 18, 1, 0, 0, 0, 0, 0, 0.86],
[0, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 0, 23, 30, 18, 1, 0, 0, 0, 0, 0, 1.39],
[0, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 30, 18, 1, 0, 0, 0, 0, 0, 0.58],
[0, 83, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 35, 14, 72, 8, 1, 0, 1, 0, 0, 0, 1.53],
[0, 83, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 35, 6, 8, 72, 8, 1, 0, 1, 0, 0, 0, 2.50],
[0, 83, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 49, 72, 8, 1, 0, 1, 0, 0, 0, 0.99],
[0, 141, 101, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 90, 22, 5, 90, 8, 1, 1, 6, 2, 5, 7, 2.61],
[0, 141, 101, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 90, 22, 4, 1, 90, 8, 1, 1, 6, 2, 5, 7, 4.19],
[0, 141, 101, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 90, 0, 27, 90, 8, 1, 1, 6, 2, 5, 7, 1.76],
[44, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0.21],
[44, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0.32],
[44, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0.16],
[56, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0.29],
[56, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0.44],
[56, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0.22],
[0, 341, 138, 37, 37, 75, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 159, 94, 227, 31, 19, 6, 10, 3, 3, 3, 2.06],
[0, 341, 138, 37, 37, 75, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 159, 65, 29, 227, 31, 19, 6, 10, 3, 3, 3, 3.17],
[0, 341, 138, 37, 37, 75, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 159, 94, 227, 31, 19, 6, 10, 3, 3, 3, 1.54],
[0, 564, 139, 25, 26, 160, 38, 36, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 209, 126, 89, 341, 26, 27, 9, 8, 6, 4, 4, 3.56],
[0, 564, 139, 25, 26, 160, 38, 36, 2, 1, 0, 0, 0, 0, 0, 0, 0, 209, 126, 65, 24, 341, 26, 27, 9, 8, 6, 4, 4, 5.39],
[0, 564, 139, 25, 26, 160, 38, 36, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 209, 126, 89, 341, 26, 27, 9, 8, 6, 4, 4, 2.71],
[0, 189, 186, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 108, 64, 165, 20, 5, 1, 0, 0, 0, 0, 1.42],
[0, 189, 186, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 93, 42, 38, 165, 20, 5, 1, 0, 0, 0, 0, 2.24],
[0, 189, 186, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 65, 108, 165, 20, 5, 1, 0, 0, 0, 0, 1.00],
[1, 218, 188, 2, 4, 9, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 20, 108, 80, 148, 20, 9, 2, 10, 7, 8, 5, 1.67],
[1, 218, 188, 2, 4, 9, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 19, 93, 58, 38, 148, 20, 9, 2, 10, 7, 8, 5, 2.59],
[1, 218, 188, 2, 4, 9, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 19, 64, 125, 148, 20, 9, 2, 10, 7, 8, 5, 1.20],
[0, 92, 54, 12, 12, 9, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 0, 65, 65, 9, 5, 5, 3, 4, 3, 0, 0.83],
[0, 92, 54, 12, 12, 9, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 6, 59, 65, 9, 5, 5, 3, 4, 3, 0, 1.34],
[0, 92, 54, 12, 12, 9, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 65, 65, 9, 5, 5, 3, 4, 3, 0, 0.57],
[0, 311, 99, 9, 7, 81, 8, 8, 13, 0, 0, 0, 0, 0, 0, 0, 0, 66, 110, 0, 48, 145, 9, 7, 7, 19, 20, 15, 2, 3.49],
[0, 311, 99, 9, 7, 81, 8, 8, 13, 0, 0, 0, 0, 0, 0, 0, 66, 0, 110, 16, 32, 145, 9, 7, 7, 19, 20, 15, 2, 5.88],
[0, 311, 99, 9, 7, 81, 8, 8, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 110, 48, 145, 9, 7, 7, 19, 20, 15, 2, 2.49],
[1, 30, 16, 8, 12, 0, 3, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 32, 19, 6, 4, 8, 2, 0, 0, 0, 0.52],
[1, 30, 16, 8, 12, 0, 3, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 32, 19, 6, 4, 8, 2, 0, 0, 0, 0.81],
[1, 30, 16, 8, 12, 0, 3, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 19, 6, 4, 8, 2, 0, 0, 0, 0.36],
[1, 71, 39, 18, 15, 4, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 6, 28, 32, 15, 35, 13, 8, 13, 9, 3, 1, 0, 1.34],
[1, 71, 39, 18, 15, 4, 3, 4, 0, 1, 0, 0, 0, 0, 0, 1, 5, 0, 40, 30, 5, 35, 13, 8, 13, 9, 3, 1, 0, 2.07],
[1, 71, 39, 18, 15, 4, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 6, 40, 35, 35, 13, 8, 13, 9, 3, 1, 0, 0.94],
[0, 371, 351, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 33, 335, 95, 81, 31, 51, 46, 33, 20, 12, 1.97],
[0, 371, 351, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 33, 333, 2, 95, 81, 31, 51, 46, 33, 20, 12, 2.73],
[0, 371, 351, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 33, 335, 95, 81, 31, 51, 46, 33, 20, 12, 1.54],
[0, 78, 67, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 86, 64, 17, 2, 1, 1, 1, 0, 2, 0.83],
[0, 78, 67, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 46, 40, 64, 17, 2, 1, 1, 1, 0, 2, 1.35],
[0, 78, 67, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 86, 64, 17, 2, 1, 1, 1, 0, 2, 0.56],
[0, 129, 104, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 0, 74, 110, 26, 12, 2, 1, 0, 2, 0, 1.55],
[0, 129, 104, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 60, 14, 110, 26, 12, 2, 1, 0, 2, 0, 2.49],
[0, 129, 104, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 74, 110, 26, 12, 2, 1, 0, 2, 0, 1.07],
[0, 174, 153, 19, 19, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 111, 8, 53, 134, 29, 18, 6, 0, 0, 5, 0, 2.30],
[0, 174, 153, 19, 19, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 20, 1, 118, 45, 8, 134, 29, 18, 6, 0, 0, 5, 0, 3.70],
[0, 174, 153, 19, 19, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 111, 60, 134, 29, 18, 6, 0, 0, 5, 0, 1.61],
[0, 58, 39, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 7, 56, 15, 3, 2, 0, 0, 0, 0, 1.17],
[0, 58, 39, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 2, 5, 56, 15, 3, 2, 0, 0, 0, 0, 1.88],
[0, 58, 39, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 7, 56, 15, 3, 2, 0, 0, 0, 0, 0.81],
[0, 71, 46, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 61, 4, 72, 10, 9, 1, 3, 0, 0, 0, 1.59],
[0, 71, 46, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 61, 0, 4, 72, 10, 9, 1, 3, 0, 0, 0, 2.58],
[0, 71, 46, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 61, 4, 72, 10, 9, 1, 3, 0, 0, 0, 1.09],
[0, 88, 38, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 107, 28, 2, 94, 24, 10, 7, 2, 0, 0, 0, 2.00],
[0, 88, 38, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 105, 30, 0, 2, 94, 24, 10, 7, 2, 0, 0, 0, 3.21],
[0, 88, 38, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 105, 30, 2, 94, 24, 10, 7, 2, 0, 0, 0, 1.42],
[0, 108, 65, 5, 7, 13, 4, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 40, 52, 4, 41, 39, 5, 4, 6, 1, 1, 0, 2.65],
[0, 108, 65, 5, 7, 13, 4, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 37, 55, 2, 2, 41, 39, 5, 4, 6, 1, 1, 0, 4.06],
[0, 108, 65, 5, 7, 13, 4, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 37, 54, 5, 41, 39, 5, 4, 6, 1, 1, 0, 1.92],
[1, 25, 20, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 24, 3, 0, 0, 1, 1, 0, 0, 0.42],
[1, 25, 20, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 17, 24, 3, 0, 0, 1, 1, 0, 0, 0.66],
[1, 25, 20, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 24, 3, 0, 0, 1, 1, 0, 0, 0.29],
[1, 169, 82, 2, 4, 38, 3, 1, 2, 1, 0, 0, 0, 0, 0, 0, 2, 0, 87, 32, 9, 82, 29, 3, 0, 4, 7, 4, 2, 3.07],
[1, 169, 82, 2, 4, 38, 3, 1, 2, 1, 0, 0, 0, 0, 2, 0, 0, 87, 30, 6, 5, 82, 29, 3, 0, 4, 7, 4, 2, 4.80],
[1, 169, 82, 2, 4, 38, 3, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 2, 87, 30, 11, 82, 29, 3, 0, 4, 7, 4, 2, 2.25],
[4, 230, 223, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 156, 173, 52, 6, 3, 0, 0, 1, 1, 1.13],
[4, 230, 223, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 115, 41, 173, 52, 6, 3, 0, 0, 1, 1, 1.79],
[4, 230, 223, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 156, 173, 52, 6, 3, 0, 0, 1, 1, 0.81],
[3, 514, 458, 2, 2, 24, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 243, 215, 31, 264, 122, 14, 15, 17, 15, 8, 34, 2.65],
[3, 514, 458, 2, 2, 24, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 243, 215, 18, 13, 264, 122, 14, 15, 17, 15, 8, 34, 4.13],
[3, 514, 458, 2, 2, 24, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 243, 215, 31, 264, 122, 14, 15, 17, 15, 8, 34, 1.89],
[0, 23, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 0, 2, 0, 0, 0, 0, 0, 0.27],
[0, 23, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 0, 2, 0, 0, 0, 0, 0, 0.43],
[0, 23, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 0, 2, 0, 0, 0, 0, 0, 0.18],
[0, 29, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 8, 6, 4, 0, 10, 0, 0, 0, 0.36],
[0, 29, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 8, 6, 4, 0, 10, 0, 0, 0, 0.57],
[0, 29, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 8, 6, 4, 0, 10, 0, 0, 0, 0.24],
[0, 43, 21, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 38, 44, 6, 6, 0, 6, 0, 2, 0, 0.56],
[0, 43, 21, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 0, 38, 44, 6, 6, 0, 6, 0, 2, 0, 0.88],
[0, 43, 21, 22, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 44, 6, 6, 0, 6, 0, 2, 0, 0.39],
[0, 95, 83, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 16, 72, 20, 0, 0, 4, 3, 7, 0, 1.39],
[0, 95, 83, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 0, 16, 72, 20, 0, 0, 4, 3, 7, 0, 2.12],
[0, 95, 83, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 72, 20, 0, 0, 4, 3, 7, 0, 0.97],
[0, 139, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 82, 8, 91, 24, 11, 0, 8, 2, 2, 0, 2.09],
[0, 139, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 94, 0, 8, 91, 24, 11, 0, 8, 2, 2, 0, 3.16],
[0, 139, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 12, 90, 91, 24, 11, 0, 8, 2, 2, 0, 1.49],
[1, 45, 26, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0.54],
[1, 45, 26, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0.84],
[1, 45, 26, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0.37],
[1, 64, 37, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 37, 90, 0, 0, 0, 0, 0, 0, 0, 0.81],
[1, 64, 37, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 0, 37, 90, 0, 0, 0, 0, 0, 0, 0, 1.25],
[1, 64, 37, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 0, 0, 0, 0, 0, 0, 0, 0.55],
[1, 94, 67, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113, 7, 114, 6, 0, 0, 0, 0, 0, 0, 1.25],
[1, 94, 67, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113, 0, 7, 114, 6, 0, 0, 0, 0, 0, 0, 1.93],
[1, 94, 67, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 114, 6, 0, 0, 0, 0, 0, 0, 0.87],
[1, 170, 58, 2, 2, 47, 8, 8, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113, 10, 84, 34, 4, 1, 1, 0, 0, 0, 2.16],
[1, 170, 58, 2, 2, 47, 8, 8, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 113, 0, 10, 84, 34, 4, 1, 1, 0, 0, 0, 3.30],
[1, 170, 58, 2, 2, 47, 8, 8, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 84, 34, 4, 1, 1, 0, 0, 0, 1.51],
[1, 241, 189, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 212, 4, 0, 234, 46, 9, 2, 0, 1, 0, 0, 3.83],
[1, 241, 189, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 0, 212, 4, 0, 0, 234, 46, 9, 2, 0, 1, 0, 0, 6.08],
[1, 241, 189, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 212, 4, 0, 234, 46, 9, 2, 0, 1, 0, 0, 2.63],
[1, 273, 99, 174, 174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 348, 98, 0, 0, 342, 97, 7, 0, 0, 0, 0, 0, 4.78],
[1, 273, 99, 174, 174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 348, 0, 98, 0, 0, 0, 342, 97, 7, 0, 0, 0, 0, 0, 8.31],
[1, 273, 99, 174, 174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 348, 98, 0, 0, 342, 97, 7, 0, 0, 0, 0, 0, 3.12],
[1, 322, 128, 134, 134, 30, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 330, 92, 1, 1, 250, 113, 27, 17, 10, 3, 3, 2, 5.19],
[1, 322, 128, 134, 134, 30, 0, 0, 0, 1, 0, 0, 0, 0, 0, 330, 0, 92, 1, 0, 1, 250, 113, 27, 17, 10, 3, 3, 2, 8.26],
[1, 322, 128, 134, 134, 30, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 330, 92, 1, 1, 250, 113, 27, 17, 10, 3, 3, 2, 3.57],
[1, 451, 451, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 356, 94, 0, 0, 237, 135, 62, 14, 2, 0, 0, 0, 7.37],
[1, 451, 451, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 356, 0, 94, 0, 0, 0, 237, 135, 62, 14, 2, 0, 0, 0, 11.81],
[1, 451, 451, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 356, 94, 0, 0, 237, 135, 62, 14, 2, 0, 0, 0, 5.13],
[1, 454, 275, 1, 5, 62, 1, 1, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 193, 149, 151, 35, 24, 42, 15, 40, 48, 19, 1.66],
[1, 454, 275, 1, 5, 62, 1, 1, 30, 0, 0, 0, 0, 0, 0, 0, 0, 32, 161, 165, 16, 151, 35, 24, 42, 15, 40, 48, 19, 2.46],
[1, 454, 275, 1, 5, 62, 1, 1, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 161, 181, 151, 35, 24, 42, 15, 40, 48, 19, 1.25],
[0, 185, 149, 9, 2, 0, 0, 0, 27, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 173, 31, 52, 33, 24, 26, 9, 10, 1, 1.28],
[0, 185, 149, 9, 2, 0, 0, 0, 27, 1, 0, 0, 0, 0, 0, 0, 0, 0, 12, 141, 32, 31, 52, 33, 24, 26, 9, 10, 1, 1.96],
[0, 185, 149, 9, 2, 0, 0, 0, 27, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 173, 31, 52, 33, 24, 26, 9, 10, 1, 0.92],
[0, 329, 250, 5, 1, 25, 0, 0, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 238, 61, 112, 18, 44, 32, 42, 34, 22, 0, 2.40],
[0, 329, 250, 5, 1, 25, 0, 0, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 242, 28, 33, 112, 18, 44, 32, 42, 34, 22, 0, 3.60],
[0, 329, 250, 5, 1, 25, 0, 0, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 242, 61, 112, 18, 44, 32, 42, 34, 22, 0, 1.74],
[0, 605, 390, 14, 1, 75, 3, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 7, 317, 168, 30, 188, 69, 33, 92, 55, 44, 25, 16, 4.25],
[0, 605, 390, 14, 1, 75, 3, 0, 40, 0, 0, 0, 0, 0, 0, 0, 47, 259, 186, 10, 20, 188, 69, 33, 92, 55, 44, 25, 16, 6.63],
[0, 605, 390, 14, 1, 75, 3, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 306, 186, 30, 188, 69, 33, 92, 55, 44, 25, 16, 3.13],
[0, 943, 563, 17, 2, 106, 8, 0, 103, 1, 0, 0, 0, 0, 0, 201, 0, 5, 493, 81, 17, 267, 30, 83, 86, 118, 79, 80, 55, 6.99],
[0, 943, 563, 17, 2, 106, 8, 0, 103, 1, 0, 0, 0, 35, 166, 0, 66, 387, 126, 12, 5, 267, 30, 83, 86, 118, 79, 80, 55, 10.82],
[0, 943, 563, 17, 2, 106, 8, 0, 103, 1, 0, 0, 0, 0, 0, 0, 35, 166, 453, 126, 17, 267, 30, 83, 86, 118, 79, 80, 55, 5.14],
[0, 1329, 612, 23, 2, 223, 19, 0, 124, 1, 0, 0, 0, 0, 0, 510, 0, 4, 401, 76, 10, 388, 185, 42, 150, 88, 91, 25, 33, 9.99],
[0, 1329, 612, 23, 2, 223, 19, 0, 124, 1, 0, 0, 0, 87, 423, 0, 60, 331, 88, 9, 3, 388, 185, 42, 150, 88, 91, 25, 33, 15.77],
[0, 1329, 612, 23, 2, 223, 19, 0, 124, 1, 0, 0, 0, 0, 0, 0, 87, 423, 391, 88, 12, 388, 185, 42, 150, 88, 91, 25, 33, 7.35],
[0, 185, 183, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 101, 12, 25, 105, 66, 8, 1, 1, 1, 4, 0, 2.64],
[0, 185, 183, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 113, 19, 6, 105, 66, 8, 1, 1, 1, 4, 0, 4.48],
[0, 185, 183, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 102, 36, 105, 66, 8, 1, 1, 1, 4, 0, 1.81],
[0, 207, 178, 5, 5, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 126, 12, 13, 95, 60, 39, 5, 0, 0, 0, 0, 3.00],
[0, 207, 178, 5, 5, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 138, 8, 5, 95, 60, 39, 5, 0, 0, 0, 0, 5.08],
[0, 207, 178, 5, 5, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 127, 24, 95, 60, 39, 5, 0, 0, 0, 0, 2.14],
[0, 265, 258, 6, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 180, 66, 8, 16, 90, 74, 51, 16, 33, 5, 0, 1, 4.42],
[0, 265, 258, 6, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 180, 0, 74, 12, 4, 90, 74, 51, 16, 33, 5, 0, 1, 7.56],
[0, 265, 258, 6, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 180, 67, 23, 90, 74, 51, 16, 33, 5, 0, 1, 3.12],
[2, 635, 258, 28, 17, 139, 16, 16, 15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 37, 364, 86, 252, 124, 37, 24, 16, 13, 10, 12, 3.50],
[2, 635, 258, 28, 17, 139, 16, 16, 15, 1, 0, 0, 0, 0, 0, 0, 0, 37, 358, 74, 18, 252, 124, 37, 24, 16, 13, 10, 12, 5.09],
[2, 635, 258, 28, 17, 139, 16, 16, 15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 37, 358, 92, 252, 124, 37, 24, 16, 13, 10, 12, 2.71],
[0, 477, 314, 88, 83, 33, 1, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 73, 241, 180, 32, 216, 133, 70, 19, 16, 25, 16, 31, 3.02],
[0, 477, 314, 88, 83, 33, 1, 1, 7, 0, 0, 0, 0, 0, 0, 43, 30, 235, 186, 7, 25, 216, 133, 70, 19, 16, 25, 16, 31, 4.47],
[0, 477, 314, 88, 83, 33, 1, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 43, 265, 75, 143, 216, 133, 70, 19, 16, 25, 16, 31, 2.23],
[0, 606, 353, 25, 22, 60, 25, 25, 35, 1, 0, 0, 0, 0, 0, 0, 0, 0, 220, 315, 8, 267, 112, 84, 33, 19, 15, 4, 10, 4.56],
[0, 606, 353, 25, 22, 60, 25, 25, 35, 1, 0, 0, 0, 0, 0, 0, 0, 220, 315, 4, 4, 267, 112, 84, 33, 19, 15, 4, 10, 7.28],
[0, 606, 353, 25, 22, 60, 25, 25, 35, 1, 0, 0, 0, 0, 0, 0, 0, 0, 220, 315, 8, 267, 112, 84, 33, 19, 15, 4, 10, 3.35],
[0, 860, 276, 52, 5, 134, 38, 30, 103, 1, 0, 0, 0, 0, 0, 0, 16, 6, 380, 210, 24, 291, 153, 38, 64, 31, 35, 17, 8, 6.10],
[0, 860, 276, 52, 5, 134, 38, 30, 103, 1, 0, 0, 0, 0, 16, 6, 0, 380, 210, 21, 3, 291, 153, 38, 64, 31, 35, 17, 8, 9.37],
[0, 860, 276, 52, 5, 134, 38, 30, 103, 1, 0, 0, 0, 0, 0, 0, 0, 16, 386, 210, 24, 291, 153, 38, 64, 31, 35, 17, 8, 4.66],
[0, 26, 20, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 23, 3, 1, 3, 1, 0, 0, 0, 0.47],
[0, 26, 20, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 23, 3, 1, 3, 1, 0, 0, 0, 0.73],
[0, 26, 20, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 23, 3, 1, 3, 1, 0, 0, 0, 0.32],
[0, 39, 25, 4, 4, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 23, 25, 7, 5, 0, 2, 0, 0, 0, 0.74],
[0, 39, 25, 4, 4, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 23, 25, 7, 5, 0, 2, 0, 0, 0, 1.13],
[0, 39, 25, 4, 4, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 25, 7, 5, 0, 2, 0, 0, 0, 0.52],
[0, 50, 28, 12, 12, 2, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 3, 40, 10, 7, 1, 1, 0, 0, 0, 1.02],
[0, 50, 28, 12, 12, 2, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 3, 40, 10, 7, 1, 1, 0, 0, 0, 1.53],
[0, 50, 28, 12, 12, 2, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 59, 40, 10, 7, 1, 1, 0, 0, 0, 0.73],
[0, 65, 41, 6, 6, 6, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 52, 4, 29, 25, 3, 5, 2, 0, 0, 0, 1.41],
[0, 65, 41, 6, 6, 6, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 52, 4, 29, 25, 3, 5, 2, 0, 0, 0, 2.15],
[0, 65, 41, 6, 6, 6, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 56, 29, 25, 3, 5, 2, 0, 0, 0, 0.99],
[1, 631, 274, 15, 18, 143, 3, 2, 29, 1, 0, 0, 0, 0, 0, 0, 0, 0, 467, 1, 14, 310, 89, 34, 31, 13, 6, 0, 0, 3.10],
[1, 631, 274, 15, 18, 143, 3, 2, 29, 1, 0, 0, 0, 0, 0, 0, 0, 0, 468, 3, 11, 310, 89, 34, 31, 13, 6, 0, 0, 5.17],
[1, 631, 274, 15, 18, 143, 3, 2, 29, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 468, 14, 310, 89, 34, 31, 13, 6, 0, 0, 2.29],
[1, 948, 0, 0, 4, 363, 20, 10, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 406, 0, 36, 268, 118, 14, 13, 10, 9, 7, 4, 5.65],
[1, 948, 0, 0, 4, 363, 20, 10, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 406, 7, 29, 268, 118, 14, 13, 10, 9, 7, 4, 9.62],
[1, 948, 0, 0, 4, 363, 20, 10, 47, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 406, 36, 268, 118, 14, 13, 10, 9, 7, 4, 4.24],
[0, 138, 105, 33, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 144, 131, 18, 12, 5, 3, 1, 0, 0, 0.87],
[0, 138, 105, 33, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 112, 32, 131, 18, 12, 5, 3, 1, 0, 0, 1.34],
[0, 138, 105, 33, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 144, 131, 18, 12, 5, 3, 1, 0, 0, 0.62],
[1, 225, 140, 85, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 265, 44, 299, 6, 3, 0, 1, 0, 0, 0, 1.53],
[1, 225, 140, 85, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 265, 37, 7, 299, 6, 3, 0, 1, 0, 0, 0, 2.30],
[1, 225, 140, 85, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 265, 44, 299, 6, 3, 0, 1, 0, 0, 0, 1.11],
[3, 373, 287, 86, 59, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 229, 198, 13, 378, 52, 6, 0, 1, 2, 0, 1, 2.78],
[3, 373, 287, 86, 59, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 229, 198, 8, 5, 378, 52, 6, 0, 1, 2, 0, 1, 4.30],
[3, 373, 287, 86, 59, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 229, 198, 13, 378, 52, 6, 0, 1, 2, 0, 1, 2.04],
[0, 869, 785, 0, 2, 40, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672, 156, 610, 65, 13, 14, 27, 10, 28, 62, 3.20],
[0, 869, 785, 0, 2, 40, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 672, 96, 60, 610, 65, 13, 14, 27, 10, 28, 62, 4.27],
[0, 869, 785, 0, 2, 40, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672, 156, 610, 65, 13, 14, 27, 10, 28, 62, 2.60],
[0, 1823, 1377, 25, 4, 185, 4, 0, 37, 3, 0, 0, 0, 3, 0, 0, 1206, 0, 338, 73, 8, 885, 329, 155, 70, 76, 57, 45, 14, 10.89],
[0, 1823, 1377, 25, 4, 185, 4, 0, 37, 3, 0, 1, 2, 0, 154, 1052, 0, 309, 102, 4, 4, 885, 329, 155, 70, 76, 57, 45, 14, 16.61],
[0, 1823, 1377, 25, 4, 185, 4, 0, 37, 3, 0, 0, 0, 0, 1, 2, 0, 1206, 309, 102, 8, 885, 329, 155, 70, 76, 57, 45, 14, 8.12],
[0, 92, 47, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 132, 4, 108, 19, 7, 1, 1, 0, 0, 0, 1.28],
[0, 92, 47, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 132, 1, 3, 108, 19, 7, 1, 1, 0, 0, 0, 2.07],
[0, 92, 47, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 132, 4, 108, 19, 7, 1, 1, 0, 0, 0, 0.88],
[0, 115, 71, 44, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 125, 1, 118, 26, 12, 2, 0, 0, 0, 0, 1.79],
[0, 115, 71, 44, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 125, 1, 0, 118, 26, 12, 2, 0, 0, 0, 0, 2.90],
[0, 115, 71, 44, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 125, 1, 118, 26, 12, 2, 0, 0, 0, 0, 1.23],
[0, 150, 78, 66, 66, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 71, 0, 197, 10, 6, 0, 2, 0, 0, 0, 2.55],
[0, 150, 78, 66, 66, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 71, 0, 0, 197, 10, 6, 0, 2, 0, 0, 0, 4.14],
[0, 150, 78, 66, 66, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 71, 0, 197, 10, 6, 0, 2, 0, 0, 0, 1.79],
[0, 195, 136, 45, 45, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 186, 50, 0, 164, 52, 9, 3, 3, 2, 3, 0, 3.50],
[0, 195, 136, 45, 45, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 186, 50, 0, 0, 164, 52, 9, 3, 3, 2, 3, 0, 5.39],
[0, 195, 136, 45, 45, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 186, 50, 0, 164, 52, 9, 3, 3, 2, 3, 0, 2.59],
[0, 1710, 830, 50, 18, 228, 45, 2, 159, 0, 78, 122, 0, 0, 20, 16, 9, 445, 283, 338, 20, 592, 393, 150, 94, 67, 26, 7, 2, 8.53],
[0, 1710, 830, 50, 18, 228, 45, 2, 159, 40, 160, 0, 20, 0, 25, 444, 1, 37, 490, 106, 8, 592, 393, 150, 94, 67, 26, 7, 2, 12.11],
[0, 1710, 830, 50, 18, 228, 45, 2, 159, 0, 40, 46, 114, 0, 0, 20, 0, 61, 446, 479, 125, 592, 393, 150, 94, 67, 26, 7, 2, 6.57],
[0, 45, 38, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 15, 41, 4, 6, 0, 0, 0, 0, 0, 0.88],
[0, 45, 38, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 0, 15, 41, 4, 6, 0, 0, 0, 0, 0, 1.37],
[0, 45, 38, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 41, 4, 6, 0, 0, 0, 0, 0, 0.60],
[0, 76, 67, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 25, 9, 73, 3, 6, 0, 1, 1, 0, 0, 1.59],
[0, 76, 67, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 25, 0, 9, 73, 3, 6, 0, 1, 1, 0, 0, 2.54],
[0, 76, 67, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 34, 73, 3, 6, 0, 1, 1, 0, 0, 1.07],
[0, 86, 75, 7, 7, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 18, 9, 64, 14, 8, 3, 2, 0, 0, 0, 1.96],
[0, 86, 75, 7, 7, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 18, 0, 9, 64, 14, 8, 3, 2, 0, 0, 0, 2.94],
[0, 86, 75, 7, 7, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 27, 64, 14, 8, 3, 2, 0, 0, 0, 1.40],
[0, 108, 72, 12, 12, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 86, 13, 7, 53, 23, 17, 7, 6, 1, 0, 1, 2.55],
[0, 108, 72, 12, 12, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 86, 13, 0, 7, 53, 23, 17, 7, 6, 1, 0, 1, 3.79],
[0, 108, 72, 12, 12, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 86, 0, 20, 53, 23, 17, 7, 6, 1, 0, 1, 1.85],
[0, 203, 149, 20, 0, 4, 3, 3, 20, 1, 0, 0, 0, 0, 0, 0, 0, 102, 92, 2, 1, 115, 30, 18, 6, 15, 2, 9, 3, 5.74],
[0, 203, 149, 20, 0, 4, 3, 3, 20, 1, 0, 0, 0, 0, 0, 102, 0, 92, 2, 1, 0, 115, 30, 18, 6, 15, 2, 9, 3, 9.09],
[0, 203, 149, 20, 0, 4, 3, 3, 20, 1, 0, 0, 0, 0, 0, 0, 0, 102, 92, 0, 3, 115, 30, 18, 6, 15, 2, 9, 3, 4.05],
[1, 348, 305, 37, 37, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 16, 360, 0, 169, 45, 34, 39, 37, 21, 18, 18, 1.84],
[1, 348, 305, 37, 37, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 17, 359, 0, 169, 45, 34, 39, 37, 21, 18, 18, 2.83],
[1, 348, 305, 37, 37, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 17, 359, 169, 45, 34, 39, 37, 21, 18, 18, 1.31],
[0, 138, 91, 44, 44, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 173, 58, 12, 30, 18, 17, 8, 9, 28, 1.12],
[0, 138, 91, 44, 44, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 140, 33, 58, 12, 30, 18, 17, 8, 9, 28, 1.74],
[0, 138, 91, 44, 44, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 173, 58, 12, 30, 18, 17, 8, 9, 28, 0.79],
[0, 202, 138, 41, 21, 8, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 1, 176, 79, 15, 28, 8, 18, 21, 26, 24, 1.65],
[0, 202, 138, 41, 21, 8, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 156, 21, 79, 15, 28, 8, 18, 21, 26, 24, 2.57],
[0, 202, 138, 41, 21, 8, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 177, 79, 15, 28, 8, 18, 21, 26, 24, 1.18],
[0, 373, 237, 28, 12, 28, 0, 0, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 264, 1, 90, 200, 48, 36, 5, 16, 8, 22, 20, 2.88],
[0, 373, 237, 28, 12, 28, 0, 0, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 264, 88, 3, 200, 48, 36, 5, 16, 8, 22, 20, 4.52],
[0, 373, 237, 28, 12, 28, 0, 0, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 264, 91, 200, 48, 36, 5, 16, 8, 22, 20, 2.10],
[0, 447, 156, 19, 6, 38, 4, 1, 117, 0, 0, 0, 0, 0, 0, 0, 0, 0, 234, 1, 105, 103, 70, 37, 25, 21, 19, 32, 33, 3.94],
[0, 447, 156, 19, 6, 38, 4, 1, 117, 0, 0, 0, 0, 0, 0, 0, 0, 0, 234, 102, 4, 103, 70, 37, 25, 21, 19, 32, 33, 6.09],
[0, 447, 156, 19, 6, 38, 4, 1, 117, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 234, 106, 103, 70, 37, 25, 21, 19, 32, 33, 2.89],
[0, 500, 362, 36, 27, 27, 12, 11, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 337, 108, 52, 372, 50, 31, 9, 8, 14, 4, 9, 3.67],
[0, 500, 362, 36, 27, 27, 12, 11, 23, 0, 0, 0, 0, 0, 0, 0, 0, 337, 107, 17, 36, 372, 50, 31, 9, 8, 14, 4, 9, 5.37],
[0, 500, 362, 36, 27, 27, 12, 11, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 337, 1, 159, 372, 50, 31, 9, 8, 14, 4, 9, 2.75],
[1, 106, 96, 2, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 40, 52, 10, 50, 43, 5, 3, 1, 0, 0, 1, 2.26],
[1, 106, 96, 2, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 40, 48, 10, 4, 50, 43, 5, 3, 1, 0, 0, 1, 3.93],
[1, 106, 96, 2, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 40, 48, 14, 50, 43, 5, 3, 1, 0, 0, 1, 1.50],
[0, 27, 10, 11, 9, 0, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 31, 19, 11, 3, 1, 2, 0, 0, 0, 0.47],
[0, 27, 10, 11, 9, 0, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 16, 15, 19, 11, 3, 1, 2, 0, 0, 0, 0.75],
[0, 27, 10, 11, 9, 0, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 31, 19, 11, 3, 1, 2, 0, 0, 0, 0.31],
[0, 733, 536, 72, 37, 41, 4, 6, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 347, 307, 76, 293, 118, 79, 103, 88, 38, 11, 0, 3.87],
[0, 733, 536, 72, 37, 41, 4, 6, 35, 0, 0, 0, 0, 0, 0, 0, 0, 345, 309, 33, 43, 293, 118, 79, 103, 88, 38, 11, 0, 5.53],
[0, 733, 536, 72, 37, 41, 4, 6, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 345, 43, 342, 293, 118, 79, 103, 88, 38, 11, 0, 3.00],
[2, 277, 196, 15, 15, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 126, 0, 128, 200, 32, 11, 11, 3, 1, 0, 0, 1.78],
[2, 277, 196, 15, 15, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 126, 94, 34, 200, 32, 11, 11, 3, 1, 0, 0, 2.93],
[2, 277, 196, 15, 15, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 126, 128, 200, 32, 11, 11, 3, 1, 0, 0, 1.28],
[5, 319, 178, 50, 36, 36, 1, 1, 17, 1, 0, 0, 0, 0, 0, 0, 0, 41, 175, 2, 99, 197, 52, 27, 9, 11, 7, 9, 6, 2.25],
[5, 319, 178, 50, 36, 36, 1, 1, 17, 1, 0, 0, 0, 0, 0, 0, 41, 0, 177, 91, 8, 197, 52, 27, 9, 11, 7, 9, 6, 3.48],
[5, 319, 178, 50, 36, 36, 1, 1, 17, 1, 0, 0, 0, 0, 0, 0, 0, 0, 41, 175, 101, 197, 52, 27, 9, 11, 7, 9, 6, 1.66],
[3, 370, 234, 30, 30, 32, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 238, 11, 85, 168, 107, 33, 18, 17, 8, 8, 8, 2.79],
[3, 370, 234, 30, 30, 32, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 249, 79, 6, 168, 107, 33, 18, 17, 8, 8, 8, 4.18],
[3, 370, 234, 30, 30, 32, 21, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 238, 96, 168, 107, 33, 18, 17, 8, 8, 8, 2.10],
[1, 481, 230, 26, 28, 86, 18, 15, 2, 1, 0, 0, 0, 0, 0, 0, 0, 62, 247, 8, 86, 237, 85, 43, 17, 11, 5, 2, 4, 3.75],
[1, 481, 230, 26, 28, 86, 18, 15, 2, 1, 0, 0, 0, 0, 0, 0, 62, 0, 255, 77, 9, 237, 85, 43, 17, 11, 5, 2, 4, 5.79],
[1, 481, 230, 26, 28, 86, 18, 15, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 62, 247, 94, 237, 85, 43, 17, 11, 5, 2, 4, 2.89],
[0, 131, 121, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 54, 98, 11, 4, 3, 14, 2, 7, 1, 1.12],
[0, 131, 121, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 0, 54, 98, 11, 4, 3, 14, 2, 7, 1, 1.74],
[0, 131, 121, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 98, 11, 4, 3, 14, 2, 7, 1, 0.79],
[0, 218, 181, 31, 31, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 168, 32, 45, 189, 17, 3, 3, 6, 7, 8, 12, 2.01],
[0, 218, 181, 31, 31, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 168, 32, 35, 10, 189, 17, 3, 3, 6, 7, 8, 12, 3.12],
[0, 218, 181, 31, 31, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 168, 17, 60, 189, 17, 3, 3, 6, 7, 8, 12, 1.40],
[0, 250, 223, 9, 9, 9, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 168, 35, 45, 170, 35, 7, 8, 8, 7, 5, 9, 2.41],
[0, 250, 223, 9, 9, 9, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 168, 35, 36, 9, 170, 35, 7, 8, 8, 7, 5, 9, 3.61],
[0, 250, 223, 9, 9, 9, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 168, 17, 63, 170, 35, 7, 8, 8, 7, 5, 9, 1.77],
[0, 258, 218, 12, 4, 14, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 170, 31, 47, 170, 30, 10, 9, 9, 5, 9, 7, 2.56],
[0, 258, 218, 12, 4, 14, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 170, 31, 36, 11, 170, 30, 10, 9, 9, 5, 9, 7, 3.82],
[0, 258, 218, 12, 4, 14, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 170, 20, 58, 170, 30, 10, 9, 9, 5, 9, 7, 1.91],
[0, 663, 154, 0, 0, 245, 0, 0, 9, 1, 0, 0, 0, 0, 0, 0, 0, 140, 212, 48, 6, 177, 94, 23, 34, 28, 20, 23, 8, 6.31],
[0, 663, 154, 0, 0, 245, 0, 0, 9, 1, 0, 0, 0, 0, 0, 140, 0, 212, 48, 4, 2, 177, 94, 23, 34, 28, 20, 23, 8, 9.52],
[0, 663, 154, 0, 0, 245, 0, 0, 9, 1, 0, 0, 0, 0, 0, 0, 0, 140, 212, 8, 46, 177, 94, 23, 34, 28, 20, 23, 8, 4.73],
[1, 780, 464, 12, 4, 110, 10, 0, 26, 3, 0, 0, 0, 0, 3, 1, 385, 49, 131, 33, 20, 368, 50, 46, 39, 37, 44, 22, 19, 8.43],
[1, 780, 464, 12, 4, 110, 10, 0, 26, 3, 0, 0, 3, 0, 386, 49, 0, 130, 29, 20, 5, 368, 50, 46, 39, 37, 44, 22, 19, 14.17],
[1, 780, 464, 12, 4, 110, 10, 0, 26, 3, 0, 0, 0, 0, 0, 3, 0, 435, 130, 28, 26, 368, 50, 46, 39, 37, 44, 22, 19, 5.98],
[1, 82, 52, 8, 8, 8, 3, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 64, 52, 7, 10, 5, 3, 3, 1, 0, 0.91],
[1, 82, 52, 8, 8, 8, 3, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 16, 51, 13, 52, 7, 10, 5, 3, 3, 1, 0, 1.43],
[1, 82, 52, 8, 8, 8, 3, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 64, 52, 7, 10, 5, 3, 3, 1, 0, 0.62],
[1, 184, 120, 14, 14, 21, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 113, 16, 140, 8, 11, 7, 3, 1, 2, 2, 2.34],
[1, 184, 120, 14, 14, 21, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 125, 13, 3, 140, 8, 11, 7, 3, 1, 2, 2, 3.70],
[1, 184, 120, 14, 14, 21, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 125, 16, 140, 8, 11, 7, 3, 1, 2, 2, 1.64],
[1, 265, 166, 7, 4, 39, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 137, 71, 14, 150, 19, 14, 5, 9, 9, 7, 10, 3.56],
[1, 265, 166, 7, 4, 39, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 119, 89, 10, 4, 150, 19, 14, 5, 9, 9, 7, 10, 5.45],
[1, 265, 166, 7, 4, 39, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 119, 89, 14, 150, 19, 14, 5, 9, 9, 7, 10, 2.58],
[0, 122, 99, 17, 19, 1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 120, 82, 24, 3, 12, 6, 4, 1, 6, 1.13],
[0, 122, 99, 17, 19, 1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 17, 83, 37, 82, 24, 3, 12, 6, 4, 1, 6, 1.83],
[0, 122, 99, 17, 19, 1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 120, 82, 24, 3, 12, 6, 4, 1, 6, 0.80],
[4, 242, 179, 23, 15, 6, 5, 3, 15, 3, 0, 0, 0, 0, 0, 0, 0, 29, 149, 9, 55, 169, 36, 8, 12, 4, 4, 5, 7, 2.30],
[4, 242, 179, 23, 15, 6, 5, 3, 15, 3, 0, 0, 0, 0, 0, 0, 29, 0, 158, 33, 22, 169, 36, 8, 12, 4, 4, 5, 7, 3.71],
[4, 242, 179, 23, 15, 6, 5, 3, 15, 3, 0, 0, 0, 0, 0, 0, 0, 0, 29, 149, 64, 169, 36, 8, 12, 4, 4, 5, 7, 1.69],
[0, 68, 28, 34, 36, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 51, 83, 19, 0, 0, 0, 0, 0, 0, 0.66],
[0, 68, 28, 34, 36, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 51, 83, 19, 0, 0, 0, 0, 0, 0, 1.06],
[0, 68, 28, 34, 36, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 101, 83, 19, 0, 0, 0, 0, 0, 0, 0.44],
[0, 120, 58, 58, 60, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 68, 95, 14, 151, 20, 3, 3, 0, 1, 0, 0, 1.40],
[0, 120, 58, 58, 60, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 68, 95, 0, 14, 151, 20, 3, 3, 0, 1, 0, 0, 2.14],
[0, 120, 58, 58, 60, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 68, 0, 109, 151, 20, 3, 3, 0, 1, 0, 0, 0.99],
[0, 157, 77, 74, 74, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 172, 49, 8, 211, 14, 2, 1, 0, 0, 0, 1, 2.06],
[0, 157, 77, 74, 74, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 172, 49, 0, 8, 211, 14, 2, 1, 0, 0, 0, 1, 3.09],
[0, 157, 77, 74, 74, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 172, 0, 57, 211, 14, 2, 1, 0, 0, 0, 1, 1.49],
[0, 225, 136, 77, 79, 0, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 39, 223, 33, 6, 272, 12, 4, 2, 6, 1, 1, 4, 3.26],
[0, 225, 136, 77, 79, 0, 6, 5, 0, 1, 0, 0, 0, 0, 0, 39, 0, 223, 33, 0, 6, 272, 12, 4, 2, 6, 1, 1, 4, 5.12],
[0, 225, 136, 77, 79, 0, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 39, 223, 1, 38, 272, 12, 4, 2, 6, 1, 1, 4, 2.35],
[0, 347, 209, 101, 103, 6, 12, 11, 0, 1, 0, 0, 0, 0, 0, 0, 0, 306, 106, 22, 6, 292, 21, 20, 14, 19, 24, 24, 27, 5.41],
[0, 347, 209, 101, 103, 6, 12, 11, 0, 1, 0, 0, 0, 0, 0, 306, 0, 106, 22, 1, 5, 292, 21, 20, 14, 19, 24, 24, 27, 8.62],
[0, 347, 209, 101, 103, 6, 12, 11, 0, 1, 0, 0, 0, 0, 0, 0, 0, 306, 106, 14, 14, 292, 21, 20, 14, 19, 24, 24, 27, 3.79],
[1, 73, 48, 1, 1, 12, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 13, 1, 21, 23, 21, 14, 10, 6, 6, 3, 1, 0, 1.69],
[1, 73, 48, 1, 1, 12, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 13, 0, 22, 12, 11, 21, 14, 10, 6, 6, 3, 1, 0, 2.60],
[1, 73, 48, 1, 1, 12, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 13, 1, 44, 21, 14, 10, 6, 6, 3, 1, 0, 1.21],
[0, 1364, 1064, 72, 74, 79, 35, 34, 0, 1, 0, 0, 0, 0, 0, 92, 0, 973, 217, 33, 41, 399, 456, 167, 156, 98, 46, 22, 13, 7.69],
[0, 1364, 1064, 72, 74, 79, 35, 34, 0, 1, 0, 0, 0, 92, 0, 0, 973, 0, 250, 27, 14, 399, 456, 167, 156, 98, 46, 22, 13, 11.71],
[0, 1364, 1064, 72, 74, 79, 35, 34, 0, 1, 0, 0, 0, 0, 0, 0, 92, 0, 973, 220, 71, 399, 456, 167, 156, 98, 46, 22, 13, 5.97],
[0, 80, 56, 20, 22, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 82, 17, 71, 4, 10, 4, 5, 2, 4, 0, 1.01],
[0, 80, 56, 20, 22, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 82, 0, 17, 71, 4, 10, 4, 5, 2, 4, 0, 1.54],
[0, 80, 56, 20, 22, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 71, 4, 10, 4, 5, 2, 4, 0, 0.70],
[1, 84, 59, 19, 21, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 17, 65, 4, 6, 3, 9, 1, 4, 11, 1.09],
[1, 84, 59, 19, 21, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 85, 0, 17, 65, 4, 6, 3, 9, 1, 4, 11, 1.64],
[1, 84, 59, 19, 21, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 102, 65, 4, 6, 3, 9, 1, 4, 11, 0.78],
[2, 129, 82, 17, 21, 10, 5, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 52, 72, 10, 100, 3, 3, 7, 4, 8, 10, 2, 1.81],
[2, 129, 82, 17, 21, 10, 5, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 52, 72, 1, 9, 100, 3, 3, 7, 4, 8, 10, 2, 2.69],
[2, 129, 82, 17, 21, 10, 5, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 52, 0, 82, 100, 3, 3, 7, 4, 8, 10, 2, 1.31],
[1, 675, 172, 16, 9, 205, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 328, 61, 31, 257, 79, 37, 17, 9, 5, 7, 9, 4.81],
[1, 675, 172, 16, 9, 205, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 328, 61, 19, 12, 257, 79, 37, 17, 9, 5, 7, 9, 7.44],
[1, 675, 172, 16, 9, 205, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 328, 0, 92, 257, 79, 37, 17, 9, 5, 7, 9, 3.37],
[0, 121, 78, 1, 1, 12, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 46, 19, 43, 64, 5, 3, 8, 4, 9, 6, 10, 1.94],
[0, 121, 78, 1, 1, 12, 9, 9, 0, 0, 0, 0, 0, 0, 1, 0, 0, 6, 59, 38, 5, 64, 5, 3, 8, 4, 9, 6, 10, 3.07],
[0, 121, 78, 1, 1, 12, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 48, 54, 64, 5, 3, 8, 4, 9, 6, 10, 1.37],
[0, 148, 88, 2, 2, 20, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 65, 20, 36, 86, 21, 9, 1, 4, 4, 0, 4, 2.57],
[0, 148, 88, 2, 2, 20, 9, 9, 0, 0, 0, 0, 0, 0, 8, 0, 0, 22, 63, 32, 4, 86, 21, 9, 1, 4, 4, 0, 4, 4.03],
[0, 148, 88, 2, 2, 20, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 22, 54, 45, 86, 21, 9, 1, 4, 4, 0, 4, 1.83],
[0, 36, 32, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 32, 39, 0, 0, 0, 0, 0, 0, 0, 0.50],
[0, 36, 32, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 12, 39, 0, 0, 0, 0, 0, 0, 0, 0.79],
[0, 36, 32, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 39, 0, 0, 0, 0, 0, 0, 0, 0.33],
[0, 52, 44, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 41, 40, 7, 0, 0, 0, 0, 0, 0, 0.75],
[0, 52, 44, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 40, 7, 0, 0, 0, 0, 0, 0, 1.19],
[0, 52, 44, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 40, 7, 0, 0, 0, 0, 0, 0, 0.51],
[0, 48, 17, 7, 1, 2, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 40, 26, 15, 3, 1, 0, 0, 0, 0, 0.64],
[0, 48, 17, 7, 1, 2, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 20, 26, 15, 3, 1, 0, 0, 0, 0, 1.02],
[0, 48, 17, 7, 1, 2, 0, 0, 19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 26, 15, 3, 1, 0, 0, 0, 0, 0.44],
[0, 52, 46, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 42, 38, 9, 1, 0, 0, 0, 0, 0, 0.77],
[0, 52, 46, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 38, 9, 1, 0, 0, 0, 0, 0, 1.22],
[0, 52, 46, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 38, 9, 1, 0, 0, 0, 0, 0, 0.52],
[0, 59, 26, 5, 1, 8, 0, 0, 12, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 43, 24, 20, 5, 2, 0, 0, 0, 0, 0.82],
[0, 59, 26, 5, 1, 8, 0, 0, 12, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 24, 20, 5, 2, 0, 0, 0, 0, 1.30],
[0, 59, 26, 5, 1, 8, 0, 0, 12, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 24, 20, 5, 2, 0, 0, 0, 0, 0.56],
[0, 1236, 921, 37, 51, 72, 58, 56, 0, 1, 0, 0, 0, 2, 0, 0, 26, 0, 987, 140, 38, 798, 108, 81, 52, 41, 31, 38, 45, 5.72],
[0, 1236, 921, 37, 51, 72, 58, 56, 0, 1, 0, 0, 2, 0, 0, 26, 0, 987, 136, 18, 24, 798, 108, 81, 52, 41, 31, 38, 45, 8.24],
[0, 1236, 921, 37, 51, 72, 58, 56, 0, 1, 0, 0, 0, 0, 0, 2, 0, 26, 987, 4, 174, 798, 108, 81, 52, 41, 31, 38, 45, 4.35],
[1, 789, 523, 97, 79, 12, 16, 3, 93, 2, 0, 0, 0, 0, 0, 244, 41, 362, 112, 15, 46, 415, 118, 61, 86, 44, 46, 20, 32, 5.76],
[1, 789, 523, 97, 79, 12, 16, 3, 93, 2, 0, 0, 0, 244, 0, 41, 362, 74, 53, 32, 14, 415, 118, 61, 86, 44, 46, 20, 32, 9.64],
[1, 789, 523, 97, 79, 12, 16, 3, 93, 2, 0, 0, 0, 0, 0, 0, 244, 41, 436, 38, 61, 415, 118, 61, 86, 44, 46, 20, 32, 4.19],
[1, 1242, 531, 17, 12, 254, 34, 23, 66, 1, 0, 0, 0, 0, 0, 428, 47, 261, 154, 14, 31, 383, 137, 79, 158, 62, 58, 41, 18, 10.19],
[1, 1242, 531, 17, 12, 254, 34, 23, 66, 1, 0, 0, 0, 428, 0, 47, 261, 63, 105, 25, 6, 383, 137, 79, 158, 62, 58, 41, 18, 17.07],
[1, 1242, 531, 17, 12, 254, 34, 23, 66, 1, 0, 0, 0, 0, 0, 0, 428, 47, 324, 94, 42, 383, 137, 79, 158, 62, 58, 41, 18, 7.23],
[1, 236, 235, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 162, 26, 150, 51, 31, 4, 0, 0, 0, 0, 2.31],
[1, 236, 235, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 140, 42, 6, 150, 51, 31, 4, 0, 0, 0, 0, 3.82],
[1, 236, 235, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 140, 48, 150, 51, 31, 4, 0, 0, 0, 0, 1.59],
[1, 280, 262, 8, 8, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 140, 18, 158, 57, 49, 9, 9, 0, 0, 0, 2.77],
[1, 280, 262, 8, 8, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 114, 40, 4, 158, 57, 49, 9, 9, 0, 0, 0, 4.62],
[1, 280, 262, 8, 8, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 114, 44, 158, 57, 49, 9, 9, 0, 0, 0, 1.94],
[1, 323, 311, 2, 2, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 189, 113, 17, 133, 76, 78, 24, 6, 0, 2, 0, 3.13],
[1, 323, 311, 2, 2, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 189, 88, 40, 2, 133, 76, 78, 24, 6, 0, 2, 0, 5.29],
[1, 323, 311, 2, 2, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 189, 88, 42, 133, 76, 78, 24, 6, 0, 2, 0, 2.23],
[1, 280, 226, 42, 42, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 188, 115, 12, 232, 44, 18, 13, 7, 0, 1, 0, 3.11],
[1, 280, 226, 42, 42, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 188, 103, 14, 10, 232, 44, 18, 13, 7, 0, 1, 0, 5.00],
[1, 280, 226, 42, 42, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 188, 103, 24, 232, 44, 18, 13, 7, 0, 1, 0, 2.25],
[1, 366, 322, 13, 11, 14, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 115, 6, 117, 67, 91, 29, 31, 9, 6, 11, 3.86],
[1, 366, 322, 13, 11, 14, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 240, 101, 18, 2, 117, 67, 91, 29, 31, 9, 6, 11, 6.43],
[1, 366, 322, 13, 11, 14, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 101, 20, 117, 67, 91, 29, 31, 9, 6, 11, 2.84],
[1, 379, 251, 55, 52, 32, 2, 1, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 240, 119, 37, 245, 75, 32, 16, 14, 8, 5, 2, 3.03],
[1, 379, 251, 55, 52, 32, 2, 1, 5, 1, 0, 0, 0, 0, 0, 0, 0, 240, 119, 32, 5, 245, 75, 32, 16, 14, 8, 5, 2, 4.82],
[1, 379, 251, 55, 52, 32, 2, 1, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 240, 119, 37, 245, 75, 32, 16, 14, 8, 5, 2, 2.18],
[2, 532, 200, 12, 8, 153, 2, 1, 7, 2, 0, 0, 0, 0, 0, 0, 0, 0, 204, 123, 53, 145, 101, 29, 40, 50, 6, 4, 7, 4.22],
[2, 532, 200, 12, 8, 153, 2, 1, 7, 2, 0, 0, 0, 0, 0, 0, 0, 204, 123, 48, 5, 145, 101, 29, 40, 50, 6, 4, 7, 6.63],
[2, 532, 200, 12, 8, 153, 2, 1, 7, 2, 0, 0, 0, 0, 0, 0, 0, 0, 204, 123, 53, 145, 101, 29, 40, 50, 6, 4, 7, 3.13],
[0, 741, 317, 21, 18, 169, 5, 3, 15, 6, 0, 0, 0, 0, 0, 0, 109, 0, 298, 110, 24, 202, 153, 78, 66, 38, 7, 3, 0, 6.21],
[0, 741, 317, 21, 18, 169, 5, 3, 15, 6, 0, 0, 0, 0, 109, 0, 0, 290, 118, 21, 3, 202, 153, 78, 66, 38, 7, 3, 0, 9.77],
[0, 741, 317, 21, 18, 169, 5, 3, 15, 6, 0, 0, 0, 0, 0, 0, 0, 109, 290, 117, 25, 202, 153, 78, 66, 38, 7, 3, 0, 4.61],
[0, 839, 389, 35, 28, 130, 16, 12, 46, 10, 0, 0, 0, 27, 15, 0, 182, 12, 306, 86, 17, 245, 181, 107, 65, 32, 12, 6, 7, 7.48],
[0, 839, 389, 35, 28, 130, 16, 12, 46, 10, 0, 25, 17, 0, 182, 0, 12, 286, 106, 14, 3, 245, 181, 107, 65, 32, 12, 6, 7, 11.77],
[0, 839, 389, 35, 28, 130, 16, 12, 46, 10, 0, 0, 0, 0, 25, 17, 0, 182, 298, 105, 18, 245, 181, 107, 65, 32, 12, 6, 7, 5.56],
[1, 280, 276, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 227, 28, 9, 132, 124, 9, 6, 0, 0, 5, 4, 3.66],
[1, 280, 276, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 227, 28, 7, 2, 132, 124, 9, 6, 0, 0, 5, 4, 6.19],
[1, 280, 276, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 227, 28, 9, 132, 124, 9, 6, 0, 0, 5, 4, 2.42],
[1, 56, 0, 51, 53, 0, 1, 0, 3, 1, 0, 0, 0, 0, 0, 2, 0, 36, 36, 24, 8, 66, 4, 8, 4, 3, 11, 9, 2, 1.62],
[1, 56, 0, 51, 53, 0, 1, 0, 3, 1, 0, 0, 0, 2, 0, 22, 14, 24, 35, 6, 3, 66, 4, 8, 4, 3, 11, 9, 2, 2.51],
[1, 56, 0, 51, 53, 0, 1, 0, 3, 1, 0, 0, 0, 0, 0, 0, 2, 22, 38, 16, 28, 66, 4, 8, 4, 3, 11, 9, 2, 1.13],
[0, 1178, 494, 39, 32, 233, 23, 24, 8, 3, 0, 0, 0, 0, 0, 0, 41, 41, 684, 66, 17, 384, 200, 48, 23, 50, 57, 58, 32, 5.93],
[0, 1178, 494, 39, 32, 233, 23, 24, 8, 3, 0, 0, 0, 0, 0, 41, 41, 671, 79, 9, 8, 384, 200, 48, 23, 50, 57, 58, 32, 9.12],
[0, 1178, 494, 39, 32, 233, 23, 24, 8, 3, 0, 0, 0, 0, 0, 0, 0, 41, 712, 14, 82, 384, 200, 48, 23, 50, 57, 58, 32, 4.33],
[0, 867, 505, 0, 0, 174, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 447, 164, 32, 34, 289, 166, 90, 62, 44, 16, 8, 3, 6.57],
[0, 867, 505, 0, 0, 174, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 447, 0, 196, 34, 0, 289, 166, 90, 62, 44, 16, 8, 3, 11.10],
[0, 867, 505, 0, 0, 174, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 447, 165, 65, 289, 166, 90, 62, 44, 16, 8, 3, 4.99],
[1, 65, 62, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 49, 2, 2, 2, 1, 2, 4, 2, 0.66],
[1, 65, 62, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 40, 49, 2, 2, 2, 1, 2, 4, 2, 1.03],
[1, 65, 62, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 49, 2, 2, 2, 1, 2, 4, 2, 0.46],
[1, 119, 100, 13, 13, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 79, 48, 85, 15, 8, 8, 3, 0, 9, 0, 1.36],
[1, 119, 100, 13, 13, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 47, 18, 85, 15, 8, 8, 3, 0, 9, 0, 2.10],
[1, 119, 100, 13, 13, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 72, 85, 15, 8, 8, 3, 0, 9, 0, 0.96],
[1, 184, 156, 15, 13, 2, 1, 1, 7, 1, 0, 0, 0, 0, 0, 0, 0, 1, 58, 120, 14, 139, 9, 11, 10, 12, 4, 6, 3, 2.27],
[1, 184, 156, 15, 13, 2, 1, 1, 7, 1, 0, 0, 0, 0, 0, 0, 13, 44, 91, 32, 13, 139, 9, 11, 10, 12, 4, 6, 3, 3.69],
[1, 184, 156, 15, 13, 2, 1, 1, 7, 1, 0, 0, 0, 0, 0, 0, 0, 0, 57, 79, 57, 139, 9, 11, 10, 12, 4, 6, 3, 1.60],
[0, 22, 20, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 8, 8, 1, 1, 0, 2, 1, 2, 0.34],
[0, 22, 20, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 8, 8, 1, 1, 0, 2, 1, 2, 0.54],
[0, 22, 20, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 8, 8, 1, 1, 0, 2, 1, 2, 0.23],
[0, 32, 18, 14, 14, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 35, 1, 1, 0, 2, 1, 1, 4, 0.53],
[0, 32, 18, 14, 14, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 36, 35, 1, 1, 0, 2, 1, 1, 4, 0.84],
[0, 32, 18, 14, 14, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 35, 1, 1, 0, 2, 1, 1, 4, 0.37],
[0, 34, 18, 14, 14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 38, 27, 8, 1, 1, 1, 1, 4, 3, 0.58],
[0, 34, 18, 14, 14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 5, 33, 27, 8, 1, 1, 1, 1, 4, 3, 0.91],
[0, 34, 18, 14, 14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 27, 8, 1, 1, 1, 1, 4, 3, 0.40],
[0, 46, 26, 14, 14, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 34, 34, 7, 1, 1, 1, 1, 4, 7, 0.83],
[0, 46, 26, 14, 14, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 10, 24, 34, 7, 1, 1, 1, 1, 4, 7, 1.27],
[0, 46, 26, 14, 14, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 34, 7, 1, 1, 1, 1, 4, 7, 0.58],
[0, 104, 64, 16, 16, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 45, 9, 75, 12, 1, 3, 3, 6, 2, 5, 2.04],
[0, 104, 64, 16, 16, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 45, 5, 4, 75, 12, 1, 3, 3, 6, 2, 5, 3.17],
[0, 104, 64, 16, 16, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 0, 54, 75, 12, 1, 3, 3, 6, 2, 5, 1.41],
[0, 106, 73, 27, 27, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84, 41, 4, 95, 17, 10, 1, 3, 2, 1, 0, 2.18],
[0, 106, 73, 27, 27, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84, 41, 2, 2, 95, 17, 10, 1, 3, 2, 1, 0, 3.38],
[0, 106, 73, 27, 27, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84, 0, 45, 95, 17, 10, 1, 3, 2, 1, 0, 1.51],
[9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15],
[9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.22],
[9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.11],
[0, 558, 258, 21, 20, 112, 5, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 6, 326, 0, 89, 166, 127, 45, 21, 15, 17, 13, 17, 3.81],
[0, 558, 258, 21, 20, 112, 5, 4, 2, 0, 0, 0, 0, 0, 0, 0, 6, 0, 326, 80, 9, 166, 127, 45, 21, 15, 17, 13, 17, 5.64],
[0, 558, 258, 21, 20, 112, 5, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 326, 89, 166, 127, 45, 21, 15, 17, 13, 17, 2.88],
[8, 1321, 527, 57, 20, 206, 10, 10, 91, 0, 0, 0, 0, 0, 0, 0, 0, 145, 564, 140, 71, 543, 150, 74, 51, 51, 32, 16, 3, 5.47],
[8, 1321, 527, 57, 20, 206, 10, 10, 91, 0, 0, 0, 0, 0, 0, 145, 0, 0, 588, 146, 41, 543, 150, 74, 51, 51, 32, 16, 3, 8.15],
[8, 1321, 527, 57, 20, 206, 10, 10, 91, 0, 0, 0, 0, 0, 0, 0, 0, 0, 145, 588, 187, 543, 150, 74, 51, 51, 32, 16, 3, 3.97],
[0, 63, 53, 8, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 31, 51, 1, 2, 4, 3, 0, 3, 2, 1.06],
[0, 63, 53, 8, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 25, 6, 51, 1, 2, 4, 3, 0, 3, 2, 1.72],
[0, 63, 53, 8, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 31, 51, 1, 2, 4, 3, 0, 3, 2, 0.73],
[0, 90, 49, 5, 0, 10, 1, 2, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 29, 38, 15, 5, 3, 3, 5, 5, 3, 1.56],
[0, 90, 49, 5, 0, 10, 1, 2, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 29, 0, 38, 15, 5, 3, 3, 5, 5, 3, 2.41],
[0, 90, 49, 5, 0, 10, 1, 2, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 29, 38, 15, 5, 3, 3, 5, 5, 3, 1.08],
[0, 121, 59, 49, 11, 0, 0, 5, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 67, 7, 83, 13, 5, 4, 6, 14, 7, 4, 2.72],
[0, 121, 59, 49, 11, 0, 0, 5, 13, 0, 0, 0, 0, 0, 0, 0, 0, 62, 67, 6, 1, 83, 13, 5, 4, 6, 14, 7, 4, 4.36],
[0, 121, 59, 49, 11, 0, 0, 5, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 67, 7, 83, 13, 5, 4, 6, 14, 7, 4, 1.93],
[0, 141, 77, 36, 34, 2, 4, 3, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 126, 37, 4, 80, 7, 15, 19, 12, 13, 9, 13, 2.94],
[0, 141, 77, 36, 34, 2, 4, 3, 13, 1, 0, 0, 0, 0, 0, 0, 0, 126, 37, 4, 0, 80, 7, 15, 19, 12, 13, 9, 13, 4.55],
[0, 141, 77, 36, 34, 2, 4, 3, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 126, 37, 4, 80, 7, 15, 19, 12, 13, 9, 13, 2.12],
[0, 32, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 8, 38, 2, 4, 1, 1, 1, 0, 0, 0.93],
[0, 32, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 8, 38, 2, 4, 1, 1, 1, 0, 0, 1.47],
[0, 32, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 8, 38, 2, 4, 1, 1, 1, 0, 0, 0.63],
[0, 96, 76, 4, 6, 4, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 79, 0, 16, 47, 11, 2, 12, 13, 6, 4, 1, 1.97],
[0, 96, 76, 4, 6, 4, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 79, 0, 16, 47, 11, 2, 12, 13, 6, 4, 1, 2.96],
[0, 96, 76, 4, 6, 4, 4, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 16, 47, 11, 2, 12, 13, 6, 4, 1, 1.41],
[0, 78, 77, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 61, 15, 48, 2, 6, 1, 2, 1, 5, 13, 1.27],
[0, 78, 77, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 61, 0, 15, 48, 2, 6, 1, 2, 1, 5, 13, 2.05],
[0, 78, 77, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 18, 58, 48, 2, 6, 1, 2, 1, 5, 13, 0.87],
[0, 144, 78, 0, 2, 32, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 40, 65, 6, 68, 3, 2, 6, 11, 18, 1, 3, 2.47],
[0, 144, 78, 0, 2, 32, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 40, 65, 3, 3, 68, 3, 2, 6, 11, 18, 1, 3, 3.98],
[0, 144, 78, 0, 2, 32, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 40, 16, 55, 68, 3, 2, 6, 11, 18, 1, 3, 1.73],
[0, 205, 64, 2, 2, 47, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 39, 65, 5, 98, 7, 2, 4, 1, 1, 0, 1, 3.58],
[0, 205, 64, 2, 2, 47, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 3, 39, 65, 2, 3, 98, 7, 2, 4, 1, 1, 0, 1, 5.66],
[0, 205, 64, 2, 2, 47, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 42, 12, 58, 98, 7, 2, 4, 1, 1, 0, 1, 2.61],
[0, 168, 87, 75, 63, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 127, 25, 148, 24, 14, 10, 9, 10, 5, 11, 1.51],
[0, 168, 87, 75, 63, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 119, 91, 21, 148, 24, 14, 10, 9, 10, 5, 11, 2.31],
[0, 168, 87, 75, 63, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 119, 112, 148, 24, 14, 10, 9, 10, 5, 11, 1.08],
[0, 357, 211, 70, 70, 16, 22, 22, 0, 1, 0, 0, 0, 0, 0, 0, 0, 38, 325, 34, 12, 301, 16, 13, 9, 22, 27, 6, 16, 3.32],
[0, 357, 211, 70, 70, 16, 22, 22, 0, 1, 0, 0, 0, 0, 0, 38, 0, 0, 329, 40, 2, 301, 16, 13, 9, 22, 27, 6, 16, 5.18],
[0, 357, 211, 70, 70, 16, 22, 22, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 38, 329, 42, 301, 16, 13, 9, 22, 27, 6, 16, 2.33],
[0, 645, 321, 1, 1, 116, 16, 14, 30, 0, 0, 0, 0, 0, 0, 0, 0, 201, 260, 19, 18, 256, 31, 45, 56, 58, 40, 12, 0, 5.80],
[0, 645, 321, 1, 1, 116, 16, 14, 30, 0, 0, 0, 0, 0, 0, 201, 0, 0, 265, 30, 2, 256, 31, 45, 56, 58, 40, 12, 0, 9.28],
[0, 645, 321, 1, 1, 116, 16, 14, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 201, 265, 32, 256, 31, 45, 56, 58, 40, 12, 0, 4.03],
[0, 720, 412, 60, 60, 101, 10, 10, 0, 1, 0, 0, 0, 0, 4, 0, 0, 426, 206, 15, 0, 411, 10, 29, 11, 37, 42, 60, 52, 6.91],
[0, 720, 412, 60, 60, 101, 10, 10, 0, 1, 0, 0, 4, 0, 0, 426, 0, 0, 214, 7, 0, 411, 10, 29, 11, 37, 42, 60, 52, 11.38],
[0, 720, 412, 60, 60, 101, 10, 10, 0, 1, 0, 0, 0, 0, 0, 4, 0, 0, 426, 214, 7, 411, 10, 29, 11, 37, 42, 60, 52, 4.79],
[0, 1089, 744, 220, 220, 59, 1, 0, 1, 7, 0, 1, 143, 0, 8, 690, 0, 391, 0, 4, 0, 765, 137, 91, 79, 71, 35, 30, 36, 13.22],
[0, 1089, 744, 220, 220, 59, 1, 0, 1, 7, 30, 114, 154, 544, 0, 115, 276, 0, 0, 4, 0, 765, 137, 91, 79, 71, 35, 30, 36, 20.64],
[0, 1089, 744, 220, 220, 59, 1, 0, 1, 7, 0, 0, 30, 114, 0, 154, 544, 0, 391, 0, 4, 765, 137, 91, 79, 71, 35, 30, 36, 9.55],
[1, 586, 515, 1, 1, 30, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 305, 173, 66, 342, 97, 83, 15, 14, 5, 0, 0, 3.10],
[1, 586, 515, 1, 1, 30, 5, 5, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 305, 201, 38, 342, 97, 83, 15, 14, 5, 0, 0, 4.52],
[1, 586, 515, 1, 1, 30, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 305, 239, 342, 97, 83, 15, 14, 5, 0, 0, 2.31],
[0, 90, 65, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 70, 42, 90, 10, 3, 3, 2, 4, 1, 1, 1.09],
[0, 90, 65, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 57, 42, 13, 90, 10, 3, 3, 2, 4, 1, 1, 1.71],
[0, 90, 65, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 57, 55, 90, 10, 3, 3, 2, 4, 1, 1, 0.75],
[0, 158, 112, 18, 18, 12, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 103, 26, 124, 15, 11, 8, 4, 1, 0, 0, 2.10],
[0, 158, 112, 18, 18, 12, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 88, 35, 6, 124, 15, 11, 8, 4, 1, 0, 0, 3.35],
[0, 158, 112, 18, 18, 12, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 88, 41, 124, 15, 11, 8, 4, 1, 0, 0, 1.46],
[0, 224, 195, 19, 9, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 132, 82, 18, 138, 56, 20, 9, 7, 1, 0, 1, 3.13],
[0, 224, 195, 19, 9, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 132, 69, 28, 3, 138, 56, 20, 9, 7, 1, 0, 1, 5.13],
[0, 224, 195, 19, 9, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 132, 69, 31, 138, 56, 20, 9, 7, 1, 0, 1, 2.20],
[0, 321, 267, 27, 16, 8, 4, 6, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 226, 68, 36, 158, 58, 31, 31, 24, 12, 11, 5, 3.38],
[0, 321, 267, 27, 16, 8, 4, 6, 3, 0, 0, 0, 0, 0, 0, 0, 0, 226, 59, 22, 23, 158, 58, 31, 31, 24, 12, 11, 5, 5.27],
[0, 321, 267, 27, 16, 8, 4, 6, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 226, 57, 47, 158, 58, 31, 31, 24, 12, 11, 5, 2.57],
[4, 787, 430, 6, 13, 142, 4, 4, 33, 0, 0, 0, 0, 0, 0, 0, 0, 218, 320, 78, 15, 230, 70, 42, 50, 71, 90, 26, 52, 5.66],
[4, 787, 430, 6, 13, 142, 4, 4, 33, 0, 0, 0, 0, 0, 0, 218, 0, 320, 78, 6, 9, 230, 70, 42, 50, 71, 90, 26, 52, 9.31],
[4, 787, 430, 6, 13, 142, 4, 4, 33, 0, 0, 0, 0, 0, 0, 0, 0, 218, 320, 48, 45, 230, 70, 42, 50, 71, 90, 26, 52, 3.99],
[1, 31, 28, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 25, 20, 9, 3, 1, 0, 0, 0, 0, 0.60],
[1, 31, 28, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 17, 20, 9, 3, 1, 0, 0, 0, 0, 0.96],
[1, 31, 28, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 25, 20, 9, 3, 1, 0, 0, 0, 0, 0.41],
[1, 53, 52, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 23, 33, 17, 0, 0, 1, 2, 0, 0, 1.16],
[1, 53, 52, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 14, 9, 33, 17, 0, 0, 1, 2, 0, 0, 1.74],
[1, 53, 52, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 23, 33, 17, 0, 0, 1, 2, 0, 0, 0.83],
[1, 90, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 44, 13, 65, 24, 0, 0, 0, 0, 0, 0, 2.26],
[1, 90, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 40, 12, 5, 65, 24, 0, 0, 0, 0, 0, 0, 3.55],
[1, 90, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 40, 17, 65, 24, 0, 0, 0, 0, 0, 0, 1.65],
[2, 104, 97, 1, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 53, 3, 53, 47, 1, 0, 0, 0, 0, 0, 2.73],
[2, 104, 97, 1, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 50, 4, 2, 53, 47, 1, 0, 0, 0, 0, 0, 4.13],
[2, 104, 97, 1, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 50, 6, 53, 47, 1, 0, 0, 0, 0, 0, 2.06],
[0, 95, 50, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 70, 109, 15, 6, 6, 2, 1, 0, 0, 1.01],
[0, 95, 50, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 62, 8, 109, 15, 6, 6, 2, 1, 0, 0, 1.65],
[0, 95, 50, 45, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 70, 109, 15, 6, 6, 2, 1, 0, 0, 0.69],
[0, 145, 88, 57, 57, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 183, 18, 161, 21, 10, 5, 1, 1, 2, 0, 1.61],
[0, 145, 88, 57, 57, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 183, 16, 2, 161, 21, 10, 5, 1, 1, 2, 0, 2.65],
[0, 145, 88, 57, 57, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 183, 18, 161, 21, 10, 5, 1, 1, 2, 0, 1.11],
[0, 226, 157, 65, 61, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 131, 5, 220, 39, 5, 7, 9, 5, 1, 0, 2.73],
[0, 226, 157, 65, 61, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 150, 122, 13, 1, 220, 39, 5, 7, 9, 5, 1, 0, 4.61],
[0, 226, 157, 65, 61, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 122, 14, 220, 39, 5, 7, 9, 5, 1, 0, 1.86],
[1, 22, 10, 12, 12, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 28, 24, 0, 3, 3, 3, 0, 0, 0, 0.39],
[1, 22, 10, 12, 12, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 23, 24, 0, 3, 3, 3, 0, 0, 0, 0.62],
[1, 22, 10, 12, 12, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 31, 24, 0, 3, 3, 3, 0, 0, 0, 0.27],
[1, 38, 25, 9, 9, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 21, 31, 0, 4, 6, 2, 2, 0, 0, 0.74],
[1, 38, 25, 9, 9, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 23, 11, 10, 31, 0, 4, 6, 2, 2, 0, 0, 1.16],
[1, 38, 25, 9, 9, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 42, 31, 0, 4, 6, 2, 2, 0, 0, 0.52],
[1, 66, 34, 16, 16, 6, 2, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 40, 16, 16, 61, 1, 1, 4, 7, 1, 0, 0, 1.42],
[1, 66, 34, 16, 16, 6, 2, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 40, 16, 13, 3, 61, 1, 1, 4, 7, 1, 0, 0, 2.24],
[1, 66, 34, 16, 16, 6, 2, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 40, 1, 31, 61, 1, 1, 4, 7, 1, 0, 0, 0.99],
[1, 70, 37, 15, 12, 5, 2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 40, 16, 16, 52, 7, 3, 6, 2, 1, 4, 1, 1.50],
[1, 70, 37, 15, 12, 5, 2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 40, 16, 13, 3, 52, 7, 3, 6, 2, 1, 4, 1, 2.29],
[1, 70, 37, 15, 12, 5, 2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 40, 1, 31, 52, 7, 3, 6, 2, 1, 4, 1, 1.08],
[1, 85, 59, 3, 0, 9, 0, 0, 5, 3, 0, 0, 0, 0, 0, 0, 0, 0, 40, 16, 16, 50, 2, 5, 7, 3, 4, 4, 0, 1.90],
[1, 85, 59, 3, 0, 9, 0, 0, 5, 3, 0, 0, 0, 0, 0, 0, 0, 40, 16, 13, 3, 50, 2, 5, 7, 3, 4, 4, 0, 2.87],
[1, 85, 59, 3, 0, 9, 0, 0, 5, 3, 0, 0, 0, 0, 0, 0, 0, 0, 40, 1, 31, 50, 2, 5, 7, 3, 4, 4, 0, 1.39],
[1, 112, 49, 3, 0, 15, 0, 0, 11, 5, 0, 0, 0, 0, 0, 0, 0, 0, 40, 16, 16, 44, 12, 7, 1, 3, 5, 3, 2, 2.70],
[1, 112, 49, 3, 0, 15, 0, 0, 11, 5, 0, 0, 0, 0, 0, 0, 0, 40, 16, 13, 3, 44, 12, 7, 1, 3, 5, 3, 2, 4.01],
[1, 112, 49, 3, 0, 15, 0, 0, 11, 5, 0, 0, 0, 0, 0, 0, 0, 0, 40, 1, 31, 44, 12, 7, 1, 3, 5, 3, 2, 2.00],
[1, 262, 130, 10, 0, 18, 23, 0, 35, 3, 0, 0, 0, 0, 0, 0, 0, 182, 22, 8, 0, 73, 5, 37, 13, 40, 13, 26, 8, 7.31],
[1, 262, 130, 10, 0, 18, 23, 0, 35, 3, 0, 0, 0, 0, 0, 182, 0, 0, 24, 6, 0, 73, 5, 37, 13, 40, 13, 26, 8, 11.12],
[1, 262, 130, 10, 0, 18, 23, 0, 35, 3, 0, 0, 0, 0, 0, 0, 0, 0, 182, 24, 6, 73, 5, 37, 13, 40, 13, 26, 8, 5.46],
[0, 29, 24, 3, 3, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 17, 9, 0, 4, 1, 0, 0, 0, 0.53],
[0, 29, 24, 3, 3, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 17, 9, 0, 4, 1, 0, 0, 0, 0.83],
[0, 29, 24, 3, 3, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 17, 9, 0, 4, 1, 0, 0, 0, 0.36],
[0, 38, 33, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 29, 3, 4, 2, 2, 2, 0, 0, 0.74],
[0, 38, 33, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 29, 3, 4, 2, 2, 2, 0, 0, 1.14],
[0, 38, 33, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 29, 3, 4, 2, 2, 2, 0, 0, 0.51],
[0, 57, 52, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 29, 12, 49, 0, 0, 0, 6, 2, 2, 2, 1.23],
[0, 57, 52, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 31, 10, 49, 0, 0, 0, 6, 2, 2, 2, 1.91],
[0, 57, 52, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 41, 49, 0, 0, 0, 6, 2, 2, 2, 0.84],
[0, 78, 69, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 4, 12, 78, 0, 0, 1, 1, 4, 1, 1, 1.75],
[0, 78, 69, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 6, 10, 78, 0, 0, 1, 1, 4, 1, 1, 2.68],
[0, 78, 69, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 16, 78, 0, 0, 1, 1, 4, 1, 1, 1.22],
[0, 77, 66, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 6, 11, 66, 12, 1, 2, 2, 2, 1, 1, 1.75],
[0, 77, 66, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 8, 9, 66, 12, 1, 2, 2, 2, 1, 1, 2.65],
[0, 77, 66, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 17, 66, 12, 1, 2, 2, 2, 1, 1, 1.24],
[5, 81, 53, 10, 12, 3, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 59, 13, 7, 3, 6, 0, 0, 0, 0.65],
[5, 81, 53, 10, 12, 3, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 23, 59, 13, 7, 3, 6, 0, 0, 0, 1.02],
[5, 81, 53, 10, 12, 3, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 59, 13, 7, 3, 6, 0, 0, 0, 0.45],
[1, 646, 360, 1, 1, 89, 18, 20, 14, 2, 0, 0, 0, 0, 0, 0, 0, 0, 304, 193, 3, 166, 141, 43, 28, 41, 39, 26, 18, 4.58],
[1, 646, 360, 1, 1, 89, 18, 20, 14, 2, 0, 0, 0, 0, 0, 0, 0, 304, 193, 0, 3, 166, 141, 43, 28, 41, 39, 26, 18, 6.50],
[1, 646, 360, 1, 1, 89, 18, 20, 14, 2, 0, 0, 0, 0, 0, 0, 0, 0, 304, 0, 196, 166, 141, 43, 28, 41, 39, 26, 18, 3.58],
[1, 180, 2, 15, 31, 0, 1, 7, 91, 1, 0, 0, 0, 0, 0, 0, 0, 4, 141, 0, 0, 138, 2, 2, 0, 2, 0, 2, 0, 3.95],
[1, 180, 2, 15, 31, 0, 1, 7, 91, 1, 0, 0, 0, 0, 0, 4, 0, 141, 0, 0, 0, 138, 2, 2, 0, 2, 0, 2, 0, 6.69],
[1, 180, 2, 15, 31, 0, 1, 7, 91, 1, 0, 0, 0, 0, 0, 0, 0, 4, 141, 0, 0, 138, 2, 2, 0, 2, 0, 2, 0, 2.58],
[3, 1130, 635, 11, 8, 216, 15, 12, 8, 0, 0, 0, 0, 0, 0, 0, 10, 0, 606, 237, 51, 507, 256, 99, 21, 14, 7, 0, 0, 5.37],
[3, 1130, 635, 11, 8, 216, 15, 12, 8, 0, 0, 0, 0, 0, 0, 10, 0, 581, 227, 67, 19, 507, 256, 99, 21, 14, 7, 0, 0, 7.63],
[3, 1130, 635, 11, 8, 216, 15, 12, 8, 0, 0, 0, 0, 0, 0, 0, 0, 10, 581, 28, 285, 507, 256, 99, 21, 14, 7, 0, 0, 4.12],
[3, 546, 463, 71, 71, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 338, 201, 389, 116, 50, 18, 24, 6, 7, 4, 2.57],
[3, 546, 463, 71, 71, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 338, 179, 22, 389, 116, 50, 18, 24, 6, 7, 4, 3.58],
[3, 546, 463, 71, 71, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 338, 201, 389, 116, 50, 18, 24, 6, 7, 4, 2.01],
[4, 842, 643, 143, 131, 13, 9, 9, 12, 0, 0, 0, 0, 0, 0, 0, 4, 0, 592, 276, 87, 582, 198, 82, 26, 33, 14, 12, 12, 4.07],
[4, 842, 643, 143, 131, 13, 9, 9, 12, 0, 0, 0, 0, 0, 4, 0, 0, 592, 276, 74, 13, 582, 198, 82, 26, 33, 14, 12, 12, 5.76],
[4, 842, 643, 143, 131, 13, 9, 9, 12, 0, 0, 0, 0, 0, 0, 0, 0, 4, 592, 276, 87, 582, 198, 82, 26, 33, 14, 12, 12, 3.23],
[10, 1157, 635, 162, 162, 106, 70, 70, 0, 0, 0, 0, 0, 0, 0, 0, 96, 0, 964, 64, 80, 498, 370, 113, 65, 61, 36, 33, 28, 5.57],
[10, 1157, 635, 162, 162, 106, 70, 70, 0, 0, 0, 0, 0, 0, 96, 0, 0, 948, 80, 55, 25, 498, 370, 113, 65, 61, 36, 33, 28, 7.96],
[10, 1157, 635, 162, 162, 106, 70, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 948, 78, 82, 498, 370, 113, 65, 61, 36, 33, 28, 4.46],
[0, 140, 140, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 35, 7, 93, 8, 18, 5, 13, 0, 2, 0, 2.89],
[0, 140, 140, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 35, 4, 3, 93, 8, 18, 5, 13, 0, 2, 0, 4.64],
[0, 140, 140, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 0, 42, 93, 8, 18, 5, 13, 0, 2, 0, 1.86],
[0, 147, 117, 0, 2, 13, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 92, 33, 8, 86, 14, 9, 7, 8, 3, 4, 2, 3.54],
[0, 147, 117, 0, 2, 13, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 92, 33, 4, 4, 86, 14, 9, 7, 8, 3, 4, 2, 5.27],
[0, 147, 117, 0, 2, 13, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 92, 0, 41, 86, 14, 9, 7, 8, 3, 4, 2, 2.58],
[1, 44, 19, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 27, 61, 0, 2, 4, 1, 0, 0, 0, 0.61],
[1, 44, 19, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 27, 61, 0, 2, 4, 1, 0, 0, 0, 0.95],
[1, 44, 19, 25, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 68, 61, 0, 2, 4, 1, 0, 0, 0, 0.42],
[1, 115, 84, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 46, 0, 122, 12, 11, 0, 0, 0, 0, 0, 1.81],
[1, 115, 84, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 46, 0, 122, 12, 11, 0, 0, 0, 0, 0, 2.76],
[1, 115, 84, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 46, 122, 12, 11, 0, 0, 0, 0, 0, 1.27],
[1, 150, 99, 23, 23, 14, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 123, 34, 0, 97, 29, 20, 5, 2, 2, 0, 3, 2.46],
[1, 150, 99, 23, 23, 14, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 123, 34, 0, 97, 29, 20, 5, 2, 2, 0, 3, 3.68],
[1, 150, 99, 23, 23, 14, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 34, 97, 29, 20, 5, 2, 2, 0, 3, 1.77],
[1, 211, 74, 11, 11, 48, 12, 12, 0, 3, 0, 0, 0, 0, 0, 0, 0, 4, 131, 29, 0, 77, 30, 22, 10, 12, 6, 6, 4, 3.54],
[1, 211, 74, 11, 11, 48, 12, 12, 0, 3, 0, 0, 0, 0, 0, 4, 0, 0, 131, 29, 0, 77, 30, 22, 10, 12, 6, 6, 4, 5.23],
[1, 211, 74, 11, 11, 48, 12, 12, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 4, 131, 29, 77, 30, 22, 10, 12, 6, 6, 4, 2.61],
[0, 132, 106, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 14, 83, 14, 5, 70, 26, 4, 7, 5, 1, 3, 1, 3.43],
[0, 132, 106, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0, 0, 0, 14, 0, 12, 73, 16, 1, 70, 26, 4, 7, 5, 1, 3, 1, 5.27],
[0, 132, 106, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 26, 73, 17, 70, 26, 4, 7, 5, 1, 3, 1, 2.51],
[0, 49, 32, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 1, 52, 6, 6, 1, 0, 0, 0, 0, 0.95],
[0, 49, 32, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 1, 52, 6, 6, 1, 0, 0, 0, 0, 1.47],
[0, 49, 32, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 52, 6, 6, 1, 0, 0, 0, 0, 0.66],
[0, 66, 34, 32, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 36, 1, 85, 6, 5, 1, 0, 0, 0, 0, 1.40],
[0, 66, 34, 32, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 60, 32, 1, 85, 6, 5, 1, 0, 0, 0, 0, 2.16],
[0, 66, 34, 32, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 60, 33, 85, 6, 5, 1, 0, 0, 0, 0, 0.96],
[0, 116, 68, 22, 21, 11, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 22, 84, 10, 9, 77, 12, 10, 9, 5, 2, 7, 3, 2.25],
[0, 116, 68, 22, 21, 11, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 22, 0, 94, 7, 2, 77, 12, 10, 9, 5, 2, 7, 3, 3.67],
[0, 116, 68, 22, 21, 11, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 84, 19, 77, 12, 10, 9, 5, 2, 7, 3, 1.55],
[0, 151, 61, 41, 40, 22, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 100, 51, 11, 5, 101, 13, 16, 10, 7, 12, 7, 2, 3.23],
[0, 151, 61, 41, 40, 22, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 100, 0, 62, 4, 1, 101, 13, 16, 10, 7, 12, 7, 2, 5.29],
[0, 151, 61, 41, 40, 22, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 100, 51, 16, 101, 13, 16, 10, 7, 12, 7, 2, 2.24],
[1, 217, 106, 14, 16, 46, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 131, 37, 10, 5, 85, 16, 13, 20, 19, 13, 8, 10, 4.49],
[1, 217, 106, 14, 16, 46, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 131, 0, 47, 4, 1, 85, 16, 13, 20, 19, 13, 8, 10, 7.34],
[1, 217, 106, 14, 16, 46, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 131, 37, 15, 85, 16, 13, 20, 19, 13, 8, 10, 3.15],
[1, 311, 53, 25, 20, 84, 15, 13, 15, 1, 0, 0, 0, 0, 0, 16, 0, 173, 23, 10, 1, 75, 40, 13, 28, 23, 20, 13, 12, 6.60],
[1, 311, 53, 25, 20, 84, 15, 13, 15, 1, 0, 0, 0, 16, 0, 0, 173, 0, 33, 0, 1, 75, 40, 13, 28, 23, 20, 13, 12, 10.60],
[1, 311, 53, 25, 20, 84, 15, 13, 15, 1, 0, 0, 0, 0, 0, 0, 16, 0, 173, 23, 11, 75, 40, 13, 28, 23, 20, 13, 12, 4.69],
[1, 320, 46, 19, 21, 84, 25, 17, 16, 3, 0, 0, 0, 0, 0, 16, 0, 172, 25, 11, 0, 70, 40, 26, 28, 27, 19, 11, 6, 7.00],
[1, 320, 46, 19, 21, 84, 25, 17, 16, 3, 0, 0, 0, 16, 0, 0, 172, 0, 36, 0, 0, 70, 40, 26, 28, 27, 19, 11, 6, 11.06],
[1, 320, 46, 19, 21, 84, 25, 17, 16, 3, 0, 0, 0, 0, 0, 0, 16, 0, 172, 25, 11, 70, 40, 26, 28, 27, 19, 11, 6, 5.05],
[2, 107, 79, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 113, 91, 12, 9, 10, 4, 3, 2, 3, 1.13],
[2, 107, 79, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 108, 5, 91, 12, 9, 10, 4, 3, 2, 3, 1.76],
[2, 107, 79, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 113, 91, 12, 9, 10, 4, 3, 2, 3, 0.78],
[2, 145, 126, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 69, 4, 76, 97, 20, 16, 16, 10, 3, 0, 1, 1.64],
[2, 145, 126, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 73, 62, 14, 97, 20, 16, 16, 10, 3, 0, 1, 2.57],
[2, 145, 126, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 69, 80, 97, 20, 16, 16, 10, 3, 0, 1, 1.16],
[1, 132, 80, 18, 20, 11, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 65, 72, 96, 18, 12, 7, 6, 0, 0, 0, 1.19],
[1, 132, 80, 18, 20, 11, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 65, 1, 71, 96, 18, 12, 7, 6, 0, 0, 0, 1.86],
[1, 132, 80, 18, 20, 11, 6, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 137, 96, 18, 12, 7, 6, 0, 0, 0, 0.83],
[5, 944, 611, 16, 8, 142, 2, 1, 15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 514, 220, 59, 489, 155, 41, 27, 41, 23, 12, 6, 4.80],
[5, 944, 611, 16, 8, 142, 2, 1, 15, 1, 0, 0, 0, 0, 0, 0, 0, 514, 220, 34, 25, 489, 155, 41, 27, 41, 23, 12, 6, 7.51],
[5, 944, 611, 16, 8, 142, 2, 1, 15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 514, 220, 59, 489, 155, 41, 27, 41, 23, 12, 6, 3.57],
[10, 397, 214, 44, 16, 19, 13, 11, 38, 5, 0, 0, 0, 0, 0, 0, 108, 0, 98, 47, 96, 184, 38, 44, 18, 24, 18, 20, 8, 3.08],
[10, 397, 214, 44, 16, 19, 13, 11, 38, 5, 0, 0, 0, 0, 108, 0, 0, 98, 47, 76, 20, 184, 38, 44, 18, 24, 18, 20, 8, 4.98],
[10, 397, 214, 44, 16, 19, 13, 11, 38, 5, 0, 0, 0, 0, 0, 0, 0, 108, 98, 47, 96, 184, 38, 44, 18, 24, 18, 20, 8, 2.27],
[0, 550, 480, 70, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 0, 387, 177, 2, 519, 93, 3, 2, 1, 0, 1, 0, 4.68],
[0, 550, 480, 70, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 0, 0, 383, 178, 4, 1, 519, 93, 3, 2, 1, 0, 1, 0, 7.31],
[0, 550, 480, 70, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 383, 170, 13, 519, 93, 3, 2, 1, 0, 1, 0, 3.60],
[0, 226, 131, 87, 87, 1, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 283, 20, 0, 223, 24, 23, 27, 10, 3, 1, 0, 3.17],
[0, 226, 131, 87, 87, 1, 3, 3, 0, 0, 0, 0, 0, 0, 0, 8, 0, 283, 20, 0, 0, 223, 24, 23, 27, 10, 3, 1, 0, 5.01],
[0, 226, 131, 87, 87, 1, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 283, 0, 20, 223, 24, 23, 27, 10, 3, 1, 0, 2.15],
[1, 82, 48, 34, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 51, 86, 4, 7, 5, 8, 1, 4, 0, 1.12],
[1, 82, 48, 34, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 50, 1, 86, 4, 7, 5, 8, 1, 4, 0, 1.72],
[1, 82, 48, 34, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 51, 86, 4, 7, 5, 8, 1, 4, 0, 0.78],
[0, 159, 131, 24, 24, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 87, 27, 125, 23, 10, 7, 2, 4, 6, 3, 2.45],
[0, 159, 131, 24, 24, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 87, 27, 0, 125, 23, 10, 7, 2, 4, 6, 3, 3.96],
[0, 159, 131, 24, 24, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 87, 27, 125, 23, 10, 7, 2, 4, 6, 3, 1.70],
[1, 243, 226, 5, 7, 4, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 162, 75, 6, 110, 53, 19, 19, 19, 9, 7, 8, 3.78],
[1, 243, 226, 5, 7, 4, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 162, 75, 5, 1, 110, 53, 19, 19, 19, 9, 7, 8, 6.00],
[1, 243, 226, 5, 7, 4, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 162, 75, 6, 110, 53, 19, 19, 19, 9, 7, 8, 2.71],
[0, 152, 148, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 123, 0, 2, 76, 61, 1, 2, 4, 0, 0, 5, 3.38],
[0, 152, 148, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 123, 1, 1, 76, 61, 1, 2, 4, 0, 0, 5, 5.49],
[0, 152, 148, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 123, 2, 76, 61, 1, 2, 4, 0, 0, 5, 2.37],
[0, 184, 184, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 92, 88, 0, 2, 110, 68, 1, 0, 0, 1, 0, 3, 4.20],
[0, 184, 184, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 92, 0, 88, 1, 1, 110, 68, 1, 0, 0, 1, 0, 3, 7.11],
[0, 184, 184, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 92, 88, 2, 110, 68, 1, 0, 0, 1, 0, 3, 2.97],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 64, 0, 2, 165, 32, 2, 0, 0, 0, 7, 0, 4.57],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 0, 64, 1, 1, 165, 32, 2, 0, 0, 0, 7, 0, 7.85],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 64, 2, 165, 32, 2, 0, 0, 0, 7, 0, 3.29],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 64, 0, 2, 166, 33, 0, 0, 1, 3, 0, 3, 4.56],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 0, 64, 1, 1, 166, 33, 0, 0, 1, 3, 0, 3, 7.47],
[0, 207, 207, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 64, 2, 166, 33, 0, 0, 1, 3, 0, 3, 3.37],
[0, 206, 206, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 65, 0, 2, 100, 92, 6, 4, 3, 0, 0, 0, 4.66],
[0, 206, 206, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 0, 65, 1, 1, 100, 92, 6, 4, 3, 0, 0, 0, 7.55],
[0, 206, 206, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 65, 2, 100, 92, 6, 4, 3, 0, 0, 0, 3.50],
[0, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 21, 32, 0, 0, 0, 0, 0, 0, 0.65],
[0, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 34, 21, 32, 0, 0, 0, 0, 0, 0, 1.03],
[0, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 21, 32, 0, 0, 0, 0, 0, 0, 0.44],
[0, 82, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 32, 41, 57, 19, 0, 4, 0, 0, 1, 0, 1.10],
[0, 82, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 26, 15, 57, 19, 0, 4, 0, 0, 1, 0, 1.73],
[0, 82, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 73, 57, 19, 0, 4, 0, 0, 1, 0, 0.76],
[0, 143, 143, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 84, 19, 24, 118, 2, 4, 2, 0, 14, 2, 0, 2.06],
[0, 143, 143, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 103, 20, 4, 118, 2, 4, 2, 0, 14, 2, 0, 3.30],
[0, 143, 143, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 84, 43, 118, 2, 4, 2, 0, 14, 2, 0, 1.45],
[1, 131, 107, 6, 1, 2, 0, 0, 13, 1, 0, 0, 0, 0, 0, 0, 0, 11, 66, 25, 25, 69, 33, 10, 10, 3, 1, 2, 0, 1.95],
[1, 131, 107, 6, 1, 2, 0, 0, 13, 1, 0, 0, 0, 0, 0, 0, 11, 0, 91, 14, 11, 69, 33, 10, 10, 3, 1, 2, 0, 3.00],
[1, 131, 107, 6, 1, 2, 0, 0, 13, 1, 0, 0, 0, 0, 0, 0, 0, 0, 11, 66, 50, 69, 33, 10, 10, 3, 1, 2, 0, 1.39],
[1, 141, 126, 6, 2, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 16, 83, 20, 23, 65, 31, 27, 12, 6, 0, 1, 0, 2.10],
[1, 141, 126, 6, 2, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 16, 0, 103, 19, 4, 65, 31, 27, 12, 6, 0, 1, 0, 3.20],
[1, 141, 126, 6, 2, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 83, 43, 65, 31, 27, 12, 6, 0, 1, 0, 1.52],
[0, 39, 32, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 17, 22, 9, 2, 1, 2, 0, 0, 1, 0.69],
[0, 39, 32, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 17, 22, 9, 2, 1, 2, 0, 0, 1, 1.10],
[0, 39, 32, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 22, 9, 2, 1, 2, 0, 0, 1, 0.46],
[0, 46, 38, 0, 2, 2, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 13, 14, 16, 22, 0, 1, 1, 3, 0, 3, 14, 0.90],
[0, 46, 38, 0, 2, 2, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 13, 14, 16, 22, 0, 1, 1, 3, 0, 3, 14, 1.49],
[0, 46, 38, 0, 2, 2, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 30, 22, 0, 1, 1, 3, 0, 3, 14, 0.58],
[0, 67, 64, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 27, 11, 35, 5, 1, 1, 2, 2, 8, 12, 1.25],
[0, 67, 64, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 9, 35, 5, 1, 1, 2, 2, 8, 12, 2.01],
[0, 67, 64, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 38, 35, 5, 1, 1, 2, 2, 8, 12, 0.84],
[1, 80, 59, 1, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 36, 24, 8, 31, 6, 2, 2, 2, 1, 11, 15, 1.51],
[1, 80, 59, 1, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 36, 25, 7, 31, 6, 2, 2, 2, 1, 11, 15, 2.44],
[1, 80, 59, 1, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 36, 32, 31, 6, 2, 2, 2, 1, 11, 15, 1.01],









        ]
        let zeroCoordinate = [];
        for (let i = 0; i < coordinates[0].length; ++i) {
            zeroCoordinate.push(0)
        }
        coordinates.push(zeroCoordinate)
        const TYPINGSECTIONCOUNT = typingSections.length
        const NOTECOUNT = notes.length
        const DRAINTIME = getDrainTimeV2(mergedNoteObjects);
        let coordinate = [TYPINGSECTIONCOUNT, NOTECOUNT]
        let typeCounters = countNumberOfObjects(mergedNoteObjects)
        for (let i = 0; i < typeCounters.length; ++i) {
            coordinate.push(typeCounters[i])
        }
        let durationCounters = countNumberOfDurations(mergedNoteObjects)
        for (let i = 0; i < durationCounters.length; ++i) {
            coordinate.push(durationCounters[i])
        }
        let distancesCounters = countNumberOfDistances(mergedNoteObjects)
        for (let i = 0; i < distancesCounters.length; ++i) {
            coordinate.push(distancesCounters[i])
        }
        coordinate.push(0)
        let distances = []
        let distancesFromOrigin = []
        let maxDistance = 0
        for (let i = 0; i < coordinates.length; ++i) {
            distances.push(0)
            for (let j = 0; j < coordinates[i].length - 1; ++j) {
                distances[i] += (coordinate[j] - coordinates[i][j]) * (coordinate[j] - coordinates[i][j])
            }
            distances[i] = distances[i]

            distancesFromOrigin.push(0)
            for (let j = 0; j < coordinates[i].length - 1; ++j) {
                distancesFromOrigin[i] += (0 - coordinates[i][j]) * (0 - coordinates[i][j])
            }
            distancesFromOrigin[i] = distancesFromOrigin[i]
            if (distancesFromOrigin[maxDistance] < distancesFromOrigin[i])
                maxDistance = i
        }

        let distanceFromOrigin = 0
        for (let i = 0; i < coordinate.length - 1; ++i) {
            distanceFromOrigin += (0 - coordinate[i]) * (0 - coordinate[i])
        }
        distanceFromOrigin = distanceFromOrigin

        if (distanceFromOrigin > distancesFromOrigin[maxDistance]) {
            const INCREASEFACTOR = Math.ceil(distanceFromOrigin) / distancesFromOrigin[maxDistance] + 1
            let fartherCoordinate = []
            for (let i = 0; i < coordinates[maxDistance].length; ++i) {
                fartherCoordinate.push(coordinates[maxDistance][i] * INCREASEFACTOR)
            }
            coordinates.push(fartherCoordinate)

            let fartherDistance = 0
            for (let i = 0; i < fartherCoordinate.length - 1; ++i) {
                fartherDistance += (coordinate[i] - fartherCoordinate[i]) * (coordinate[i] - fartherCoordinate[i])
            }
            fartherDistance = fartherDistance
            distances.push(fartherDistance)
        }

        let difficultyDensity = 0;
        let sumOfDistances = 0;


        for (let i = 0; i < distances.length; ++i) {
            difficultyDensity += coordinates[i][coordinates[i].length - 1] / (distances[i] + 1);
            sumOfDistances += 1 / (distances[i] + 1)
        }
        difficultyDensity = difficultyDensity / sumOfDistances


        //console.log(distances)

        let coordinateString = ""
        for (let i = 0; i < coordinate.length - 1; ++i) {
            if (coordinateString.length > 0)
                coordinateString += ", "
            coordinateString += coordinate[i]
        }
        //if (scoreData.ispp)
        //    console.log(scoreData.songName + " " + scoreData.difficultyTitle + ", " + coordinateString);



        let noteStartTimesForBuildUp = [];
        let noteBaseValuesForBuildUp = [];
        let noteMultiplierNames = ["Speed factor"];
        const calculateFactors = (difficultyObjects) => {
            return [calculateSpeed(difficultyObjects)];
        }
        let noteMultiplierValues = [];
        let avaliablecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204]];//, [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        let notecolors = [];

        for (let i = 0; i < mergedNoteObjects.length; ++i) {
            noteStartTimesForBuildUp.push(mergedNoteObjects[i].startTime);
            noteBaseValuesForBuildUp.push(1);
        }
        notecolors.push(avaliablecolors[0]);
        for (let i = 0; i < noteMultiplierNames.length; ++i) {
            noteMultiplierValues.push([]);
            notecolors.push(avaliablecolors[1 + i]);

            for (let j = 0; j < mergedNoteObjects.length; ++j) {
                noteMultiplierValues[i].push(1);
            }
        }
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = [];
        let typingSectionMultiplierValues = [];

        let leftHandIds = [];
        let rightHandIds = [];

        return {
            difficultyDensity: difficultyDensity, noteStartTimesForBuildUp: noteStartTimesForBuildUp, noteBaseValuesForBuildUp: noteBaseValuesForBuildUp,
            noteMultiplierNames: noteMultiplierNames, noteMultiplierValues: noteMultiplierValues, notecolors: notecolors,
            typingSectionBaseValuesForBuildUp: typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames: typingSectionMultiplierNames,
            typingSectionMultiplierValues: typingSectionMultiplierValues, leftHandIds: leftHandIds, rightHandIds: rightHandIds
        };
    }
}

reworks.push(valerusReworkV3Compressed);