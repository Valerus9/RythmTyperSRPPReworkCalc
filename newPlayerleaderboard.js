let playerLeaderboardData = [];

function CreateSelectContentUser() {
    let selectppFirst = document.getElementById("ppcalcselectfirst");
    let selectpptextFirst = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i], "pp"))
            continue;
        if (i == 0) {
            selectpptextFirst += "<option selected value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
        else {
            selectpptextFirst += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }

    }
    selectppFirst.innerHTML = selectpptextFirst;
    let selectppSecond = document.getElementById("ppcalcselectsecond");
    let selectpptextSecond = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < reworks.length; ++i) {
        if (!ObjectHasVariable(reworks[i], "pp"))
            continue;
        if (i == 1) {
            selectpptextSecond += "<option selected value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }
        else {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\">" + reworks[i].name + "</option>\n";
        }

    }
    selectppSecond.innerHTML = selectpptextSecond;
    document.getElementById("ppcalcselectfirst").addEventListener("change", async (event) => {
        ppReworkFirst = event.target.value - 1;
        CreateLeaderboard();
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;
        CreateLeaderboard();
    });

}

function LoadPlayerLeaderBoard() {
    document.getElementById("container").innerHTML = "<div class=\"neededpadding\" style=\"display:flex; flex-direction:column;\">"
    +"<p>PP rework (old)</p>"
    +"<select id=\"ppcalcselectfirst\">"
        + "</select>"
        + "<p>PP rework (new)</p>"
        + "<select id=\"ppcalcselectsecond\">"
        + "</select>"
        + "</div>"
        + "<p id=\"loadingprogress\"></p>"
        + "<table id=\"playerleaderboard\"></table>"        
    CreateSelectContentUser();
    CreateLeaderboard();
}

function CreateLeaderboard()
{
    let leaderboardColumnNames = ["Username", "Old rank", "New rank", "Old PP", "New PP", "PP diff", "Actual diff", "Scores"];
    let leaderboardColumnIds = ["username", "oldRank", "newRank", "oldPP", "newPP", "ppdiff", "actualDiff", "scores"];
    let leaderboardColumnWidths = [120, 80, 120, 60, 60, 60, 60, 0];
    let leaderboardColumnCompare = [-1, -1, 1, -1, 3, -1, -1, -1];
    let leaderboardColumnTypes = ["search", "rank", "rank", "integer", "integer", "integer", "float", "subtable"];
    let leaderboardRowIds = [];
    for (let i = 0; i < playerLeaderboardData.length; ++i)
    {
        leaderboardRowIds.push(i);
    }
    CreateTable("Player leaderboard", "playerleaderboard",leaderboardColumnNames,leaderboardColumnIds,leaderboardColumnWidths,leaderboardRowIds,CreateLeaderboardValues(),leaderboardColumnCompare,leaderboardColumnTypes, 50);
    //tableSubtablesHidden[createdTableIds.indexOf("playerleaderboard")] = true;
    if (playerLeaderboardData.length == 0)
        return
    for (let i = 0; i < tableHidden.length;++i)
    {
        if (createdTableIds[i].includes("subtable") && createdTableIds[i].includes("playerleaderboard"))
        {
            tableHidden[i] = true;
        }
    } 
    CreateTable("Player leaderboard", "playerleaderboard",leaderboardColumnNames,leaderboardColumnIds,leaderboardColumnWidths,leaderboardRowIds,CreateLeaderboardValues(),leaderboardColumnCompare,leaderboardColumnTypes, 50);
}

