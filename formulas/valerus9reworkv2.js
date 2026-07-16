let valerusReworkV2Compressed = {
    name: "Valers9 rework v2",
    creator: "Valerus9",
    pp: {
        calculate(scoreData)
        {
            const acc = scoreData.accuracy / 100;
            let result =valerusReworkV2Compressed.innerCalculate(scoreData)[0];
            result = Math.pow(result * 20, 0.8);
            return result * Math.pow(acc, 5);;
        }
    },
    sr: {

        calculate(scoreData)
        {
            let result =valerusReworkV2Compressed.innerCalculate(scoreData)[0];  
            result = Math.pow(result, 0.6);     
            //if (result > 5) {
            //    result = 5 * Math.pow(result / 5, 0.65);
            //}
            result *= 1.15;
            return result;
        }
    },
    buildup:
    {
        calculate(scoreData)
        {
            result = valerusReworkV2Compressed.innerCalculate(scoreData);
            result.splice(0,1);
            return result;
        }
    },
    innerCalculate(scoreData)
    {
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

        let filteredNotes = [];

        //first we filter out anything that is currently not handled by the rework
        for (let i = 0; i < scoreData.notes.length; ++i) {
            if (scoreData.notes[i].type == "tap") {
                if (getKeyboardColumn(scoreData.notes[i].key) == -1)
                    continue;
                let tempNote = {
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

        //Sort typingSections
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

        let createNewTempConvertedNote = (note) => {
            return {
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

        //start the conversion of placed objects into a more calculation friendly form
        let convertedNoteObjects = [];
        for (let i = 0; i < notes.length; ++i) {

            let tempConvertedNote = createNewTempConvertedNote(notes[i]);
            if (tempConvertedNote.keyPosition.column == -1)
                continue;

            if (notes[i].type == "hold") {
                tempConvertedNote.endTime = getStartTime(notes[i]);
                if (Math.abs(getEndTime(notes[i]) - getStartTime(notes[i])) < 150)
                {
                    tempConvertedNote.type = "tap";
                }
                else
                {
                    convertedNoteObjects.push(tempConvertedNote);
    
                    tempConvertedNote = createNewTempConvertedNote(notes[i]);
                    tempConvertedNote.type = "anchor";
                    convertedNoteObjects.push(tempConvertedNote);

                    tempConvertedNote = createNewTempConvertedNote(notes[i]);
                    tempConvertedNote.type = "release";
                    tempConvertedNote.startTime = getEndTime(notes[i]);
                }                
            }
            convertedNoteObjects.push(tempConvertedNote);
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
        for (let convertedIndexer = 1; convertedIndexer < convertedNoteObjects.length; ++convertedIndexer) {
            if (convertedNoteObjects[convertedIndexer].type == "anchor") {
                if (convertedIndexer - merger > 1) {
                    let tempMergedNoteObject = {
                        type: "",
                        keyPositions: [],
                        keyTypes: [],
                        startTime: convertedNoteObjects[merger].startTime,
                        endTime: convertedNoteObjects[merger].endTime,
                    }
                    for (let mergeIndexer = merger; mergeIndexer < convertedIndexer; ++mergeIndexer) {
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
                    }
                    mergedNoteObjects.push(tempMergedNoteObject);
                }
                else {
                    mergedNoteObjects.push(convertedNoteObjects[merger]);
                }
                mergedNoteObjects.push(convertedNoteObjects[convertedIndexer]);
                merger = convertedIndexer + 1;
                convertedIndexer += 1;
                continue;
            }
            if (convertedNoteObjects[merger].startTime != convertedNoteObjects[convertedIndexer].startTime) {
                if (convertedIndexer - merger > 1) {
                    let tempMergedNoteObject = {
                        type: "",
                        keyPositions: [],
                        keyTypes: [],
                        startTime: convertedNoteObjects[merger].startTime,
                        endTime: convertedNoteObjects[merger].endTime,
                    }
                    for (let mergeIndexer = merger; mergeIndexer < convertedIndexer; ++mergeIndexer) {
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
                    }
                    mergedNoteObjects.push(tempMergedNoteObject);
                }
                else {
                    mergedNoteObjects.push(convertedNoteObjects[merger]);
                }
                merger = convertedIndexer;
            }
        }
        if (merger < convertedNoteObjects.length) {
            if (convertedNoteObjects.length - merger > 1) {
                let tempMergedNoteObject = {
                    type: "",
                    keyPositions: [],
                    keyTypes: [],
                    startTime: convertedNoteObjects[merger].startTime,
                    endTime: convertedNoteObjects[merger].endTime,
                }
                for (let mergeIndexer = merger; mergeIndexer < convertedNoteObjects.length; ++mergeIndexer) {
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
                }
                mergedNoteObjects.push(tempMergedNoteObject);
            }
            else {
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

        let noteWhileIndexer = 0;
        let typingSectionWhileIndexer = 0;
        let difficultyObjects = [];
        while (noteWhileIndexer < mergedNoteObjects.length || typingSectionWhileIndexer < typingSections.length) {
            if (typingSections.length > typingSectionWhileIndexer && mergedNoteObjects.length > noteWhileIndexer) {

                if (mergedNoteObjects[noteWhileIndexer].startTime < typingSections[typingSectionWhileIndexer].startTime) {
                    difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                    noteWhileIndexer++;
                }
                else if (mergedNoteObjects[noteWhileIndexer].startTime > typingSections[typingSectionWhileIndexer].startTime) {
                    let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                    selectedTypingSection.type = "typingsection";
                    difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                    typingSectionWhileIndexer++;
                }
                else {
                    difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                    let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                    selectedTypingSection.type = "typingsection";
                    difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                    typingSectionWhileIndexer++;
                    noteWhileIndexer++;
                }

            }
            else if (typingSections.length <= typingSectionWhileIndexer && notes.length > noteWhileIndexer) {
                difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                noteWhileIndexer++;
            }
            else if (typingSections.length > typingSectionWhileIndexer && notes.length <= noteWhileIndexer) {
                let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                selectedTypingSection.type = "typingsection";
                difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                typingSectionWhileIndexer++;
            }
            else if (typingSections.length == 0 && notes.length > noteWhileIndexer) {
                difficultyObjects.push(mergedNoteObjects[noteWhileIndexer]);
                noteWhileIndexer++;
            }
            else if (typingSections.length > typingSectionWhileIndexer && notes.length == 0) {
                let selectedTypingSection = typingSections[typingSectionWhileIndexer];
                selectedTypingSection.type = "typingsection";
                difficultyObjects.push(createDifficultyObjectFromTS(selectedTypingSection));
                typingSectionWhileIndexer++;
            }
            else
                break;
        }

        const overallDifficulty = Math.min(scoreData.overallDifficulty, 11);
        const odnerf = 1 / (Math.pow(Math.max(9 - overallDifficulty, 0), 1.6) / 100 + 1);
        const odbonus = Math.pow(Math.max(overallDifficulty - 7, 0), 1.6) / 100 + 1;
        const odFactor = odbonus * odnerf;

        
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
        let keyPositionMatrix = [
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
            [], [], [], [], [], [], [], [], [], [],
        ];
        let layerAlreadyUsed = [];
        let repeatedPatternNerf = [];
        for (let i = 0; i < difficultyObjects.length; ++i) {
            for (let j = 0; j < keyPositionMatrix.length; ++j) {
                repeatedPatternNerf.push(1);
                layerAlreadyUsed.push(false);
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
            const amountOfNotes = chordObject.keyPositions.length;
            let chordDiff = 0;
            let chordCounter = 0;
            let horizontalPosition = -1;
            let horizontalCounter = 1;
            let chordWidthHeightThis = getChordWidthHeight(chordObject);
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
                    chordDiff += 2 / amountOfNotes;
                else if (chordHeight == 3 && counter == 3)
                    chordDiff += 3 / amountOfNotes;
                else if (chordHeight == 3 && counter == 2)
                {
                    chordDiff += 2.5 / amountOfNotes;
                    if (chordObject.keyPositions.length - verticalChordCounter < 1)
                    {
                        chordDiff -= 0.5 / amountOfNotes;
                    }
                }
                else
                {
                    if (chordCounter > 2 && chordWidthHeightThis.column > 3)
                        chordDiff += 0.1;
                    else
                        chordDiff += 0.05;
                    chordCounter++;
                }
                    
            }
            return chordDiff;
        }

        const divideChordsBetweenHandPositions = (difficultyChord, leftHandPosition, rightHandPosition) => {            
            let leftHandChord = [];
            let rightHandChord = [];
            for (let i = 0; i < difficultyChord.keyPositions.length; ++i) {
                let leftHandDistance = 0;
                let rightHandDistance = 0;
                let x1 = leftHandPosition.row;
                let x2 = difficultyChord.keyPositions[i].row;
                let y1 = leftHandPosition.column;
                let y2 = difficultyChord.keyPositions[i].column;
                leftHandDistance = calculateDistance(x1, x2, y1, y2);

                x1 = rightHandPosition.row;
                y1 = rightHandPosition.column;
                rightHandDistance = calculateDistance(x1, x2, y1, y2);
                if (leftHandDistance <= rightHandDistance)
                {
                    leftHandChord.push(i);
                }
                else
                {
                    rightHandChord.push(i);
                }
            }
            let newLeftHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: -2,
                    column: -2
                }
            }
            let newRightHandPosition = {
                type: "tap",
                keyPosition:
                {
                    row: -2,
                    column: -2
                }
            }
            for (let i = 0; i < leftHandChord.length; ++i)
            {
                newLeftHandPosition.row += difficultyChord.keyPositions[leftHandChord[i]].row;
                newLeftHandPosition.column += difficultyChord.keyPositions[leftHandChord[i]].column;
            }
            if (newLeftHandPosition.row != -2 || newLeftHandPosition.column != -2)
            {
                newLeftHandPosition.row += 2;
                newLeftHandPosition.column += 2;
            }
            newLeftHandPosition.row = newLeftHandPosition.row / leftHandChord.length;
            newLeftHandPosition.column = newLeftHandPosition.column / leftHandChord.length;
            for (let i = 0; i < rightHandChord.length; ++i)
            {
                newRightHandPosition.row += difficultyChord.keyPositions[rightHandChord[i]].row;
                newRightHandPosition.column += difficultyChord.keyPositions[rightHandChord[i]].column;
            }
            if (newRightHandPosition.row != -2 || newRightHandPosition.column != -2)
            {
                newRightHandPosition.row += 2;
                newRightHandPosition.column += 2;
            }
            newRightHandPosition.row = newRightHandPosition.row / rightHandChord.length;
            newRightHandPosition.column = newRightHandPosition.column / rightHandChord.length;

            return [newRightHandPosition, newLeftHandPosition, rightHandChord.length, leftHandChord.length];
        }



        const TAPNOTEDIFFICULTY = 48;
        const HOLDNOTEDIFFICULTY = 30;
        const RELEASEDIFFICULTY = 30;
        const TYPINGSECTIONDIFFICULTY = 20;

        let lastNonTypingSectionIndex = -1;
        let noteStartTimesForBuildUp = [];
        let noteBaseValuesForBuildUp = [];

        let noteMultiplierNames = ["Speed factor", "Repeated pattern nerf"];
        let noteMultiplierValues = [];
        let avaliablecolors = [[94, 140, 105], [70, 235, 52], [8, 189, 131], [191, 224, 27], [212, 132, 47], [111, 78, 204], [128, 31, 135], [0, 247, 231], [28, 22, 186]];
        let notecolors = [];
        for (let i = 0; i < noteMultiplierNames.length; ++i)
        {
            noteMultiplierValues.push([]);
            notecolors.push(avaliablecolors[i]);
        }
        let typingSectionBaseValuesForBuildUp = [];
        let typingSectionMultiplierNames = [];
        let typingSectionMultiplierValues = [];

        let difficultySum = 0;

        let typingSectionCounter = 0;
        
        for (let difficultyIndexer = 0; difficultyIndexer < difficultyObjects.length; ++difficultyIndexer) {
            let selectedObject = difficultyObjects[difficultyIndexer];
            let calculatedDifficulty = 0;
            
            if (selectedObject.type == "typingsection") {
                calculatedDifficulty = TYPINGSECTIONDIFFICULTY * Math.pow(selectedObject.textUniqueKeys.length,0.75);
                
            }

            if (selectedObject.type == "anchor") {
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


            if (difficultyIndexer != 0) {
                let previousNonAnchorIndexer = difficultyIndexer - 1;
                while (difficultyObjects[previousNonAnchorIndexer].type == "anchor") {
                    previousNonAnchorIndexer--;
                }
            }
            let chordDifficulty = 0;
            if (selectedObject.type.includes("mixedchord")) {
                chordDifficulty = 0;
                for (let i = 0; i < selectedObject.keyTypes.length; ++i) {
                    if (selectedObject.keyTypes[i] == "tap")
                        chordDifficulty += TAPNOTEDIFFICULTY;
                    if (selectedObject.keyTypes[i] == "hold")
                        chordDifficulty += HOLDNOTEDIFFICULTY;
                    if (selectedObject.keyTypes[i] == "release")
                        chordDifficulty += RELEASEDIFFICULTY;
                }
                calculatedDifficulty += chordDifficulty * 0.75 * calculateChordDifficulty(selectedObject);
            }
            if (selectedObject.type.includes("chord") && !selectedObject.type.includes("mixedchord")) {
                chordDifficulty = 1
                if (selectedObject.type.includes("tap"))
                    chordDifficulty = TAPNOTEDIFFICULTY;
                if (selectedObject.type.includes("hold"))
                    chordDifficulty = HOLDNOTEDIFFICULTY;
                if (selectedObject.type.includes("release"))
                    chordDifficulty = RELEASEDIFFICULTY;
                calculatedDifficulty += chordDifficulty * 0.75 * selectedObject.keyPositions.length * calculateChordDifficulty(selectedObject);
            }
           
            if (selectedObject.type == "tap")
                calculatedDifficulty += TAPNOTEDIFFICULTY * odFactor;
            if (selectedObject.type == "hold")
                calculatedDifficulty += HOLDNOTEDIFFICULTY * odFactor;
            if (selectedObject.type == "release")
                calculatedDifficulty += RELEASEDIFFICULTY * odFactor;
            
            let distanceFactor = 1;
            let speedFactor = 1;
            if (lastNonTypingSectionIndex >= 0 && selectedObject.type != "typingsection") {
                let previousObject = difficultyObjects[lastNonTypingSectionIndex];
                let previousEndTime = previousObject.endTime;
                let currentStartTime = selectedObject.startTime;
                const SPEEDUPPERLIMIT = 200;
                const SPEEDLOWERLIMIT = 25;
                speedFactor = Math.max(SPEEDUPPERLIMIT / (SPEEDLOWERLIMIT + (currentStartTime - previousEndTime) * ((SPEEDUPPERLIMIT - SPEEDLOWERLIMIT) / SPEEDUPPERLIMIT)),1);
                if (speedFactor > 1)
                    speedFactor = Math.pow(speedFactor, 0.2);
                speedFactor *= 1.3;
                speedFactor += 1.5;
            }
            if (selectedObject.type != "typingsection") {
                lastNonTypingSectionIndex = difficultyIndexer
            }
            if (selectedObject.type != "typingsection" && selectedObject.type != "anchor")
            {
                noteBaseValuesForBuildUp.push(calculatedDifficulty);
                noteStartTimesForBuildUp.push(selectedObject.startTime);
                noteMultiplierValues[0].push(speedFactor);
                noteMultiplierValues[1].push(repeatedPatternNerf[difficultyIndexer]);
            }
            difficultySum += calculatedDifficulty* distanceFactor * speedFactor * repeatedPatternNerf[difficultyIndexer];
        }

        const drainTime = Math.max(getDrainTime(notes, typingSections), 1000);
        let objectCountDeflation = Math.min(Math.pow(difficultyObjects.length-typingSectionCounter, 0.98) / Math.max(difficultyObjects.length-typingSectionCounter,1),1);
        if (typingSectionCounter > difficultyObjects.length-typingSectionCounter)
            objectCountDeflation = 1;
        objectCountDeflation = 1;
        let difficultyDensity = (difficultySum  * objectCountDeflation)/ Math.pow(drainTime,0.8);

        
        return [difficultyDensity, noteStartTimesForBuildUp, noteBaseValuesForBuildUp, noteMultiplierNames, noteMultiplierValues, notecolors, typingSectionBaseValuesForBuildUp, typingSectionMultiplierNames, typingSectionMultiplierValues];
    }
}

//reworks.push(valerusReworkV2Compressed);