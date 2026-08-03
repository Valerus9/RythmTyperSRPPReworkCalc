let valerusReworkV2_1Compressed = {
    name: "Valers9 rework v2.1",
    creator: "Valerus9",
    pp: {
        calculate(scoreData)
        {
            const acc = scoreData.accuracy / 100;
            let result =valerusReworkV2_1Compressed.innerCalculate(scoreData).difficultyDensity;
            //result = Math.pow(result, 1.1);            
            return result * 10 * Math.pow(acc, 5);
        }
    },
    sr: {

        calculate(scoreData)
        {
            let result =valerusReworkV2_1Compressed.innerCalculate(scoreData).difficultyDensity;  
            //result = Math.pow(result, 1.05);
            //result *= 1.15;
            return result / 2.6;
        }
    },
    buildup:
    {
        calculate(scoreData)
        {
            result = valerusReworkV2_1Compressed.innerCalculate(scoreData);
            return result;
        }
    },
    handseparation:
    {
        calculate(scoreData)
        {
            result = valerusReworkV2_1Compressed.innerCalculate(scoreData);
            return result;
        }
    },
    innerCalculate(scoreData)
    {
        const TAPNOTEDIFFICULTY = 0.01;
        const HOLDNOTEDIFFICULTY = 0.01;
        const RELEASEDIFFICULTY = 0.01;
        const TYPINGSECTIONDIFFICULTY = 0.02;

        const copyObject = (x) => {
            let temp = {};
            let xkeys =Object.keys(x);
            for (let i = 0; i < xkeys.length; ++i)
            {
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
            for (let i = 1; i <mergedNoteObjects.length; ++i)
            {
                console.log(i);
                drainTime += Math.min(mergedNoteObjects[i].startTime - mergedNoteObjects[i - 1].startTime, 5000);
            }
            return Math.max(drainTime,1000);
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

        const createDifficultyObjectFromTS = (x) => {
            let selectedTypingSection = x;
            let tempDifficultyObject = {
                type: "typingsection",
                startTime: selectedTypingSection.startTime,
                endTime: selectedTypingSection.endTime,
                textUniqueKeys: [],
                textKeysPositions: [],
            }
            for (let textIndexer = 0; textIndexer < selectedTypingSection.text.length; ++textIndexer) {
                let tempKeyPosition =
                {
                    row: getKeyboardRow(selectedTypingSection.text[textIndexer]),
                    column: getKeyboardColumn(selectedTypingSection.text[textIndexer]),
                }
                if (!tempDifficultyObject.textUniqueKeys.includes(selectedTypingSection.text[textIndexer])) {
                    tempDifficultyObject.textUniqueKeys.push(selectedTypingSection.text[textIndexer]);
                }
                if (tempKeyPosition.column == -1)
                    continue;
                tempDifficultyObject.textKeysPositions.push(tempKeyPosition);
            }
            return tempDifficultyObject;
        }

        const calculateDistance = (x1, y1, x2, y2) => {
            return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
        }
        const distanceBetweenObjects = (difficultyObject1, difficultyObject2) => {
            let vectorDistance = distanceBetweenObjectsVector(difficultyObject1, difficultyObject2);
            return Math.sqrt(Math.pow(vectorDistance.x, 2) + Math.pow(vectorDistance.y, 2));
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
            for (let i = 0; i < chordObject.keyPositions.length; ++i)
            {
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
            for (let i = 0; i < keyIndexes.length; ++i)
            {
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
            for (let i = 0; i < unsortedArray.length - 1; ++i)
            {
                for (let j = i + 1; j < unsortedArray.length; ++j)
                {
                    if (parameterToUse(unsortedArray[i], unsortedArray[j]))
                    {
                        let temp = copyObject(unsortedArray[i]);
                        unsortedArray[i] = copyObject(unsortedArray[j]);
                        unsortedArray[j] = copyObject(temp);
                    }
                }
            }
        }

        const handSegregationScoring = (leftHandPosition, rightHandPosition, nextObject) =>
        {
            let originalLeftHandPosition = {
                type: "",
                keyPosition: {
                    row: 2,
                    column: 2
                }
            }

            let originalRightHandPosition = {
                type: "",
                keyPosition: {
                    row: 2,
                    column: 7
                }
            }

            

            let leftHandDistance = distanceBetweenObjects(leftHandPosition, nextObject);
            let leftHandTime = Math.min(nextObject.startTime - leftHandPosition.startTime, 1200);
            let leftVelocity = leftHandDistance / leftHandTime;
            let leftHandDistanceNerf = nextObject.keyPosition.column / 10 + 1

            let rightHandDistance = distanceBetweenObjects(rightHandPosition, nextObject);
            let rightHandTime = Math.min(nextObject.startTime - leftHandPosition.startTime, 1200);
            let rightVelocity = rightHandDistance / rightHandTime;
            let rightHandDistanceNerf = (9 - nextObject.keyPosition.column) / 10 + 1

            originalLeftHandDistance = distanceBetweenObjects(originalLeftHandPosition, nextObject);
            originalRightHandDistance = distanceBetweenObjects(originalRightHandPosition, nextObject);

            

            //return { leftHandScore: leftVelocity * leftHandDistanceNerf, rightHandScore: rightVelocity * rightHandDistanceNerf}

            return { leftHandScore: leftVelocity, rightHandScore: rightVelocity}
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
            for (let i = 0; i < chord.keyPositions.length; ++i)
            {
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
            let chordSizes = getChordSize(difficultyChord);
            if (chordSizes.width == 1 || (chordSizes.height == 1 && chordSizes.width < 5))
            {
                let sumRow = 0;
                let sumColumn = 0;
                for (let i = 0; i < difficultyChord.keyPositions.length; ++i)
                {
                    sumRow += difficultyChord.keyPositions[i].row;
                    sumColumn += difficultyChord.keyPositions[i].column;
                }
                let chordPosition = {
                    startTime: difficultyChord.startTime,
                    keyPosition: {
                        row: sumRow / difficultyChord.keyPositions.length,
                        column: sumColumn / difficultyChord.keyPositions.length,
                    }
                }
                let handScoring = handSegregationScoring(leftHandPosition, rightHandPosition, chordPosition)
                if (handScoring.leftHandScore < handScoring.rightHandScore)
                { 
                    for (let i = 0; i < difficultyChord.keyPositions.length; ++i)
                    {
                        leftHandChordIndexes.push(i);
                    }
                }
                else
                {
                    for (let i = 0; i < difficultyChord.keyPositions.length; ++i)
                    {
                        rightHandChordIndexes.push(i);
                    }
                }
            }
            else
            {
                for (let i = 0; i < difficultyChord.keyPositions.length; ++i) {
                    let leftHandDistance = 0;
                    let rightHandDistance = 0;
                    let x1 = leftHandPosition.keyPosition.row;
                    let x2 = difficultyChord.keyPositions[i].row;
                    let y1 = leftHandPosition.keyPosition.column;
                    let y2 = difficultyChord.keyPositions[i].column;
                    leftHandDistance = calculateDistance(x1, x2, y1, y2);
    
                    x1 = rightHandPosition.keyPosition.row;
                    y1 = rightHandPosition.keyPosition.column;
                    rightHandDistance = calculateDistance(x1, x2, y1, y2);
                    if (leftHandDistance <= rightHandDistance)
                    {
                        leftHandChordIndexes.push(i);
                    }
                    else
                    {
                        rightHandChordIndexes.push(i);
                    }
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
            for (let i = 0; i < leftHandChordIndexes.length; ++i)
            {
                newLeftHandPosition.keyPosition.row += difficultyChord.keyPositions[leftHandChordIndexes[i]].row;
                newLeftHandPosition.keyPosition.column += difficultyChord.keyPositions[leftHandChordIndexes[i]].column;
            }
            if (newLeftHandPosition.keyPosition.row != -2 || newLeftHandPosition.keyPosition.column != -2)
            {
                newLeftHandPosition.keyPosition.row += 2;
                newLeftHandPosition.keyPosition.column += 2;
                newLeftHandPosition.keyPosition.row = newLeftHandPosition.keyPosition.row / leftHandChordIndexes.length;
                newLeftHandPosition.keyPosition.column = newLeftHandPosition.keyPosition.column / leftHandChordIndexes.length;
            }
            else
            {
                newLeftHandPosition.keyPosition.row += leftHandPosition.keyPosition.row;
                newLeftHandPosition.keyPosition.column += leftHandPosition.keyPosition.column;
            }
            for (let i = 0; i < rightHandChordIndexes.length; ++i)
            {
                newRightHandPosition.keyPosition.row += difficultyChord.keyPositions[rightHandChordIndexes[i]].row;
                newRightHandPosition.keyPosition.column += difficultyChord.keyPositions[rightHandChordIndexes[i]].column;
            }
            if (newRightHandPosition.keyPosition.row != -2 || newRightHandPosition.keyPosition.column != -2)
            {
                newRightHandPosition.keyPosition.row += 2;
                newRightHandPosition.keyPosition.column += 2;
                newRightHandPosition.keyPosition.row = newRightHandPosition.keyPosition.row / rightHandChordIndexes.length;
                newRightHandPosition.keyPosition.column = newRightHandPosition.keyPosition.column / rightHandChordIndexes.length;
            }
            else
            {
                newRightHandPosition.keyPosition.row += rightHandPosition.keyPosition.row;
                newRightHandPosition.keyPosition.column += rightHandPosition.keyPosition.column;
            }

            let leftHandChord = createChordFromAlreadyExisting(difficultyChord,leftHandChordIndexes);
            let rightHandChord = createChordFromAlreadyExisting(difficultyChord,rightHandChordIndexes);

            return {rightHandPosition: newRightHandPosition, leftHandPosition: newLeftHandPosition, leftChord: leftHandChord, rightChord: rightHandChord};
        }

        const splitMapBetweenTwoHands =(mergedNoteObjects) => {
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

            for (let i = 0; i < mergedNoteObjects.length; ++i)
            {
                if (mergedNoteObjects[i].type.includes("chord"))
                {
                    let divided = divideChordsBetweenHandPositions(mergedNoteObjects[i], leftHandPosition, rightHandPosition);
                    if (divided.leftChord.keyPositions.length > 0)
                    {
                        leftHandPosition.keyPosition.row = divided.leftHandPosition.keyPosition.row;
                        leftHandPosition.keyPosition.column = divided.leftHandPosition.keyPosition.column;
                        leftMergedNoteObjects.push(divided.leftChord);
                        leftHandPosition.type = mergedNoteObjects[i].type.replace("chord","");
                        leftHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }
                    if (divided.rightChord.keyPositions.length > 0)
                    {
                        rightHandPosition.keyPosition.row = divided.rightHandPosition.keyPosition.row;
                        rightHandPosition.keyPosition.column = divided.rightHandPosition.keyPosition.column;
                        rightMergedNoteObjects.push(divided.rightChord);
                        rightHandPosition.type = mergedNoteObjects[i].type.replace("chord","");
                        rightHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }
                    
                }
                else
                {
                    let handScoring = handSegregationScoring(leftHandPosition, rightHandPosition, mergedNoteObjects[i]);

                    //if (leftHandDistance < rightHandDistance && originalRightHandDistance > 2)
                    if (handScoring.leftHandScore < handScoring.rightHandScore)
                    {
                        leftMergedNoteObjects.push(mergedNoteObjects[i]);
                        leftHandPosition.keyPosition.row = mergedNoteObjects[i].keyPosition.row;
                        leftHandPosition.keyPosition.column = mergedNoteObjects[i].keyPosition.column;
                        leftHandPosition.type = mergedNoteObjects[i].type;
                        leftHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }                        
                    else
                    {
                        rightMergedNoteObjects.push(mergedNoteObjects[i]);
                        rightHandPosition.keyPosition.row = mergedNoteObjects[i].keyPosition.row;
                        rightHandPosition.keyPosition.column = mergedNoteObjects[i].keyPosition.column;
                        rightHandPosition.type = mergedNoteObjects[i].type;
                        rightHandPosition.startTime = mergedNoteObjects[i].startTime;
                    }                        
                }
                /*if (rightHandPosition.keyPosition.column < 3)
                {
                    rightMergedNoteObjects.pop();
                    leftMergedNoteObjects.push(mergedNoteObjects[i]);                    
                    leftHandPosition.keyPosition.row = rightHandPosition.keyPosition.row;
                    leftHandPosition.keyPosition.column = rightHandPosition.keyPosition.column;
                    leftHandPosition.type = rightHandPosition.type;
                    
                    rightHandPosition.keyPosition.row = originalRightHandPosition.keyPosition.row;
                    rightHandPosition.keyPosition.column = originalRightHandPosition.keyPosition.column;
                    rightHandPosition.type = originalRightHandPosition.type;
                }
                if (leftHandPosition.keyPosition.column > 7)
                {
                    leftMergedNoteObjects.pop();
                    rightMergedNoteObjects.push(mergedNoteObjects[i]);
                    rightHandPosition.keyPosition.row = leftHandPosition.keyPosition.row;
                    rightHandPosition.keyPosition.column = leftHandPosition.keyPosition.column;
                    rightHandPosition.type = leftHandPosition.type;

                    leftHandPosition.keyPosition.row = originalLeftHandPosition.keyPosition.row;
                    leftHandPosition.keyPosition.column = originalLeftHandPosition.keyPosition.column;
                    leftHandPosition.type = originalLeftHandPosition.type;
                }*/
                if (rightHandPosition.keyPosition.column - leftHandPosition.keyPosition.column < 0)
                {
                    let tempPosition = {
                        type: rightHandPosition.type,
                        startTime: rightHandPosition.startTime,
                        keyPosition: {
                            row: rightHandPosition.keyPosition.row,
                            column: rightHandPosition.keyPosition.column
                        }
                    }
                    rightHandPosition.type = leftHandPosition.type
                    rightHandPosition.startTime = leftHandPosition.startTime
                    rightHandPosition.keyPosition.row = leftHandPosition.keyPosition.row
                    rightHandPosition.keyPosition.column = leftHandPosition.keyPosition.column

                    leftHandPosition.type = tempPosition.type
                    leftHandPosition.startTime = tempPosition.startTime
                    leftHandPosition.keyPosition.row = tempPosition.keyPosition.row
                    leftHandPosition.keyPosition.column = tempPosition.keyPosition.column

                    if (rightMergedNoteObjects.length == 0)
                    {
                        rightMergedNoteObjects.push(leftMergedNoteObjects.pop());
                    }
                    else if (leftMergedNoteObjects.length == 0)
                    {
                        leftMergedNoteObjects.push(rightMergedNoteObjects.pop());
                    }
                    else
                    {
                        let tempObject = rightMergedNoteObjects[rightMergedNoteObjects.length - 1];
                        rightMergedNoteObjects[rightMergedNoteObjects.length - 1] = leftMergedNoteObjects[leftMergedNoteObjects.length - 1]
                        leftMergedNoteObjects[leftMergedNoteObjects.length - 1] = tempObject;
                    }
                }
            }
            
            return { leftHand: leftMergedNoteObjects, rightHand: rightMergedNoteObjects};
        };

        const calculateRepeatedPatternNerf = (difficultyObjects) => {
            let keyPositionMatrix = [
                [], [], [], [], [], [], [], [], [], [],
                [], [], [], [], [], [], [], [], [], [],
                [], [], [], [], [], [], [], [], [], [],
            ];
            let layerAlreadyUsed = [];
            let repeatedPatternNerf = [];
            for (let i = 0; i < difficultyObjects.length; ++i) {
                repeatedPatternNerf.push(1);
                layerAlreadyUsed.push(false);
                for (let j = 0; j < keyPositionMatrix.length; ++j) {
                    keyPositionMatrix[j].push(-1);
                }
                let lastLayer = keyPositionMatrix[0].length - 1;
                if (difficultyObjects[i].type.includes("chord")) {
                    for (let j = 0; j < difficultyObjects[i].keyPositions.length; ++j) {
                        let row = difficultyObjects[i].keyPositions[j].row;
                        let column = difficultyObjects[i].keyPositions[j].column;
                        keyPositionMatrix[row * 10 + column][lastLayer] = difficultyObjects[i].startTime;
                    }
                }
                else if (difficultyObjects[i].type != "typingsection" && difficultyObjects[i].type != "anchor") {
                    let row = difficultyObjects[i].keyPosition.row;
                    let column = difficultyObjects[i].keyPosition.column;
                    keyPositionMatrix[row * 10 + column][lastLayer] = difficultyObjects[i].startTime;
                }
            }

            let filteredForPatterns = [];
            let alreadyUsedForPatterns = [];
            for (let i = 0; i < keyPositionMatrix[0].length; ++i) {
                if (!matrixLayerContainsKey(keyPositionMatrix, i))
                    continue;
                filteredForPatterns.push(i);
                alreadyUsedForPatterns.push(false);
            }
            let patterns = [];
            let previousCorrectBase = [];
            for (let i = 0; i < filteredForPatterns.length; ++i)
            {

                let noDataPattern = filteredForPatterns.slice(i, 40+i);
                let dataPattern = {
                    offsets: [],
                    positions: [],
                    values: [],
                    times: [],
                    types: [],
                    ids: []
                };
                dataPattern.offsets.push(matrixLayerGetKeyPosition(keyPositionMatrix, noDataPattern[0]));
                dataPattern.positions.push(matrixLayerGetKeyPosition(keyPositionMatrix, noDataPattern[0]));
                dataPattern.values.push(matrixLayerGetKeyValue(keyPositionMatrix, noDataPattern[0]));
                dataPattern.times.push(matrixLayerGetKeyValue(keyPositionMatrix, noDataPattern[0]));
                dataPattern.types.push(difficultyObjects[0].type);
                dataPattern.ids.push(noDataPattern[0]);
                let previous = 0;
                for (let j = 1; j < noDataPattern.length; ++j)
                {
                    let previousKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, noDataPattern[previous]);
                    let previousKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, noDataPattern[previous]);
                    let nextKeyValue = matrixLayerGetKeyValue(keyPositionMatrix, noDataPattern[j]);
                    let nextKeyPosition = matrixLayerGetKeyPosition(keyPositionMatrix, noDataPattern[j]);
                    if (distanceBetweenPositionsVector(previousKeyPosition, nextKeyPosition) > 3)
                    {
                        continue;
                    }                
                    dataPattern.offsets.push(distanceBetweenPositionsVector(previousKeyPosition, nextKeyPosition));
                    dataPattern.positions.push(nextKeyPosition);
                    dataPattern.values.push(nextKeyValue - previousKeyValue);
                    dataPattern.times.push(nextKeyValue);
                    dataPattern.types.push(difficultyObjects[j].type);
                    dataPattern.ids.push(noDataPattern[j]);
                    previous = j;
                }
                if (dataPattern.offsets.length == 1)
                    continue;
                patterns.push(dataPattern);
                previousCorrectBase.push(true);
            }
            for (let i = 0; i < patterns.length - 1; ++i)
            {
                let previousCorrect = previousCorrectBase.slice(0, previousCorrectBase.length -1);
                let patternLength = 2;
                let noMatch = false;
                let firstRound = true;
                while(!noMatch)
                {
                    noMatch = true;
                    let newCorrect = previousCorrect.slice(0, previousCorrect.length -1);
                    for (let j = i + 1; j < patterns.length; ++j)
                    {
                        if (patterns[j].offsets.length < patternLength)
                            newCorrect[j] = false;
                        if (!newCorrect[j])
                            continue;
                        for (let k = 0; k < patternLength; ++k)
                        {
                            if (k == 0)
                            {
                                if (patterns[i].types[k] != patterns[j].types[k])
                                {
                                    newCorrect[j] = false;
                                    break;
                                }
                                continue;
                            }
                            if (patterns[i].values[k] - 5 > patterns[j].values[k] || patterns[i].values[k] + 5 < patterns[j].values[k] 
                                || patterns[i].offsets[k].x != patterns[j].offsets[k].x || patterns[i].offsets[k].y != patterns[j].offsets[k].y
                                || patterns[i].types[k] != patterns[j].types[k])
                            {
                                newCorrect[j] = false;
                                break;
                            }
                        }
                        if (newCorrect[j])
                        {
                            noMatch = false;
                        }

                    }

                    if (noMatch)
                    {
                        if (firstRound)
                            break;   
                        break;
                    }


                    patternLength++;
                    firstRound = false;
                    previousCorrect = newCorrect.slice(0, newCorrect.length -1);
                }
                patternLength--;
                if (firstRound)
                    continue;
                if (patternLength > 2) {
                    let samePatternCount = 1;
                    for (let j = i + 1; j < previousCorrect.length ; ++j)
                    {
                        if (previousCorrect[j])
                            samePatternCount++
                    }
                    let appliedRepeatedPatternNerf = Math.min(Math.pow(1 / Math.pow(samePatternCount, 0.5), Math.max(patternLength - 2, 1)), 1);
                    for (let j = i + 1; j < previousCorrect.length; ++j) {
                        if (!previousCorrect[j])
                            continue;
                        for (let k = 0; k < patternLength; ++k) {
                            repeatedPatternNerf[patterns[j].ids[k]] = appliedRepeatedPatternNerf;
                        }
                    }
                }
                for (let j = 0; j < previousCorrect.length; ++j)
                {
                    if (previousCorrect[j])
                    {
                        patterns.splice(j, 1);
                        previousCorrect.splice(j , 1);
                        previousCorrectBase.splice(0,1);
                        j--;

                    }

                }
            }
            return repeatedPatternNerf;
        }

        const calculateSpeed = (difficultyObjects) => {
            let speed = [];
            if (difficultyObjects.length > 0)
                speed.push(1);
            let lastIndex = 0;
            let nerfBuffBuildUp = 0;
            for (let i = 1; i < difficultyObjects.length; ++i)
            {
                if (difficultyObjects[i].startTime - difficultyObjects[lastIndex].startTime == 0)
                {
                    speed.push(1);
                    continue;
                }   
                let individualSpeed = Math.max(difficultyObjects[i].startTime - difficultyObjects[lastIndex].startTime,0);
                individualSpeed = 250 / (individualSpeed + 100);
                nerfBuffBuildUp += (individualSpeed - 1) / 100;
                //speed.push(Math.pow(individualSpeed, 1.5));
                speed.push(1 + nerfBuffBuildUp);
                lastIndex = i;                
            }
            return speed;
        }
        const calculateStamina = (difficultyObjects, drainTime) => {
            let stamina = [];
            stamina.push(1);
            /*let staminaBuff = difficultyObjects.length   /( drainTime / 600);
            for (let i = 1; i < difficultyObjects.length; ++i)
            {
                stamina.push(staminaBuff);
            }*/
            let staminaBuff = Math.pow(Math.max((drainTime - 60000) / 60000, 1), 0.3);
            for (let i = 1; i < difficultyObjects.length; ++i)
            {
                stamina.push(staminaBuff);
            }
            return stamina;
        }

        const calculateRoll = (difficultyObjects) => {
            
        }

        const calculateChordDifficulty = (difficultyObjects) => {
            let chordDiff = [];
            for (let i = 0; i < difficultyObjects.length; ++i)
            {
                if (difficultyObjects[i].type.includes("chord"))
                {
                    let minRow = Infinity;
                    let maxRow = 0;
                    let minColumn = Infinity;
                    let maxColumn = 0;
                    for (let j = 0; j < difficultyObjects[i].keyPositions.length; ++j)
                    {
                        if (difficultyObjects[i].keyPositions[j].row < minRow)
                            minRow = difficultyObjects[i].keyPositions[j].row 
                        if (difficultyObjects[i].keyPositions[j].row > maxRow)
                            maxRow = difficultyObjects[i].keyPositions[j].row 
                        if (difficultyObjects[i].keyPositions[j].column < minColumn)
                            minColumn = difficultyObjects[i].keyPositions[j].column 
                        if (difficultyObjects[i].keyPositions[j].column > maxColumn)
                            maxColumn = difficultyObjects[i].keyPositions[j].column 
                    }
                    if (minRow == maxRow)
                    {
                        chordDiff.push(1 / difficultyObjects[i].keyPositions.length * (1 + (difficultyObjects[i].keyPositions.length / 10)));
                        continue;
                    }
                    
                    if (minColumn == maxColumn)
                    {
                        chordDiff.push(1 / difficultyObjects[i].keyPositions.length * (1 + (difficultyObjects[i].keyPositions.length / 10)));
                        continue;
                    }
                    chordDiff.push(1);
                }
                else
                {
                    chordDiff.push(1);
                }
            }
            return chordDiff;
        }

        const calculateDifficultySum = (difficultyObjects, drainTime, noteMultipliers) => {
            
            if (difficultyObjects.length == 0)
                return {difficultySum: 0};

            let difficultySum = 0;
            for (let i = 0; i < difficultyObjects.length; ++i)
            {
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
                for (let j = 0; j < noteMultipliers.length; ++j)
                {
                    multipliedDifficulty *= noteMultipliers[j][i];
                }
                difficultySum += multipliedDifficulty;
            }
            return {difficultySum: difficultySum};
        };

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

        //console.log(convertedNoteObjects);
        sortArray(convertedNoteObjects, (one, two) => {
            return one.startTime > two.startTime;
        })
        //console.log(convertedNoteObjects);

        
        

        let mergedNoteObjects = [];
        let merger = 0;

        for (let convertedIndexer = 1; convertedIndexer < convertedNoteObjects.length; ++convertedIndexer) 
        {
            let previousMerger = merger;
            if (convertedNoteObjects[merger].startTime != convertedNoteObjects[convertedIndexer].startTime) {
                merger = convertedIndexer;
            }
            if (previousMerger != merger)
            {
                if (merger - previousMerger == 1)
                {
                    mergedNoteObjects.push(convertedNoteObjects[previousMerger]);
                }
                else
                {
                    let mergedNotes = [];
                    for (let i = previousMerger; i < merger; ++i)
                    {
                        mergedNotes.push(convertedNoteObjects[i]);
                    }
                    if (mergedNotes.length == 0)
                    {

                    }
                    else if (mergedNotes.length == 1)
                    {
                        mergedNoteObjects.push(mergedNotes[0]);
                    }
                    else
                    {
                        mergedNoteObjects.push(createMergedNoteObject(mergedNotes, 0, mergedNotes.length));
                    }                    
                }
            }
        }

        //console.log(mergedNoteObjects);
        
        /*let objectCounts = {
            types: [],
            counts: []
        }
        for (let i = 0; i < mergedNoteObjects.length;++i)
        {
            if (!objectCounts.types.includes(mergedNoteObjects[i].type))
            {
                objectCounts.types.push(mergedNoteObjects[i].type);
                objectCounts.counts.push(1);
            }
            let indexType = objectCounts.types.indexOf(mergedNoteObjects[i].type);
            objectCounts.counts[indexType] += 1;
        }*/
        //console.log(scoreData.songName + " "+scoreData.difficultyTitle);
        //console.log(objectCounts);

        let splitMap = splitMapBetweenTwoHands(mergedNoteObjects);
        const LEFTDRAINTIME = getDrainTimeV2(splitMap.leftHand);
        const RIGHTDRAINTIME = getDrainTimeV2(splitMap.rightHand);
        const DRAINTIME = getDrainTimeV2(mergedNoteObjects);
        //console.log(splitMap);

        //Setup and calculate all the data.

        
        let noteStartTimesForBuildUp = [];
        let noteBaseValuesForBuildUp = [];
        let noteMultiplierNames = ["Speed factor"];//, "Repeated pattern nerf", "Stamina", "Chord difficulty"];
        let noteMultiplierValues = [];
        let avaliablecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204]];//, [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        let notecolors = [];

        for (let i = 0; i < mergedNoteObjects.length; ++i)
        {
            noteStartTimesForBuildUp.push(mergedNoteObjects[i].startTime);
            noteBaseValuesForBuildUp.push(1);
        }
        notecolors.push(avaliablecolors[0]);
        for (let i = 0; i < noteMultiplierNames.length; ++i)
        {
            noteMultiplierValues.push([]);
            notecolors.push(avaliablecolors[1+i]);

            for (let j = 0; j < mergedNoteObjects.length; ++j)
            {
                noteMultiplierValues[i].push(1);                
            }
        }
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = [];
        let typingSectionMultiplierValues = [];

        let leftNoteMultipliers = [calculateSpeed(splitMap.leftHand)];//, calculateStamina(splitMap.leftHand, LEFTDRAINTIME)];
            //, calculateRepeatedPatternNerf(splitMap.leftHand),
            //calculateStamina(splitMap.leftHand, LEFTDRAINTIME), calculateChordDifficulty(splitMap.leftHand)];
        //let leftNoteMultipliers = [];
        let leftResult = calculateDifficultySum(splitMap.leftHand, LEFTDRAINTIME, leftNoteMultipliers);
        for (let i = 0; i < splitMap.leftHand.length; ++i)
        {
            for (let j = 0; j < noteMultiplierNames.length; ++j)
            {
                noteMultiplierValues[j][splitMap.leftHand[i].id] = leftNoteMultipliers[j][i];
            }
        }

        let rightNoteMultipliers = [calculateSpeed(splitMap.rightHand)];//, calculateStamina(splitMap.rightHand, RIGHTDRAINTIME)];
            //, calculateRepeatedPatternNerf(splitMap.rightHand), 
            //calculateStamina(splitMap.rightHand, RIGHTDRAINTIME), calculateChordDifficulty(splitMap.rightHand)];
        //let rightNoteMultipliers = [];
        let rightResult = calculateDifficultySum(splitMap.rightHand, RIGHTDRAINTIME, rightNoteMultipliers);
        for (let i = 0; i < splitMap.rightHand.length; ++i)
        {
            for (let j = 0; j < noteMultiplierNames.length; ++j)
            {
                noteMultiplierValues[j][splitMap.rightHand[i].id] = rightNoteMultipliers[j][i];
            }
        }

        //console.log(leftNoteMultipliers);
        //console.log(rightNoteMultipliers);


        let leftDifficultyDensity = leftResult.difficultySum;
        let rightDifficultyDensity = rightResult.difficultySum;

        let difficultyDensity = (leftDifficultyDensity + rightDifficultyDensity);

        let leftHandIds = [];
        for (let i = 0; i < splitMap.leftHand.length; ++i)
        {
            if (splitMap.leftHand[i].type.includes("chord"))
            {
                for (let j = 0; j < splitMap.leftHand[i].ids.length; ++j)
                {
                    if (!leftHandIds.includes(splitMap.leftHand[i].ids[j]))
                    {
                        leftHandIds.push(splitMap.leftHand[i].ids[j]);
                    }
                }
            }
            else
            {
                if (!leftHandIds.includes(splitMap.leftHand[i].id))
                {
                    leftHandIds.push(splitMap.leftHand[i].id);
                }
            }
        }
        let rightHandIds = [];
        for (let i = 0; i < splitMap.rightHand.length; ++i)
        {
            if (splitMap.rightHand[i].type.includes("chord"))
            {
                for (let j = 0; j < splitMap.rightHand[i].ids.length; ++j)
                {
                    if (!rightHandIds.includes(splitMap.rightHand[i].ids[j]))
                    {
                        rightHandIds.push(splitMap.rightHand[i].ids[j]);
                    }
                }
            }
            else
            {
                if (!rightHandIds.includes(splitMap.rightHand[i].id))
                {
                    rightHandIds.push(splitMap.rightHand[i].id);
                }
            }
        }

        return {difficultyDensity: difficultyDensity, noteStartTimesForBuildUp: noteStartTimesForBuildUp, noteBaseValuesForBuildUp: noteBaseValuesForBuildUp,
             noteMultiplierNames: noteMultiplierNames, noteMultiplierValues: noteMultiplierValues, notecolors: notecolors,
             typingSectionBaseValuesForBuildUp:typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames: typingSectionMultiplierNames,
             typingSectionMultiplierValues: typingSectionMultiplierValues, leftHandIds: leftHandIds, rightHandIds: rightHandIds};
    }
}

reworks.push(valerusReworkV2_1Compressed);