function CreateLeaderboardValues()
{
    if (playerLeaderboardData.length == 0)
    {
        playerLeaderboardData = CreatePlayerLeaderboardData();
        return [[], [], [], [], [], [], [], []];
    }
    let rowId = [];
    for (let i = 0; i < playerLeaderboardData.length; ++i)
    {
        rowId.push(i);
    }

    let leaderboardUsername = [];
    let leaderboardOldPP = [];
    let leaderboardNewPP = [];
    let leaderboardOldRank = [];
    let leaderboardNewRank = [];
    let leaderboardPPdiff = [];
    let leaderboardActualPPdiff = [];

    let subtableScoreColumnNames = ["Song name", "Diff name", "Old SS PP", "Old PP", "Old weighted PP", "New SS PP", "New PP", "New weighted PP", "PP diff", "Weighted PP diff", "Accuracy", "Mods"];
    let subtableScoreColumnIds = ["songName", "diffName", "oldSSPP", "oldPP", "oldcalcPP", "newSSPP", "newPP", "newcalcPP", "ppdiff", "weightedppdiff", "acc", "mods"];
    let subtableScoreColumnWidths = [300, 200, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40];    
    let subtableScoreColumnCompare = [-1, -1, -1, -1, -1, 2, 3, 4, -1, -1, -1, -1];
    let subtableScoreColumnTypes = ["search", "string", "integer", "integer", "integer", "integer", "integer", "integer", "integer", "integer", "percentage", "string"];

    let subtables = [];
    
    for (let i = 0; i < playerLeaderboardData.length; ++i)
    {
        leaderboardUsername.push(playerLeaderboardData[i].username);
        leaderboardOldPP.push(playerLeaderboardData[i].PPs[ppReworkFirst]);
        leaderboardNewPP.push(playerLeaderboardData[i].PPs[ppReworkSecond]);
        leaderboardPPdiff.push(playerLeaderboardData[i].PPs[ppReworkSecond]-playerLeaderboardData[i].PPs[ppReworkFirst]);
        leaderboardActualPPdiff.push(Math.round(playerLeaderboardData[i].PPs[ppReworkSecond]/playerLeaderboardData[i].PPs[ppReworkFirst] * 100)/100)
        leaderboardOldRank.push(0);
        leaderboardNewRank.push(0);

        let scoreSongName = [];
        let scoreDiffName = [];        
        let scoreOldPP = [];
        let scoreNewPP = [];
        let scoreOldSSPP = [];
        let scoreNewSSPP = [];
        let scoreOldNerfedPP = [];
        let scoreNewNerfedPP = [];        
        let scorePPdiff = [];
        let scoreWeightedPPdiff = [];
        let scoreMods = [];
        let scoreAcc = [];
        for (let j = 0; j < playerLeaderboardData[i].plays.length; ++j)
        {
            scoreSongName.push(playerLeaderboardData[i].plays[j].songName);
            scoreDiffName.push(playerLeaderboardData[i].plays[j].diffName);
            scoreOldSSPP.push(playerLeaderboardData[i].plays[j].originalSSPPs[ppReworkFirst]);
            scoreOldPP.push(playerLeaderboardData[i].plays[j].originalPPs[ppReworkFirst]);
            scoreOldNerfedPP.push(playerLeaderboardData[i].plays[j].PPs[ppReworkFirst]);
            scoreNewSSPP.push(playerLeaderboardData[i].plays[j].originalSSPPs[ppReworkSecond]);
            scoreNewPP.push(playerLeaderboardData[i].plays[j].originalPPs[ppReworkSecond]);
            scoreNewNerfedPP.push(playerLeaderboardData[i].plays[j].PPs[ppReworkSecond]);
            scorePPdiff.push(playerLeaderboardData[i].plays[j].originalPPs[ppReworkSecond] - playerLeaderboardData[i].plays[j].originalPPs[ppReworkFirst]);
            scoreWeightedPPdiff.push(playerLeaderboardData[i].plays[j].PPs[ppReworkSecond] - playerLeaderboardData[i].plays[j].PPs[ppReworkFirst]);
            let scoreMod = "";
            for (let k = 0; k < playerLeaderboardData[i].plays[j].mods.length; ++k)
            {
                scoreMod+=playerLeaderboardData[i].plays[j].mods[k];
            }
            scoreMods.push(scoreMod);
            scoreAcc.push(playerLeaderboardData[i].plays[j].acc/100);

        }
        let subtableScoreColumnValues = [scoreSongName, scoreDiffName, scoreOldSSPP, scoreOldPP, scoreOldNerfedPP, scoreNewSSPP, scoreNewPP, scoreNewNerfedPP, scorePPdiff, scoreWeightedPPdiff, scoreAcc, scoreMods];
        subtables.push([subtableScoreColumnNames, subtableScoreColumnIds, subtableScoreColumnWidths, rowId, subtableScoreColumnValues, subtableScoreColumnCompare, subtableScoreColumnTypes, -1]);
    }
    let ppRowIds = DoSort([1], [leaderboardOldPP], ["integer"]);
    for (let i = 0; i < ppRowIds.length; ++i)
    {
        leaderboardOldRank[ppRowIds[i]] = i + 1;
    }
    ppRowIds = DoSort([1], [leaderboardNewPP], ["integer"]);
    for (let i = 0; i < ppRowIds.length; ++i)
    {
        leaderboardNewRank[ppRowIds[i]] = i + 1;
    }
    return [leaderboardUsername, leaderboardOldRank, leaderboardNewRank, leaderboardOldPP, leaderboardNewPP, leaderboardPPdiff, leaderboardActualPPdiff, subtables];
}

