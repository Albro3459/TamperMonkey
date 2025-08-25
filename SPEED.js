// ==UserScript==
// @name         Canvas Kaltura video settings
// @namespace    http://tampermonkey.net/
// @version      2025-08-24
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

    function setPlaybackSpeed$(speed) {
        localStorage.setItem(speedKey$, speed); // gets stored as a string
    }

    function getPlaybackSpeed$() {
        const speed = parseFloat(localStorage.getItem(speedKey$) || "");  // gets stored as a string
        if (!isNaN(speed)) {
            return speed;
        }
        else {
            setPlaybackSpeed$(defaultSpeed$);
            return defaultSpeed$;
        }
    }

    kWidget.addReadyCallback(playerId => {
        const kdp = document.getElementById(playerId);

        if (!kdp) return;

        kdp.kBind("playerReady", () => {
            kdp.kBind("playing", event => {
                const video = document.querySelector("video.persistentNativePlayer");
                if (video) {
                    const speed = getPlaybackSpeed$();
                    if (speed !== video.playbackRate) {
                        kdp.sendNotification('playbackRateChangeSpeed', getPlaybackSpeed$());

                        // restore focus back to the video element
                        setTimeout(() => {
                            if (document.activeElement) {
                                document.activeElement.blur();
                            }
                            video.setAttribute("tabindex", "-1");
                            video.focus();
                        }, 50);
                    } 
                }                
            });
        });
    });
})();