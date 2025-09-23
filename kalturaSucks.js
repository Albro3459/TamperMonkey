// ==UserScript==
// @name         Kaltura Hacks
// @namespace    http://tampermonkey.net/
// @version      2025-08-24
// @description  Save playback rate, add F7 & F9 as shortcuts to skip forward and back, and made the Kaltura icon open the media player in itws own full window
// @author       Brod
// @match        https://cdnapisec.kaltura.com/*
// @match        https://www.kaltura.com/*
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

// Add F7 (back) and F9 (forward) as shortcuts to go back and skip forward a video
(() => {
    kWidget.addReadyCallback(playerId => {
        const kdp = document.getElementById(playerId);
        if (!kdp) return;

        document.addEventListener("keydown", e => {
            if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

            if (e.key === "F7") {
                kdp.sendNotification("playlistPlayPrevious");
                e.preventDefault();
            }
            if (e.key === "F9") {
                kdp.sendNotification("playlistPlayNext");
                e.preventDefault();
            }
        });

        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                kdp.sendNotification("playlistPlayPrevious");
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                kdp.sendNotification("playlistPlayNext");
            });
        }
    });
})();

// Update the Kaltura Logo on the video to open the playlist in its own window
(() => {
    // This runs inside the Kaltura video player, so the window.location.href is actually the URL of the Kaltura player 
    const url = window.location.href;

    const observer = new MutationObserver((mutations, obs) => {
        const logo = document.querySelector('.kaltura-logo a.btnFixed');
        if (logo) {
            logo.addEventListener('click', function(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                window.open(url, '_blank');
            }, true);

            obs.disconnect(); // stop watching once hooked
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();