function CreatePlayerLeaderboardData()
{
    GetPlayersFromLeaderboard(5,0, "totalPP").then(topPlayerData => {
        Promise.all(topPlayerData.map((x) => GetPlayerData(x.userId))).then(topPlayerDatas => {
            let needToBeProcessed = [];
            for (let i = 0; i < topPlayerDatas.length; ++i)
            {
                for (let j = 0; j < topPlayerDatas[i].topPlays.length; ++j)
                {     
                    let foundMap = false;
                    let mapIndex = 0;
                    while(!foundMap && mapIndex != -1)
                    {
                        if (difficultyNames[mapIndex] == topPlayerDatas[i].topPlays[j].diff)
                        {
                            foundMap = true;
                            break;
                        }
                        mapIndex = songNames.indexOf(topPlayerDatas[i].topPlays[j].bt, mapIndex + 1);
                    }       
                    if (!foundMap && !needToBeProcessed.includes(topPlayerDatas[i].topPlays[j].bid))
                        needToBeProcessed.push(topPlayerDatas[i].topPlays[j].bid)
                }
            }
            if (needToBeProcessed.length > 0)
            {
                Promise.all(needToBeProcessed.map((x) => GetBeatmapData(x))).then(neededBeatmapDatas => {
                    Promise.all(neededBeatmapDatas.map((x) => GetBeatmapRTM(x.beatmaps[0].mapsetId, x.beatmaps[0].version))).then(rtmfiles => {
                        Promise.all(rtmfiles.map((x) => CreateMapDataFromFiles([x]))).then(separatedData => {
                            let unseparatedData = [];
                            for (let i = 0; i < separatedData[0].length; ++i)
                            {
                                unseparatedData.push([])
                            }
                            for (let i = 0; i < unseparatedData.length; ++i)
                            {
                                for (let j = 0; j < separatedData.length; ++j)
                                {
                                    for (let k = 0; k < separatedData[j][i].length; ++k)
                                    {
                                        unseparatedData[i].push(separatedData[j][i][k])
                                    }

                                }
                            }
                            LoadMapDataValues(unseparatedData, () => {
                                ConvertPlayerData(topPlayerDatas)
                                CreateLeaderboard()
                            })
                        })
                    })
                })
            }
            else
            {
                LoadMapDataValues(unseparatedData, () => {                            
                    ConvertPlayerData(topPlayerDatas)
                    CreateLeaderboard()
                })
            }
        });
    });
    return [];
}

