let selectedId = "changemenumaps";
let visualMode = "light";
function ApplyVisualMode() {
    document.documentElement.className = "";
    if (visualMode == "light") {
        document.documentElement.classList.add("lightmode");
        document.getElementById("visualmodeswitch").value = "Dark mode";
    }
    if (visualMode == "dark") {
        document.documentElement.classList.add("darkmode");
        document.getElementById("visualmodeswitch").value = "Light mode";
    }
}
document.getElementById("visualmodeswitch").addEventListener("click", async (event) => {
    if (visualMode == "light") {
        visualMode = "dark";
    }
    else if (visualMode == "dark") {
        visualMode = "light";
    }
    ApplyVisualMode();
});

ApplyVisualMode();

CreateSelectContentBeatmap();

function ChangeMenu(elementId) {
    let changeMenuButton = document.getElementById(elementId);
    selectedId = elementId;
    if (selectedId == "changemenuprofile") {
        LoadPlayerLeaderBoard();
    }

    else if (selectedId == "changemenumaps") {
        LoadMapDifLeaderboard();
    }
    else if (selectedId == "changemenudifferentodCalc") {
        LoadDifODCalc();
    }
    else if (selectedId == "changemenugraphviewofrework") {
        LoadDiffGraph();
    }
    else if (selectedId == "changemenubuildupleaderboard") {
        LoadBuildUpLeaderboard();
    }
    else if (selectedId == "leftrighthandmenu") {
        loadLeftRightHand();
    }
    RefreshSelectedButton();
}

document.getElementById("changemenuprofile").addEventListener("click", async (event) => {
    ChangeMenu("changemenuprofile");
});
document.getElementById("changemenumaps").addEventListener("click", async (event) => {
    ChangeMenu("changemenumaps");
});
document.getElementById("changemenudifferentodCalc").addEventListener("click", async (event) => {
    ChangeMenu("changemenudifferentodCalc");
});
document.getElementById("changemenugraphviewofrework").addEventListener("click", async (event) => {
    ChangeMenu("changemenugraphviewofrework");
});
document.getElementById("changemenubuildupleaderboard").addEventListener("click", async (event) => {
    ChangeMenu("changemenubuildupleaderboard");
});
document.getElementById("leftrighthandmenu").addEventListener("click", async (event) => {
    ChangeMenu("leftrighthandmenu");
});

function RefreshSelectedButton() {
    document.getElementById("changemenuprofile").className = document.getElementById("changemenuprofile").className.replace("selected", "").trim(" ");
    document.getElementById("changemenumaps").className = document.getElementById("changemenumaps").className.replace("selected", "").trim(" ");
    document.getElementById("changemenudifferentodCalc").className = document.getElementById("changemenudifferentodCalc").className.replace("selected", "").trim(" ");
    document.getElementById("changemenugraphviewofrework").className = document.getElementById("changemenugraphviewofrework").className.replace("selected", "").trim(" ");
    document.getElementById("changemenubuildupleaderboard").className = document.getElementById("changemenubuildupleaderboard").className.replace("selected", "").trim(" ");
    if (selectedId == "changemenuprofile") {
        document.getElementById("changemenuprofile").className += " selected";
    }
    if (selectedId == "changemenumaps") {
        document.getElementById("changemenumaps").className += " selected";
    }
    if (selectedId == "changemenudifferentodCalc") {
        document.getElementById("changemenudifferentodCalc").className += " selected";
    }
    if (selectedId == "changemenugraphviewofrework") {
        document.getElementById("changemenugraphviewofrework").className += " selected";
    }
    if (selectedId == "changemenubuildupleaderboard") {
        document.getElementById("changemenubuildupleaderboard").className += " selected";
    }
}

//localStorage.clear();
LoadMapDifLeaderboard();
GetDataForMapLeaderboard(0,10);
