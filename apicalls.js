const apiv1 = "https://us-central1-rhythm-typer.cloudfunctions.net/api";
const apiv2 = "https://us-central1-rhythm-typer.cloudfunctions.net/api/v2";

//apiv2 + "/leaderboard?limit=50&offset=0&sortBy=totalPP"
/*
offset can be changed
array of the following object that contains:
{
    accuracy
    country
    playCount
    previousRank
    profilePictureUrl
    rank
    rankChange
    rankedScore
    totalPP
    userId
    username
}
*/


async function GetPlayersFromLeaderboard(limit, offset, sortby) {
    let localFetchResult = [];
    while (limit > 0) {
        await fetch(apiv2 + "/leaderboard?limit=" + Math.min(limit, 50) + "&offset=" + offset + "&sortBy=" + sortby, {cache: "no-store"}).then(response => response.json())
            .then(localPlayerData => {
                for (let i = 0; i < localPlayerData.length; ++i) {
                    localFetchResult.push(localPlayerData[i]);
                }
            });
        limit -= 50;
        offset += 50;
    }
    return localFetchResult;
}

//GetPlayersFromLeaderboard(100, 0, "totalPP").then(x => {
//    console.log(x);
//});



//apiv2+"/profile/"+userId
/*
userId is from the api call above
object that contains:
{
    accuracy
    country
    countryRank
    createdAt
    {
        _nanoseconds
        _seconds
    }
    experience
    followerCount
    followingCount
    globalRank
    grades
    {
        a
        b
        c
        d        
        f
        s
        ss
    }
    lastRankedScoreRecalculation
    {
        _seconds
        _nanoseconds
    }
    lastTopPlaysUpdate
    {
        _seconds
        _nanoseconds
    }
    lastUpdated
    {
        _seconds
        _nanoseconds
    }
    level
    playCount
    playHeatmap
    {
        //disctionary where keys are dates and values are amount of playing
    }
    playTime
    pp
    profileDescription
    profilePictureUpdatedAt
    porfilePictureUrl
    profilePictureVersion
    rankHistory
    {
        //array of objects with the following keys:
        date
        pp
        rank
    }
    rankedScore
    rawPP
    recentPlays
    recentPlaysFormat
    region
    topPlays
    {
        //array of object with the following keys:
        acc
        at
        //beatmap artist
        ba
        //beatmap id / diff id
        bid
        //beatmap title
        bt
        //taps + 2*holds + typing section
        cb
        //diffname
        diff
        //grade
        gr
        mods
        pp
        //score
        sc
        //beatmapset id
        sid
    }
    topPlaysCount
    topPlaysExpanded
    {
        //array of objects with the following keys:
        acc
        at
        //beatmap artist
        ba
        //beatmap id / diff id
        bid
        //beatmap title
        bt
        //taps + 2*holds + typing section
        cb
        //diffname
        diff
        //grade
        gr
        mods
        pp
        //score
        sc
        //beatmapset id
        sid
    }
    topPlaysFormat
    totalPP
    //unused
    totalPlays
    //unused
    totalPlayTime
    totalScore
    updatedAt
    {
        _seconds
        _nanoseconds
    }
    userId
    username
    usernameLower
}
*/


async function GetPlayerData(userId) {
    let localFetchResult;
    await fetch(apiv2 + "/profile/" + userId, {cache: "no-store"}).then(response => response.json())
        .then(localPlayerData => {
            localFetchResult = localPlayerData
        });
    return localFetchResult;
}

//GetPlayerData("RXUO3zA4ciQkJ3O63MJyMFAGCCM2").then(x => {
//    console.log(x);
//});







//https://us-central1-rhythm-typer.cloudfunctions.net/api/getBeatmaps?limit=1&mapsetId=lvwb5rxv3cr6
/*
    beatmaps
    array of the following object
    {
        artistName
        audioPreviewUrl
        backgroundImageUrl    
        backgroundUrls (array of links)
        bpm
        description
        difficulties
        array of the following objects
        {
            catchCount
            diffId
            holdCount
            length
            name
            overallDifficulty
            overallDifficultyHT
            overallDifficultyNC
            starRating
            starRatingHT
            starRatingNC
            tapCount
            typingCount
        }
        difficultyPlayCounts
        downloadCount
        duration
        explciit
        favouriteCount
        hasCustomHitsounds
        hasVideo
        id
        language
        lastPlayed
        {
            _seconds
            _nanoseconds
        }
        lastUpdatedAt
        {
            _seconds
            _nanoseconds        
        }
        mapper
        mapperId
        mapsetId
        nominationCount
        nominations
        offset
        playCount
        previewTime
        rating
        ratingCount
        rtmSize
        rtmUrl
        searchText
        searchTokens
        songName
        status
        tags
        uploadedAt
        uploadadBy
        version
        versionHistory
    }
*/


async function GetBeatmapData(beatmapId) {
    let localFetchResult;
    await fetch(apiv1 + "/getBeatmaps?limit=1&mapsetId=" + beatmapId, {cache: "no-store"}).then(response => response.json())
        .then(localBeatmapData => {
            localFetchResult = localBeatmapData;
        });
    return localFetchResult;
}

//GetBeatmapData("lvwb5rxv3cr6").then(x => {
//    console.log(x);
//});

