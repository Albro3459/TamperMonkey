// ==UserScript==
// @name         Kaltura Save Current Video
// @namespace    http://tampermonkey.net/
// @version      2025-08-24
// @description  Save the current video index so reload brings u to the correct video
// @author       Brod
// @match        https://cdnapisec.kaltura.com/*
// @match        https://www.kaltura.com/*
// @match        https://gatech.instructure.com/courses/*/pages/*-playlist*
// @grant        none
// ==/UserScript==


// Plan
/* 
 * detect page load and/or video load window.addEventListener("load", ...)
 * check local storage at the currentVideo key for an entry with the current playlist ID. Format: { [playlistID]: index, ... }
    * if there is one, switch to that index in the playlist (or there's gotta be a way to do that, like clicking on the video card on playlist, not skipping) 
 * on kdp.kBind("playing"), set the currentVideo key with the current index { [playlistID]: index }
*/

// type vids = Record<string, number>;

let isFirstLoad = true;
let kdp = undefined;

const currentVideoKey = "currentVideo";


function setStoredCurrentVideo(playlistID, index) {
    const vids = JSON.parse(localStorage.getItem(currentVideoKey)) ?? {};

    vids[playlistID] = index;
    localStorage.setItem(currentVideoKey, JSON.stringify(vids));
}

function getStoredCurrentVideoIndex(playlistID) {
    console.log("*** getStoredCurrentVideoIndex");
    const vids = JSON.parse(localStorage.getItem(currentVideoKey));
    if (!vids) {
        console.log("*** GET: failed to get vids");
        return -1;
    } else if (vids[playlistID] === undefined) {
        console.log("*** GET: failed to get current vid");
        return -1;
    }

    return vids[playlistID] ?? -1;
}

function getCurrentPlaylist(kdp) {
    const playlists = kdp?.kalturaPlaylistData;
    const playlistID = Object.keys(playlists)[0];

    const playlist = { id: playlistID, content: playlists[playlistID]?.items };
    console.log("*** getCurPlaylist:", playlist);
    return playlist;
}

function getCurrentVideoIndex(kdp, playlist) {
    const currentID = kdp?.kalturaPlayerMetaData?.id;
    return playlist?.content?.findIndex(item => item?.id === currentID) ?? -1;
}

function switchToVideo(kdp, playlist, index) {
    if (index >= 0 && index < playlist?.content?.length) {
        console.log("*** SWITCHING");
        const entryId = playlist?.content[index]?.id;
        // should work, just doesnt update the playlist select UI
        kdp?.sendNotification("changeMedia", {
            entryId: entryId,
            playlistCall: true,
            referenceId: null
        });
    } else {
        console.log("*** SWITCH index out of range:", index, playlist?.content?.length, playlist);
    }
}

function waitAndSwitch(kdp, playlist, index, tries = 5) {
    console.log("*** WAIT");
    if (playlist?.content[index]) {
        switchToVideo(kdp, playlist, index);
    } else if (tries > 0) {
        console.log("** wait again");
        setTimeout(() => waitAndSwitch(kdp, playlist, index, tries - 1), 500);
    } else {
        console.log("*** Gave up waiting for video", index);
    }
}

function checkForVideoToSwitch(kdp) {
    console.log("*** checkForVideoToSwitch");
    const playlist = getCurrentPlaylist(kdp);
    if (!playlist) return null;

    const index = getStoredCurrentVideoIndex(playlist?.id);
    console.log("*** check index:", index);
    if (index > 0) {
        waitAndSwitch(kdp, playlist, index);
    }

    return playlist;
}

function onPlaying() {
    console.log("*** on playing");
    const video = document.querySelector("video.persistentNativePlayer");
    if (video) {
        let playlist;
        if (isFirstLoad) {
            console.log("*** FIRST");
            isFirstLoad = false;
            playlist = checkForVideoToSwitch(kdp);
        } else {
            console.log("*** NOT first");
            playlist = getCurrentPlaylist(kdp);
        }

        if (!playlist) {
            console.log("*** Playing: can't find playlist");
            return;
        }

        const currIndex = getCurrentVideoIndex(kdp, playlist);
        if (currIndex < 0) {
            console.log("*** can't find curr video index");
            return;
        }
        setStoredCurrentVideo(playlist?.id, currIndex);
    }
}

window.addEventListener("load", () => {
    console.log("*** window fully loaded");

    kWidget.addReadyCallback(playerId => {
        kdp = document.getElementById(playerId); // kaltura_player_
        if (!kdp) {
            console.log("*** no player");
            return;
        }

        kdp.kBind("playing", () => {
            console.log("** PLAYING ***");
            onPlaying();
        });
    });
});