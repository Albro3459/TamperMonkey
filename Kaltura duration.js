// ==UserScript==
// @name          Display total playlist duration in Kaltura
// @namespace     gatech.edu
// @description   Calculates and displays total playlist duration in Kaltura
// @version       0.1.0
// @match         *://canvasgatechtest.kaf.kaltura.com/*
// @match         *://cdnapisec.kaltura.com/*
// @grant         none
// @author        OG: Austin O'Boyle, Updated: Brodsky
// ==/UserScript==

(function() {
"use strict";

    // Format a number of seconds as hh:mm:ss, padded with zeros where appropriate
    function formatDuration(seconds) {
        seconds = Math.floor(seconds);

        let hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        seconds %= 60;
        return ("00" + hours).slice(-2) + ":" + ("00" + minutes).slice(-2) + ":" + ("00" + seconds).slice(-2);
    }

    function getVideoTimeRemaining(video) {
        if (!video.duration || video.paused || video.ended) return -1;

        return video.duration - video.currentTime;
    }

    function getTotalPlaybackTimeString(kdp, video) {
        try {
            let playlist = kdp.evaluate('{playlistAPI.dataProvider}').content[0].items;

            const currentId = kdp.kalturaPlayerMetaData.id; 
            let currentIndex = playlist?.findIndex(item => item.id === currentId);

            const videoTime = getVideoTimeRemaining(video);
            if (videoTime >= 0 && currentIndex >= 0 && currentIndex < playlist.length - 1) {
                // only skip video if the video exists and not the last video
                currentIndex++;
            }

            if (currentIndex > 0 && currentIndex < playlist.length) {
                playlist = playlist.slice(currentIndex);
            }

            let totalDurationSeconds = playlist.reduce((total, item) => { return total + item.duration; }, 0);
            if (videoTime >= 0) {
                totalDurationSeconds += videoTime;
            }

            return formatDuration(totalDurationSeconds);
        } catch (err) {
            console.log(err);
            return "??:??:??";
        }
    }

    const updatePlaybackTime = (kdp, video) => {
        // Waits for the playlist description to load, and then shows the time
            
        const playlistEl = document.querySelector(".playlistDescription");

        if (playlistEl) {
            const totalTime = getTotalPlaybackTimeString(kdp, video);
            
            // Always reset to the "X video(s)" base text
            const baseMatch = playlistEl.textContent.match(/^\d+\s+videos?/i);
            const baseText = baseMatch ? baseMatch[0] : playlistEl.textContent;
            playlistEl.textContent = `${baseText} (${totalTime}) remaining`;
        }
    };

    kWidget.addReadyCallback(playerId => {
        const kdp = document.getElementById(playerId);
        kdp.kBind("playerReady", () => {
            kdp.kBind("playing", event => {
                const video = document.querySelector("video.persistentNativePlayer");
                if (video && !window.timeUpdater) {
                    window.timeUpdater = setInterval(() => {
                        updatePlaybackTime(kdp, video);
                    }, 1000); // run every second
                }
            });

            ["ended", "pause", "playlistPlayPrevious", "playlistPlayNext"].forEach(eventName => {
                kdp.kBind(eventName, () => {
                    if (window.timeUpdater) {
                        clearInterval(window.timeUpdater);
                        window.timeUpdater = null;
                    }
                });
            });
        });
    });
})();