//https://us-central1-rhythm-typer.cloudfunctions.net/api/v2/beatmap/%7BmapsetId%7D/difficulty/%7BdiffId%7D
//https://us-central1-rhythm-typer.cloudfunctions.net/api/v2/beatmap/lvwb5rxv3cr6/difficulty/aAHlPn7DGsDjoLqLNNpr
/*
    bpm
    difficultyTitle
    mapsetId
    notes
    Array of the following object
    {
        key
        type: "tap"
        time
        type: "hold"
        startTime
        endTime
    }
    overallDifficulty
    songTitle
    typingSections
    Array of the following object
    {
        text
        endTime
        startTime
    }
*/


async function GetDifficultyData(beatmapId, difficultyId) {
    let localFetchResult;
    await fetch(apiv2 + "/beatmap/" + beatmapId + "/difficulty/" + difficultyId, {cache: "no-store"}).then(response => response.json())
        .then(localDifficultyData => {
            localFetchResult = localDifficultyData;
        });
    return localFetchResult;
}

//GetDifficultyData("lvwb5rxv3cr6", "aAHlPn7DGsDjoLqLNNpr").then(x => {
//    console.log(x);
//});




//https://us-central1-rhythm-typer.cloudfunctions.net/api/v2/user/%7BuserId%7D/allScores
/*  
    count
    hasMore
    nextCursor
    scores
    Array of the following object:
    {
        accuracy
        difficultyId
        difficultyName
        grade
        mapsetId
        mods
        playedAt
        pp
        score
        scoreId
    }
*/

async function GetScoreData(userId) {
    let localFetchResult;
    await fetch(apiv2 + "/user/" + userId + "/allScores", {cache: "no-store"}).then(response => response.json())
        .then(localPlayerData => {
            localFetchResult = localPlayerData;
        });
    return localFetchResult;
}

//GetScoreData("RXUO3zA4ciQkJ3O63MJyMFAGCCM2").then(x => {
//    console.log(x);
//});





//https://us-central1-rhythm-typer.cloudfunctions.net/api/v2/players&limit=500
/*
    Array of the following object:
    {
        userId
        username
        totalPP
    }
*/

async function GetLesserPlayerDatas(limit) {
    let localFetchResult;
    await fetch(apiv2 + "/players&limit=" + limit, {cache: "no-store"}).then(response => response.json())
        .then(localPlayerData => {
            localFetchResult = localPlayerData;
        });
    return localFetchResult;
}

//GetLesserPlayerDatas(500).then(x => {
//    console.log(x);
//});

//apiv1+"/getBeatmaps?limit=1&status=ranked"
//limit max is 100
/*beatmaps array which contains objects with the following buildup:
{
  artistName
  audioPreviewUrl
  backgroundImageUrl
  backgroundUrls
  bpm
  description
  difficulties //Array of objects with the following buildup:  
  {
    diffId
    holdCount
    length
    name
    noteCount
    overallDifficulty
    overallDifficultyHT
    overallDifficultyNC
    starRating
    starRatingHT
    starRatingNC
    typingCount
  }
  difficultyPlayCounts //object
  downloadCount
  duration
  explicit
  favoriteCount
  hasCustomHitsounds
  hasVideo
  id
  language
  lastPlayed
  {
    _seconds
    _nanoseconds
  }
  lastUpdatedAt
  {
    _seconds
    _nanoseconds
  }
  mapper
  mapperId
  mapsetId
  nominationCount
  nominations //Array of objects with the following buildup:
  {
    nominatedAt
    nominatorId
    nominatorUsername
  }
  offset
  playCount
  previewTime
  qualifiedBy
  qualifiedByUsername
  rankedDate
  rating
  ratingCount
  rtmSize
  rtmUrl
  searchText
  searchTokens (array of strings)
  songName
  status
  tags
  uploadedAt
  uploadedBy
  version
  versionHistory //Arrray of objects with the following buildup:
  {
    timestamp
    type
    version
  }
}*/
async function GetRankedBeatmapDatas(offset, limit) {
    let cursor = "";
    let hasMore = true;
    let localFetchResult = [];
    let getAllOfThem = limit == -1;
    let counter = 0;
    let realLimit = limit + offset;
    while(hasMore && (localFetchResult.length < realLimit - offset|| getAllOfThem))
    {
        limit = Math.min(realLimit - localFetchResult.length - counter, 100);
        if (getAllOfThem)
            limit = 100;
        let cursorParameter = "";
        if (cursor != "") {
            cursorParameter = "&cursor=" + cursor;
        }
        await fetch(apiv1 + "/getBeatmaps?limit=" + limit + "" + cursorParameter + "&status=ranked&sortBy=uploaded&showExplicit=true&language=all", {cache: "no-store"})
            .then(response => response.json())
            .then(data => {
                for (let i = 0; i < data.beatmaps.length; ++i) {
                    
                    if (counter < offset)
                    {
                        counter++;
                        continue;                    
                    }                    
                    localFetchResult.push(data.beatmaps[i]);
                }
                //console.log(data);
                hasMore = data.hasMore;
                if (data.hasMore) {
                    cursor = data.nextCursor;
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }
    
    return localFetchResult;
}

//await GetRankedBeatmapDatas(0, -1).then(x => {
//    console.log(x);
//});