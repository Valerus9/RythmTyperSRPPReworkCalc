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
        CalculateTopPlayScores();
    });
    document.getElementById("ppcalcselectsecond").addEventListener("change", async (event) => {
        ppReworkSecond = event.target.value - 1;
        CalculateTopPlayScores();
    });

}

function LoadPlayerLeaderBoard() {
    document.getElementById("container").innerHTML = "<input type=\"button\" id=\"calculatepp\" value=\"Calculate pp\">\n"
        + "<select id=\"ppcalcselectfirst\">"
        + "</select>"
        + "<select id=\"ppcalcselectsecond\">"
        + "</select>"
        + "<p id=\"totalPPOld\"></p>\n"
        + "<p id=\"totalPPNew\"></p>\n"
        + "<p>Go to your top play section of your profile and ctrl + a, ctrl + c, ctrl+v them.</p>\n"
        + "<textarea name=\"replayTextArea\" id=\"replayInput\"></textarea>"
        + "<table id=\"topplayList\">\n"
        + "</table>\n\n";
    CreateSelectContentUser();
    document.getElementById("calculatepp").addEventListener("click", async (event) => {
        CalculateTopPlayScores();
    });
}

function CalculateTopPlayScores() {
    let replays = String(document.getElementById("replayInput").value).split("\n");
    if (replays[0] == "" && replays.length == 1)
        return;
    let cleanedUpReplay = [];
    let modList = ["NC", "DC", "HT", "DT", "AT", "NF"];
    for (const replay of replays) {
        if (replay.startsWith("weighted") || replay.startsWith("#"))
            continue;
        if (replay.length <= 1 || (replay.length == 2 && !modList.includes(replay)))
            continue;
        cleanedUpReplay.push(replay);
    }
    let replayBeatmapName = [];
    let replayDiffIds = [];
    let replayAccuracy = [];
    let replayMod = [];
    let foundFirstTitle = false;
    let unknownInformation = [];
    for (let i = 0; i < cleanedUpReplay.length; ++i) {
        if (songNames.includes(cleanedUpReplay[i])) {
            replayBeatmapName.push(cleanedUpReplay[i]);
            if (replayBeatmapName.length - 1 > replayMod.length)
                replayMod.push("");
            foundFirstTitle = true;
            continue;
        }
        if (!foundFirstTitle)
            continue;
        if (modList.includes(cleanedUpReplay[i])) {
            if (replayBeatmapName.length <= replayMod.length) {
                replayMod[replayMod.length - 1] += " " + cleanedUpReplay[i];
            }
            else
                replayMod.push(cleanedUpReplay[i]);
            continue;
        }


        if (cleanedUpReplay[i].includes(" • ")) {
            let diffName = cleanedUpReplay[i].split(" • ")[1];
            if (difficultyNames.includes(diffName)) {
                let index = -2;
                let foundDiff = false;
                while (!foundDiff) {
                    index = difficultyNames.indexOf(diffName, Math.max(0, index));
                    if (replayBeatmapName[replayBeatmapName.length - 1] == songNames[index]) {
                        foundDiff = true;
                        break;
                    }
                    if (index == -1)
                        break;
                    index++;
                }
                if (index != -1) {
                    replayDiffIds.push(index);
                    continue;
                }
            }
        }
        if (cleanedUpReplay[i].includes("%")) {
            replayAccuracy.push(parseFloat(cleanedUpReplay[i].replace("%", "")));
            continue;
        }
        unknownInformation.push(cleanedUpReplay[i]);
    }
    if (unknownInformation.length == 0) {
        for (let i = 0; i < cleanedUpReplay.length; ++i) {
            if (modList.includes(cleanedUpReplay[i])) {
                continue;
            }


            if (cleanedUpReplay[i].includes(" • ")) {
                continue;
            }
            if (cleanedUpReplay[i].includes("%")) {
                continue;
            }
            unknownInformation.push(cleanedUpReplay[i]);
        }
    }


    if (!(replayBeatmapName.length == replayDiffIds.length &&
        replayAccuracy.length == replayMod.length &&
        replayDiffIds.length == replayAccuracy.length && replayBeatmapName.length > 0)) {
        console.log("Error: Missing cached ranked beatmap. Go back to map sr pp change menu and upload the .rtm file of the missing ranked maps:");
        document.getElementById("replayInput").value = "Error: Check console log for more information";
        for (let i = 0; i < unknownInformation.length; ++i) {
            console.log(unknownInformation[i]);
        }
        return;
    }
    let oldPPSum = 0;
    let newPPSum = 0;
    let topPlayTable = document.getElementById("topplayList");
    let topPlayText = "";
    topPlayText += "<th>Map</th>";
    topPlayText += "<th>Diff</th>";
    topPlayText += "<th>Acc</th>";
    topPlayText += "<th>Old pp</th>";
    topPlayText += "<th>New pp</th>";

    for (let i = 0; i < replayDiffIds.length; ++i) {
        topPlayText += "<tr>";
        let oldPP = GetModdedPP(replayDiffIds[i], ppReworkFirst, replayMod[i]) * ppaccuracies[ppFormulaKeys[ppReworkFirst]](replayAccuracy[i]);
        let newPP = GetModdedPP(replayDiffIds[i], ppReworkSecond, replayMod[i]) * ppaccuracies[ppFormulaKeys[ppReworkSecond]](replayAccuracy[i]);
        oldPPSum += ActualPP(oldPP, i + 1);
        newPPSum += ActualPP(newPP, i + 1);
        topPlayText += "<td>" + songNames[replayDiffIds[i]] + "</td>";
        topPlayText += "<td>" + difficultyNames[replayDiffIds[i]] + "</td>";
        topPlayText += "<td>" + replayAccuracy[i] + "</td>";
        topPlayText += "<td>" + Math.round(oldPP) + " (" + Math.round(ActualPP(oldPP, i + 1)) + ")" + "</td>";
        topPlayText += "<td>" + Math.round(newPP) + " (" + Math.round(ActualPP(newPP, i + 1)) + ")" + "</td>";
        topPlayText += "</tr>";
    }
    document.getElementById("totalPPOld").innerHTML = "Total old PP: " + Math.round(oldPPSum);
    document.getElementById("totalPPNew").innerHTML = "Total new PP: " + Math.round(newPPSum);
    topPlayTable.innerHTML = topPlayText;
}

function ActualPP(pp, n) {
    return pp * Math.pow(0.95, (n - 1));
}
function PercentagePP(n) {
    return Math.pow(0.95, (n - 1));
}