function ConvertPlayerData(topPlayerDatas)
{
    for (let i = 0; i < topPlayerDatas.length; ++i)
    {
        let convertedPlayerData = {
            userId: topPlayerDatas[i].userId,
            username: topPlayerDatas[i].username,
            PPs: new Array(reworks.length).fill(-1),
            plays: []
        }   
        for (let j = 0; j < topPlayerDatas[i].topPlays.length; ++j)
        {                   
            let convertedPlay = {
                acc: topPlayerDatas[i].topPlays[j].acc,
                diffName: topPlayerDatas[i].topPlays[j].diff,
                artist: topPlayerDatas[i].topPlays[j].ba,
                songName: topPlayerDatas[i].topPlays[j].bt,
                objectCount: topPlayerDatas[i].topPlays[j].cb,
                mapsetId: topPlayerDatas[i].topPlays[j].bid,
                PPs: new Array(reworks.length).fill(-1),
                originalPPs: new Array(reworks.length).fill(-1),
                originalSSPPs: new Array(reworks.length).fill(-1),
                mods: [],
            } 
            let difficultySRPP = GetBeatmapDifficulty(topPlayerDatas[i].topPlays[j].bt, topPlayerDatas[i].topPlays[j].diff, topPlayerDatas[i].topPlays[j].mods, topPlayerDatas[i].topPlays[j].acc, topPlayerDatas[i].topPlays[j].judgments)
            let perfectJudgement = {
                perfect: topPlayerDatas[i].topPlays[j].judgments.perfect +topPlayerDatas[i].topPlays[j].judgments.good + topPlayerDatas[i].topPlays[j].judgments.ok + topPlayerDatas[i].topPlays[j].judgments.miss,
                good: 0,
                ok: 0,
                miss: 0
            }
            convertedPlay.PPs = difficultySRPP.pp.map((x) => x[0]);
            convertedPlay.originalPPs = difficultySRPP.pp.map((x) => x[0]);
            let difficultySRPPSS = GetBeatmapDifficulty(topPlayerDatas[i].topPlays[j].bt, topPlayerDatas[i].topPlays[j].diff, topPlayerDatas[i].topPlays[j].mods, 100, perfectJudgement)
            for (let k = 0; k < topPlayerDatas[i].topPlays[j].mods.length; ++k)
            {
                convertedPlay.mods.push(topPlayerDatas[i].topPlays[j].mods[k])
            }
            convertedPlay.originalSSPPs = difficultySRPPSS.pp.map((x) => x[0]);
            convertedPlayerData.plays.push(convertedPlay);
        }
        for (let j = 0; j < convertedPlayerData.plays[0].PPs.length; ++j)
        {
            let sortedPP = [];
            let sortedPPid = [];
            for (let k = 0; k < convertedPlayerData.plays.length; ++k)
            {
                if (sortedPP.length == 0)
                {
                    sortedPP.push(convertedPlayerData.plays[k].PPs[j])
                    sortedPPid.push(k);
                    continue;
                }
                let addedToSorted = false;
                for (let l = 0; l < sortedPP.length; ++l)
                {
                    if (sortedPP[l] < convertedPlayerData.plays[k].PPs[j])
                    {
                        addedToSorted = true;
                        sortedPP.splice(l, 0, convertedPlayerData.plays[k].PPs[j])
                        sortedPPid.splice(l, 0, k);
                        break;
                    }
                }
                if (!addedToSorted)
                {
                    sortedPP.push(convertedPlayerData.plays[k].PPs[j])
                    sortedPPid.push(k)
                }
                    
            }
            let sumPP = 0;
            for (let k = 0; k < sortedPP.length; ++k)
            {
                sumPP += sortedPP[k] * Math.pow(0.95, k);
                convertedPlayerData.plays[sortedPPid[k]].PPs[j] *= Math.pow(0.95, k);
            }
            convertedPlayerData.PPs[j] = sumPP;
        }
        playerLeaderboardData.push(convertedPlayerData)
    }
}