
//localStorage.clear();
//localStorage.setItem();
//localStorage.getItem();
//localStorage.removeItem();
//localStorage[];

//Used for accessing data.
const lsLatestRankedId = "latestrankedid";
const lsDifficultyDatas = "difficultydatas";
const lsDifficultyIds = "difficultyids";
const lsDifficultyTitles = "difficultytitle";
const lsBeatmapSongNames = "beatmapsongnames";
const lsBeatmapIds = "beatmapids";

const lsReworkVersions = "reworkversions";

function LsIsStored(key)
{
    return localStorage.getItem(key) !== null || localStorage[key] !== undefined;
}

function LsGetValueAsArray(key)
{
    //if (String(localStorage[key]) == "")
    //    return [];
    //let splitValue = String(localStorage[key]).split('\n');
    //return splitValue;
    return JSON.parse(localStorage[key]);
}

/*function LsCreateStorableArray(inputArray, arrayDepth = -1)
{
    let subArrayCounter = [0];
    let depthReached = 0;
    while (subArrayCounter[0] < inputArray.length)
    {
        if (inputArray[subArrayCounter[depthReached]].constructor === Array)
        {
            depthReached++;
            subArrayCounter.push(0);
        }
        subArrayCounter[depthReached]++;
    }
    let convertedArray = [];
    for (let i = 0; i <inputArray.length; ++i)
    {
        convertedArray.push(inputArray[i]);
    }
    let storedValue = "";
    for (let i = 0; i < convertedArray.length; ++i)
    {
        if (storedValue != "")
            storedValue += "\n";
        convertedArray[i] = String(convertedArray[i]);
        storedValue += convertedArray[i];
    }
}*/

function LsSetValueAsArray(key, inputArray)
{
    //LsCreateStorableArray(inputArray);
    localStorage[key] = JSON.stringify(inputArray) 
}

function LsInclude(key, inputValue)
{
    let tempArray = LsGetValueAsArray(key);
    return tempArray.includes(inputValue);
}

function LsIndexOf(key, inputValue)
{
    let tempArray = LsGetValueAsArray(key);
    return tempArray.indexOf(inputValue);
}

function LsPush(key, inputValue)
{
    let tempArray = LsGetValueAsArray(key);
    tempArray.push(inputValue);
    LsSetValueAsArray(key, tempArray);
}

function LsSplice(key, inputIndex, inputAmount)
{
    let tempArray = LsGetValueAsArray(key);
    tempArray.splice(inputIndex, inputAmount);
    LsSetValueAsArray(key, tempArray);
}

