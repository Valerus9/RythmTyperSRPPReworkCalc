let columnSorts = [];
let createdTableIds = [];
let tableOriginalRowIds = [];
let tableHidden = [];
let tableSearchTerm = [];
let tableSearchPreviousTerm = [];
let tableSearchCursorPosition = [];
let tableSearchCursorPositionEnd = [];
let tableOffsets = [];
let tableLimits = [];
let tableSubtablesHidden = [];

function GetHeaderSortText(sortBySomething) {
    if (sortBySomething == 0)
        return "";
    else if (sortBySomething >= 1)
        return " (desc)";
    else if (sortBySomething <= -1)
        return " (incr)";
}

function CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit) {
    /*console.log(tableColumnNames.length);
    console.log(tableColumnIds.length);
    console.log(tableColumnWidths.length);
    console.log(tableRowIds.length);
    console.log(tableColumnValues.length);
    console.log(tableColumnCompare.length);
    console.log(tableColumnTypes.length);*/
    let smallestColumn = Infinity;
    let allColumnsEqual = true;
    for (let i = 0; i < tableColumnValues.length; ++i)
    {
        if (smallestColumn > tableColumnValues[i].length)
            smallestColumn = tableColumnValues[i].length;
        if (i != 0)
        {
            if (tableColumnValues[i].length != tableColumnValues[i - 1].length)
            {
                allColumnsEqual = false;
            }
        }
    }

    if (smallestColumn == 0 || !allColumnsEqual)
    {
        document.getElementById(tableid).innerHTML = "";
        return;
    }
     
    let tableGlobalArrayId = 0;   
    
    CreateGlobalTableData(tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
    for (let i = 0; i < createdTableIds.length; ++i)
    {
        if (createdTableIds[i] == tableid)
        {
            tableGlobalArrayId = i;
            break;
        }            
    }
    if (tableHidden[tableGlobalArrayId])
    {
        document.getElementById(tableid).innerHTML = "<tr><th  id=\""+ tableid+"hideshowtable\" colspan=\""+(tableColumnValues.length)+"\">Show "+tableName+"</th></tr>";
        document.getElementById(tableid+"hideshowtable").addEventListener("click", async (event) => {
            tableHidden[createdTableIds.indexOf(tableid)] = !tableHidden[createdTableIds.indexOf(tableid)];
            CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
        });
        return;
    }
        
    if (tableOriginalRowIds[tableGlobalArrayId].length != tableColumnValues[0].length)
    {
        tableOriginalRowIds[tableGlobalArrayId] = [];
        for (let i = 0; i < tableRowIds.length; ++i)
        {
            tableOriginalRowIds[tableGlobalArrayId].push(tableRowIds[i]);
        }
    }
    let needSorting = columnSorts[tableGlobalArrayId].includes(1) || columnSorts[tableGlobalArrayId].includes(-1);
    if (needSorting)
    {
        tableRowIds = DoSort(columnSorts[tableGlobalArrayId], tableColumnValues, tableColumnTypes)
    }
    else
    {
        tableRowIds = tableOriginalRowIds[tableGlobalArrayId];
    }

    let subtableCounter = 1;
    let subtableColumns = [];
    let subtableIds = [];
    let subtableHidden = [];
    let missingSubtables = [];
    let missingSubtablesIds = [];
    let existingSubtables = [];
    let existingSubtablesIds = [];
    for (let i = 0; i < tableColumnTypes.length; ++i)
    {
        if (tableColumnTypes[i] == "subtable")
        {
            subtableColumns.push(i);
            subtableCounter++;
            subtableIds.push([]);
            subtableHidden.push([]);
            missingSubtables.push([]);
            missingSubtablesIds.push([]);
            existingSubtables.push([]);
            existingSubtablesIds.push([]);
        }
    }
    

    let searchTermColumn = 0;
    console.log(tableName);
    if (tableColumnTypes.includes("search"))
    {
        searchTermColumn = tableColumnTypes.indexOf("search");
    }
    const table = document.getElementById(tableid);
    let tableText = "";
    if (tableColumnTypes.includes("search"))
        tableText += "<tr><th colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\"><input type=\"text\" style=\"width: 100%; box-sizing: border-box;\" name=\""+tableid+"mapsearch\" placeholder=\"Search\" id=\""+tableid+"mapsearch\" value=\""+tableSearchTerm[tableGlobalArrayId]+"\"></th><tr>";
    //console.log(tableColumnValues);
    if (subtableCounter > 1)
    {
        if (tableSubtablesHidden[tableGlobalArrayId])
        {
            tableText += "<tr><th id=\""+ tableid+"enabledisablesubtables\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Enable subtables</th></tr>";
        }
        else
        {
            tableText += "<tr><th id=\""+ tableid+"enabledisablesubtables\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Disable subtables</th></tr>";
        }
    }
    
    if (subtableCounter > 1 && !tableSubtablesHidden[tableGlobalArrayId])
    {
        let subtablesShowHidden = 2;
        for (let i = 0; i < createdTableIds.length; ++i)
        {
            if (createdTableIds[i].includes(tableid + tableColumnNames[subtableColumns[i]] + "subtable"))
            {
                if (tableHidden[i])
                {
                    if (subtablesShowHidden == 2)
                        subtablesShowHidden = 1;
                    if (subtablesShowHidden < 0)
                        subtablesShowHidden = 0;
                }
                else
                {
                    
                    if (subtablesShowHidden == 2)
                        subtablesShowHidden = -1;
                    if (subtablesShowHidden > 0)
                        subtablesShowHidden = 0;
                }

            }
        }
        let subtablesShowHiddenText = "Hide/Show";
        if (subtablesShowHidden == 1)
        {
            subtablesShowHiddenText = "Show"
        }
        if (subtablesShowHidden == -1)
        {
            subtablesShowHiddenText = "Hide"
        }
        tableText += "<tr><th id=\""+ tableid+"hideshowsubtables\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">"+subtablesShowHiddenText+" subtables</th></tr>";
        
    }
        
    if (tableLimits[tableGlobalArrayId] > 0)
    {
        if (tableOffsets[tableGlobalArrayId] + tableLimits[tableGlobalArrayId] < tableColumnValues[0].length)
        {
            tableText += "<tr><th id=\""+tableid+"nextpagetop\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Next page</th></tr>"
        }
        if (tableOffsets[tableGlobalArrayId] - tableLimits[tableGlobalArrayId] >= 0)
        {
            tableText += "<tr><th id=\""+tableid+"previouspagetop\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Previous page</th></tr>"
        }
    }
    tableText += "<tr><th id=\""+ tableid+"hideshowtable\"  colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Hide "+tableName+"</th></tr>";
    if (tableColumnValues[0].length > 0)
    {
        tableText += "<tr style=\"height:75px\">";
        for (let i = 0; i < tableColumnNames.length; ++i)
        {            
            if (tableColumnTypes[i] == "subtable")
                continue;
            tableText += "<th id=\""+tableid+tableColumnIds[i] +"\" style=\"width:" + tableColumnWidths[i] + "px;\">" + tableColumnNames[i] + GetHeaderSortText(columnSorts[tableGlobalArrayId][i]) + "</th>";
        }
    }

    let rows = [];
    let rowHidden = [];
    let rowMeetsSearchTerm = [];
    for (let i = 0; i < tableColumnValues[searchTermColumn].length; ++i)
    {
        
        rowMeetsSearchTerm.push((tableSearchTerm[tableGlobalArrayId] == "" || tableColumnValues[searchTermColumn][tableRowIds[i]].toLowerCase().includes(tableSearchTerm[tableGlobalArrayId].toLowerCase())));
        for (let j = 0; j < subtableCounter; ++j)
        {
            rows.push("");
            rowHidden.push(false);
        }
            
    }
    let counter = 0;    
    for (let i = 0; i < tableColumnValues.length; ++i)
    {
        counter = 0;        
        for (let j = 0; j < tableColumnValues[i].length; j++)
        {
            
            if (tableColumnTypes[i] == "subtable" && !createdTableIds.includes(tableid + "subtable" + tableRowIds[j]))
            {  
                missingSubtables[subtableColumns.indexOf(i)].push(tableid + tableColumnNames[i] + "subtable" + tableRowIds[j]);
                missingSubtablesIds[subtableColumns.indexOf(i)].push(j);
            }
            else if (tableColumnTypes[i] == "subtable" && createdTableIds.includes(tableid + "subtable" + tableRowIds[j]))
            {
                existingSubtables[subtableColumns.indexOf(i)].push(tableid + tableColumnNames[i] + "subtable" + tableRowIds[j]);
                existingSubtablesIds[subtableColumns.indexOf(i)].push(j);
            }
            if (rowMeetsSearchTerm[j])
                counter++;
            if (tableOffsets[tableGlobalArrayId] != 0 && counter <= tableOffsets[tableGlobalArrayId])
            {
                continue;
            }
            if (tableLimits[tableGlobalArrayId] > 0 && tableLimits[tableGlobalArrayId] + tableOffsets[tableGlobalArrayId] < counter)
            {
                continue;
            }
            let rowPosition = j * subtableCounter;
            if (tableColumnTypes[i] == "subtable")
            {                
                let offset = subtableColumns.indexOf(i) + 1;
                rowPosition = j * subtableCounter + offset;
                let subtableId = tableid + tableColumnNames[i] + "subtable" + tableRowIds[j];
                subtableIds[subtableColumns.indexOf(i)].push(subtableId);
                if (createdTableIds.includes(subtableId) && tableSubtablesHidden[tableGlobalArrayId])
                {
                    subtableHidden[subtableColumns.indexOf(i)].push(true);
                    rowHidden[rowPosition] = true;
                }
                else
                {
                    subtableHidden[subtableColumns.indexOf(i)].push(false);
                    rowHidden[rowPosition] = false;
                }
                let subtableStyle = "style=\"width:100%;\"";
                rows[rowPosition] = "<td colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\"><table "+subtableStyle+" class=\"subtable\" id=\""+ subtableId +"\"></table></td>";
                continue;
            }   
            let shownValue = tableColumnValues[i][tableRowIds[j]];
            if (tableColumnTypes[i] == "time")
            {
                let allSecond = Math.round((tableColumnValues[i][tableRowIds[j]]) / 1000); 
                let second = allSecond % 60;
                if (second < 10)
                  second = "0"+second;
                let minute = (allSecond - second) / 60;
                let hour = (allSecond - second - (minute * 60)) / 3600;
                if (hour > 0)
                {
                    if (minute < 10)
                      minute = "0"+minute;                    
                }
                shownValue = minute+":"+ second;
                if (hour > 0)
                    shownValue = hour + ":" + shownValue;
            }
            if (tableColumnTypes[i] == "rank")
            {
                shownValue ="#" + shownValue;
            }
            if (tableColumnTypes[i] == "integer")
            {
                shownValue = Math.round(shownValue);
            }
            if (tableColumnTypes[i] == "percentage")
            {
                shownValue = (Math.round(shownValue * 100))+"%";
            }

            if (tableColumnCompare[i] == -1)
            {
                rows[rowPosition] += "<td style=\"width:" + tableColumnWidths[i] + "px;\">" + shownValue + "</td>";;
            }
            else
            {
                let r = 0;
                let g = 0;
                let b = 0;
                let otherColumnValue = tableColumnValues[tableColumnCompare[i]][tableRowIds[j]];
                let thisColumnValue = tableColumnValues[i][tableRowIds[j]];
                if (otherColumnValue < thisColumnValue)
                {
                    g = Math.floor((1-(otherColumnValue / thisColumnValue)) * 100 + 125);
                }
                else if (otherColumnValue > thisColumnValue)
                {
                    r = Math.floor((1-(thisColumnValue / otherColumnValue)) * 100 + 125);
                }
                if (tableColumnTypes[i] == "rank")
                {
                    if (otherColumnValue != thisColumnValue)
                        shownValue += " ("+(otherColumnValue-thisColumnValue)+")";
                    let temp = g;
                    g = r;
                    r = temp;
                }
                if (r == 0 && g == 0)
                {
                    rows[rowPosition] += "<td style=\"width:" + tableColumnWidths[i] + "px;\">" + shownValue + "</td>";;
                }
                else
                {
                    rows[rowPosition] += "<td style=\"width:" + tableColumnWidths[i] + "px;color:rgb("+r+","+g+","+b+")\">" + shownValue + "</td>";;
                }
            }
        }
    }
    if (missingSubtables.length > 0)
    {
        for (let i = 0; i <missingSubtables.length;++i)
        {
            for (let j = 0; j <missingSubtables[i].length;++j)
            {
                let subtableColumnNames = tableColumnValues[subtableColumns[i]][tableRowIds[j]][0];
                let subtableColumnIds = tableColumnValues[subtableColumns[i]][tableRowIds[j]][1];
                let subtableColumnWidths = tableColumnValues[subtableColumns[i]][tableRowIds[j]][2];
                let subtableRowIds = tableColumnValues[subtableColumns[i]][tableRowIds[j]][3];
                let subtableColumnValues = tableColumnValues[subtableColumns[i]][tableRowIds[j]][4];
                let subtableColumnCompare = tableColumnValues[subtableColumns[i]][tableRowIds[j]][5];
                let subtableColumnTypes = tableColumnValues[subtableColumns[i]][tableRowIds[j]][6];
                let subtableColumnLimit = tableColumnValues[subtableColumns[i]][tableRowIds[j]][7];
                CreateGlobalTableData(missingSubtables[i][j], subtableColumnNames, subtableColumnIds, subtableColumnWidths, subtableRowIds, subtableColumnValues, subtableColumnCompare, subtableColumnTypes, subtableColumnLimit)
            }
        }
    }
    counter = 0;
    for (let i = 0; i < rows.length; ++i)
    {
        if (rowMeetsSearchTerm[(i - (i % subtableCounter))/subtableCounter])
            counter++;
        if (tableOffsets[tableGlobalArrayId] != 0 && counter < tableOffsets[tableGlobalArrayId] * subtableCounter)
        {
            continue;
        }
        if (tableLimits[tableGlobalArrayId]  * subtableCounter > 0 && tableLimits[tableGlobalArrayId]  * subtableCounter + tableOffsets[tableGlobalArrayId] * subtableCounter < counter)
        {
            continue;
        }
        //
        if (!rowHidden[i] && rowMeetsSearchTerm[(i - i % subtableCounter)/subtableCounter])
        //    tableText += "<tr style=\"display:\"none\";\">"+rows[i]+"</tr>";
        //else
            tableText += "<tr>"+rows[i]+"</tr>";
    }

    if (tableLimits[tableGlobalArrayId] > 0)
    {
        if (tableOffsets[tableGlobalArrayId] + tableLimits[tableGlobalArrayId] < tableColumnValues[0].length)
        {
            tableText += "<tr><th id=\""+tableid+"nextpagebottom\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Next page</th></tr>"
        }
        if (tableOffsets[tableGlobalArrayId] - tableLimits[tableGlobalArrayId] >= 0)
        {
            tableText += "<tr><th id=\""+tableid+"previouspagebottom\" colspan=\""+(tableColumnValues.length-subtableColumns.length)+"\">Previous page</th></tr>"
        }
    }

    table.innerHTML = tableText;
    
    if (subtableCounter > 1)
    {
        document.getElementById(tableid+"enabledisablesubtables").addEventListener("click", async (event) => {
            tableSubtablesHidden[tableGlobalArrayId] = !tableSubtablesHidden[tableGlobalArrayId];
            CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
        });
    }
    

    if (tableSearchTerm[tableGlobalArrayId] != tableSearchPreviousTerm[tableGlobalArrayId])    
    {
        document.getElementById(tableid+"mapsearch").focus();
        document.getElementById(tableid+"mapsearch").setSelectionRange(tableSearchCursorPosition[tableGlobalArrayId], tableSearchCursorPositionEnd[tableGlobalArrayId]);
        tableSearchPreviousTerm[tableGlobalArrayId] = tableSearchTerm[tableGlobalArrayId];
    }

    if (tableLimits[tableGlobalArrayId] > 0)
    {
        if (tableOffsets[tableGlobalArrayId] + tableLimits[tableGlobalArrayId] < tableColumnValues[0].length)
        {
            document.getElementById(tableid+"nextpagetop").addEventListener("click", async (event) => {
                tableOffsets[tableGlobalArrayId] = tableOffsets[tableGlobalArrayId] + tableLimits[tableGlobalArrayId];
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
            document.getElementById(tableid+"nextpagebottom").addEventListener("click", async (event) => {
                tableOffsets[tableGlobalArrayId] = tableOffsets[tableGlobalArrayId] + tableLimits[tableGlobalArrayId];
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
        }
        if (tableOffsets[tableGlobalArrayId] - tableLimits[tableGlobalArrayId] >= 0)
        {
            document.getElementById(tableid+"previouspagetop").addEventListener("click", async (event) => {
                tableOffsets[tableGlobalArrayId] = tableOffsets[tableGlobalArrayId] - tableLimits[tableGlobalArrayId];
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
            document.getElementById(tableid+"previouspagebottom").addEventListener("click", async (event) => {
                tableOffsets[tableGlobalArrayId] = tableOffsets[tableGlobalArrayId] - tableLimits[tableGlobalArrayId];
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
        }
    }
    

    if (tableColumnTypes.includes("search"))
        document.getElementById(tableid+"mapsearch").addEventListener("input", (e) => {
            tableSearchTerm[tableGlobalArrayId] = e.target.value;
            tableSearchCursorPosition[tableGlobalArrayId] = e.target.selectionStart;
            tableSearchCursorPositionEnd[tableGlobalArrayId] = e.target.selectionEnd;
            CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
        });

    if (subtableIds.length > 0)
    {
        for (let i = 0; i < subtableColumns.length; ++i)
        {
            counter = 0;
            for (let j = 0; j < subtableIds[i].length; ++j)
            {
                /*if (rowMeetsSearchTerm[j])
                    counter++;
                if (tableOffsets[tableGlobalArrayId] != 0 && counter < tableOffsets[tableGlobalArrayId])
                {
                    continue;
                }
                if (tableLimits[tableGlobalArrayId] > 0 && tableLimits[tableGlobalArrayId] + tableOffsets[tableGlobalArrayId] < counter)
                {
                    continue;
                }*/
                if (subtableHidden[i][j] || !rowMeetsSearchTerm[j])
                    continue;
                let subtableColumnNames = tableColumnValues[subtableColumns[i]][tableRowIds[j]][0];
                let subtableColumnIds = tableColumnValues[subtableColumns[i]][tableRowIds[j]][1];
                let subtableColumnWidths = tableColumnValues[subtableColumns[i]][tableRowIds[j]][2];
                let subtableRowIds = tableColumnValues[subtableColumns[i]][tableRowIds[j]][3];
                let subtableColumnValues = tableColumnValues[subtableColumns[i]][tableRowIds[j]][4];
                let subtableColumnCompare = tableColumnValues[subtableColumns[i]][tableRowIds[j]][5];
                let subtableColumnTypes = tableColumnValues[subtableColumns[i]][tableRowIds[j]][6];
                let subtableColumnLimit = tableColumnValues[subtableColumns[i]][tableRowIds[j]][7];
                //console.log(tableLimits[tableGlobalArrayId]);
                //console.log(counter);
                //console.log(tableOffsets[tableGlobalArrayId]);
                //console.log(subtableIds[i][j]);
                //console.log(subtableIds);
                CreateTable(tableColumnNames[subtableColumns[i]], subtableIds[i][j], subtableColumnNames, subtableColumnIds, subtableColumnWidths, subtableRowIds, subtableColumnValues, subtableColumnCompare, subtableColumnTypes, subtableColumnLimit);
            }
        }
        if (!tableSubtablesHidden[tableGlobalArrayId])
        {
            document.getElementById(tableid+"hideshowsubtables").addEventListener("click", async (event) => {
                let subtableFlip = false;
                if (missingSubtables[0].length > 0)
                {
                    subtableFlip = !tableHidden[createdTableIds.indexOf(missingSubtables[0][0])];
                }
                else
                {
                    subtableFlip = !tableHidden[createdTableIds.indexOf(existingSubtables[0][0])];
                }
                if (missingSubtables[0].length > 0)
                {
                    for (let i = 0; i < missingSubtables.length; ++i)
                    {
                        for (let j = 0; j < missingSubtables[i].length; ++j)
                        tableHidden[createdTableIds.indexOf(missingSubtables[i][j])] = subtableFlip;
                    }
                }
                if (existingSubtables[0].length > 0)
                {
                    for (let i = 0; i < existingSubtables.length; ++i)
                    {
                        for (let j = 0; j < existingSubtables[i].length; ++j)
                        tableHidden[createdTableIds.indexOf(existingSubtables[i][j])] = subtableFlip;
                    }
                }
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
        }
    }

    document.getElementById(tableid+"hideshowtable").addEventListener("click", async (event) => {
        tableHidden[createdTableIds.indexOf(tableid)] = !tableHidden[createdTableIds.indexOf(tableid)];
        CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
    });

    if (tableColumnValues[0].length > 0)
    {
        for (let i = 0; i < tableColumnIds.length; ++i)
        {
            if (tableColumnTypes[i] == "subtable")
                continue;
            document.getElementById(tableid+tableColumnIds[i]).addEventListener("click", async (event) => {
                columnSorts[tableGlobalArrayId] = ChangeSort(columnSorts[tableGlobalArrayId], i);
                //let rowIds = DoSort(columnSorts[tableGlobalArrayId], tableColumnValues, tableColumnTypes);
                CreateTable(tableName, tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit);
            });
        }
    }
}

function ChangeSort(columnSorts, sortId) {
    for (let i = 0; i < columnSorts.length; ++i)
    {
        if (sortId != i)
            columnSorts[i] = 0;
        else
        {
            if (columnSorts[i] == 1)
                columnSorts[i] = -1;
            else
                columnSorts[i] += 1;
        }
    }
    return columnSorts;
}

function DoSort(columnSorts, columnValues, tableColumnTypes) {
    let rowIds = [];
    for (let i = 0; i < columnValues[0].length; ++i)
    {
        rowIds.push(i);
    }
    let selectedSortId = -1;
    for (let i = 0; i < columnSorts.length; ++i)
    {
        if (columnSorts[i] != 0)
        {
            selectedSortId = i;
            break;
        }
    }
    if (selectedSortId != -1)
    {   
        for (let i = 0; i < columnValues[selectedSortId].length - 1; ++i)
        {
            for (let j = i + 1; j < columnValues[selectedSortId].length; ++j)
            {
                if (tableColumnTypes[selectedSortId] == "string")
                {
                    if ((columnSorts[selectedSortId] == -1) != (String(columnValues[selectedSortId][rowIds[i]]).toLowerCase() < String(columnValues[selectedSortId][rowIds[j]]).toLowerCase()))
                    {
                        let temp = rowIds[i];
                        rowIds[i] = rowIds[j];
                        rowIds[j] = temp;
                    }
                }
                else
                {
                    if ((columnSorts[selectedSortId] == -1) != (columnValues[selectedSortId][rowIds[i]] < columnValues[selectedSortId][rowIds[j]]))
                    {
                        let temp = rowIds[i];
                        rowIds[i] = rowIds[j];
                        rowIds[j] = temp;
                    }
                }
            }
        }
    }
    return rowIds;
}

function CreateGlobalTableData(tableid, tableColumnNames, tableColumnIds, tableColumnWidths, tableRowIds, tableColumnValues, tableColumnCompare, tableColumnTypes, tableLimit)
{
    if (!createdTableIds.includes(tableid))
    {
        createdTableIds.push(tableid);
        tableSearchTerm.push("");
        tableSearchPreviousTerm.push("");
        tableSearchCursorPosition.push(0);
        tableSearchCursorPositionEnd.push(0);
        tableOffsets.push(0);
        tableLimits.push(tableLimit);
        for (let i = 0; i < createdTableIds.length; ++i)
        {
            if (createdTableIds[i] == tableid)
            {
                tableGlobalArrayId = i;
                break;
            }            
        }
        columnSorts.push([]);        
        for (let i = 0; i < tableColumnNames.length; ++i)
        {
            columnSorts[columnSorts.length-1].push(0);
        }
        tableOriginalRowIds.push([]);
        for (let i = 0; i < tableRowIds.length; ++i)
        {
            tableOriginalRowIds[tableGlobalArrayId].push(tableRowIds[i]);
        }
        tableHidden.push(false);
        tableSubtablesHidden.push(false);
    }
}