// ==UserScript==
// @name         Canvas Kaltura video settings
// @namespace    http://tampermonkey.net/
// @version      2025-08-22
// @description  Set user settings
// @author       Brod
// @match        https://cdnapisec.kaltura.com/*
// @match        https://gatech.instructure.com/courses/*/pages/*-playlist*
// @grant        none
// ==/UserScript==

// Based on https://github.gatech.edu/C21U/custom-user-scripts/blob/master/remember-user-settings-kaltura-video-player.user.js#bypass=true

// Set the default playback speed for the Canvas Kaltura videos
(() => {
    const defaultSpeed$ = 1.75;

    const speedKey$ = "playback_speed";

    console.log("*** LOADED");

    function setPlaybackSpeed$(speed) {
        localStorage.setItem(speedKey$, speed); // gets stored as a string
        console.log("*** Set speed: " + speed);
    }

    function getPlaybackSpeed$() {
        const speed = parseFloat(localStorage.getItem(speedKey$) || "");
        if (!isNaN(speed)) {
            console.log("*** Found local storage speed: " + speed);
            return speed;
        }
        else {
            console.log("*** Local storage speed NOT found. Setting and returning...: " + speed);
            setPlaybackSpeed$(defaultSpeed$);
            return defaultSpeed$;
        }
    }

    // NO OPTIONAL CHAINING
    kWidget.addReadyCallback(playerId => {
        const kdp = document.getElementById(playerId);

        if (!kdp) return;

        kdp.kBind("playerReady", () => {
            kdp.kBind("playing", event => {
                console.log("*** Sending speed notification");
                kdp.sendNotification('playbackRateChangeSpeed', getPlaybackSpeed$());
            });
        });
    });

    console.log("*** DONE");
})();