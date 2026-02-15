function CreateSelectContentUser() {
    let selectppFirst = document.getElementById("ppcalcselectfirst");
    let selectpptextFirst = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    let ppReworkKeys = Object.keys(ppFormulas);
    for (let i = 0; i < ppReworkKeys.length; ++i) {
        if (i == 0) {
            selectpptextFirst += "<option selected value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }
        else {
            selectpptextFirst += "<option value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }

    }
    selectppFirst.innerHTML = selectpptextFirst;
    let selectppSecond = document.getElementById("ppcalcselectsecond");
    let selectpptextSecond = "<option value=\"\" disabled selected>Select a pp rework</option>\n";
    for (let i = 0; i < ppReworkKeys.length; ++i) {
        if (i == 1) {
            selectpptextSecond += "<option selected value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
        }
        else {
            selectpptextSecond += "<option value=\"" + (i + 1) + "\">" + ppReworkKeys[i] + "</option>\n";
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
    document.getElementById("container").innerHTML = "<select id=\"ppcalcselectfirst\">"
        + "</select>"
        + "<select id=\"ppcalcselectsecond\">"
        + "</select>"
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
    CreateTable("playerleaderboard",leaderboardColumnNames,leaderboardColumnIds,leaderboardColumnWidths,leaderboardRowIds,CreateLeaderboardValues(),leaderboardColumnCompare,leaderboardColumnTypes, 50);
}

function CreateLeaderboardValues()
{
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

    let subtableScoreColumnNames = ["Song name", "Diff name", "Old PP", "Old calc PP", "New PP", "New calc PP", "Accuracy", "Mods"];
    let subtableScoreColumnIds = ["songName", "diffName", "oldPP", "oldcalcPP", "newPP", "newcalcPP", "acc", "mods"];
    let subtableScoreColumnWidths = [300, 200, 40, 40, 40, 40, 40, 40];    
    let subtableScoreColumnCompare = [-1, -1, -1, -1, 2, 3, -1, -1];
    let subtableScoreColumnTypes = ["search", "string", "integer", "integer", "integer", "integer", "percentage", "string"];

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
        let scoreOldNerfedPP = [];
        let scoreNewNerfedPP = [];
        let scoreMods = [];
        let scoreAcc = [];
        for (let j = 0; j < playerLeaderboardData[i].plays.length; ++j)
        {
            scoreSongName.push(playerLeaderboardData[i].plays[j].songName);
            scoreDiffName.push(playerLeaderboardData[i].plays[j].diffName);
            scoreOldPP.push(playerLeaderboardData[i].plays[j].originalPPs[ppReworkFirst]);
            scoreOldNerfedPP.push(playerLeaderboardData[i].plays[j].PPs[ppReworkFirst]);
            scoreNewPP.push(playerLeaderboardData[i].plays[j].originalPPs[ppReworkSecond]);
            scoreNewNerfedPP.push(playerLeaderboardData[i].plays[j].PPs[ppReworkSecond]);
            let scoreMod = "";
            for (let k = 0; k < playerLeaderboardData[i].plays[j].mods.length; ++k)
            {
                scoreMod+=playerLeaderboardData[i].plays[j].mods[k];
            }
            scoreMods.push(scoreMod);
            scoreAcc.push(playerLeaderboardData[i].plays[j].acc/100);

        }
        let subtableScoreColumnValues = [scoreSongName, scoreDiffName, scoreOldPP, scoreOldNerfedPP, scoreNewPP, scoreNewNerfedPP, scoreAcc, scoreMods];
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