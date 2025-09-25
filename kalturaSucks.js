// ==UserScript==
// @name         Kaltura Hacks
// @namespace    http://tampermonkey.net/
// @version      2025-09-25
// @description  Save current Kaltura video, playback rate, add the remaining playlist duration, add F7 & F9 as shortcuts to skip forward and back, and made the Kaltura icon open the media player in its own full window
// @author       Brod
// @match        https://cdnapisec.kaltura.com/*
// @match        https://www.kaltura.com/*
// @match        https://gatech.instructure.com/courses/*/pages/*-playlist*
// @grant        none
// ==/UserScript==

// Based on https://github.gatech.edu/C21U/custom-user-scripts remember-user-settings-kaltura-video-player.user.js and kaltura-playlist-duration.user.js

// Set the default playback speed for the Canvas Kaltura videos
(() => {
    const defaultSpeed = 1.75;

    const speedKey = "playbackRate";

    function setPlaybackSpeed(speed) {
        localStorage.setItem(speedKey, speed); // gets stored as a string
    }

    function getPlaybackSpeed() {
        const speed = parseFloat(localStorage.getItem(speedKey) || ""); // gets stored as a string
        if (!isNaN(speed)) {
            return speed;
        }
        else {
            setPlaybackSpeed(defaultSpeed);
            return defaultSpeed;
        }
    }

    function updatePlaybackSpeed(kdp, video) {
        const speed = getPlaybackSpeed();
        if (speed !== video.playbackRate) {
            kdp.sendNotification('playbackRateChangeSpeed', getPlaybackSpeed());

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

    function listenToUpdates(kdp) {
        kdp.kBind("updatedPlaybackRate", newSpeed => {
            setPlaybackSpeed(newSpeed);
        });
    }

    kWidget.addReadyCallback(playerId => {
        const kdp = document.getElementById(playerId);

        if (!kdp) return;

        kdp.kBind("playerReady", () => {
            kdp.kBind("playing", event => {
                const video = document.querySelector("video.persistentNativePlayer");
                if (video) {
                    updatePlaybackSpeed(kdp, video);
                    listenToUpdates(kdp);
                }
            });
        });
    });
})();
// end

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
// end

// Calculates and displays total playlist duration in Kaltura
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
// end

// Save the current video index in the playlist so reload brings you to the correct video
// type vids = Record<string, number>;
(() => {
    let isFirstLoad = true;
    let kdp = undefined;

    const currentVideoKey = "currentVideo";


    function setStoredCurrentVideo(playlistID, index) {
        const vids = JSON.parse(localStorage.getItem(currentVideoKey)) ?? {};

        vids[playlistID] = index;
        localStorage.setItem(currentVideoKey, JSON.stringify(vids));
    }

    function getStoredCurrentVideoIndex(playlistID) {
        const vids = JSON.parse(localStorage.getItem(currentVideoKey));
        if (!vids) {
            return -1;
        } else if (vids[playlistID] === undefined) {
            return -1;
        }

        return vids[playlistID] ?? -1;
    }

    function getCurrentPlaylist(kdp) {
        const playlists = kdp?.kalturaPlaylistData;
        const playlistID = Object.keys(playlists)[0];

        const playlist = { id: playlistID, content: playlists[playlistID]?.items };
        return playlist;
    }

    function getCurrentVideoIndex(kdp, playlist) {
        const currentID = kdp?.kalturaPlayerMetaData?.id;
        return playlist?.content?.findIndex(item => item?.id === currentID) ?? -1;
    }

    function switchToVideo(kdp, playlist, index) {
        if (index >= 0 && index < playlist?.content?.length) {

            const playlistRoot = document.querySelector(".playlistInterface");
            if (!playlistRoot) {
                return;
            }

            const lis = playlistRoot.querySelectorAll("li[data-mediabox-index]");
            for (let li of lis) {
                if (li.getAttribute("data-mediabox-index") === index.toString()) {
                    li.click();
                    return;
                }
            }
        }
    }

    function waitAndSwitch(kdp, playlist, index, tries = 5) {
        if (playlist?.content[index]) {
            switchToVideo(kdp, playlist, index);
        } else if (tries > 0) {
            setTimeout(() => waitAndSwitch(kdp, playlist, index, tries - 1), 500);
        }
    }

    function checkForVideoToSwitch(kdp) {
        const playlist = getCurrentPlaylist(kdp);
        if (!playlist) return null;

        const index = getStoredCurrentVideoIndex(playlist?.id);
        if (index > 0) {
            waitAndSwitch(kdp, playlist, index);
        }

        return playlist;
    }

    function onPlaying() {
        const video = document.querySelector("video.persistentNativePlayer");
        if (video) {
            let playlist;
            if (isFirstLoad) {
                isFirstLoad = false;
                playlist = checkForVideoToSwitch(kdp);
            } else {
                playlist = getCurrentPlaylist(kdp);
            }

            if (!playlist) {
                return;
            }

            const currIndex = getCurrentVideoIndex(kdp, playlist);
            if (currIndex < 0) {
                return;
            }
            setStoredCurrentVideo(playlist?.id, currIndex);
        }
    }

    window.addEventListener("load", () => {
        kWidget.addReadyCallback(playerId => {
            kdp = document.getElementById(playerId); // kaltura_player_
            if (!kdp) {
                return;
            }

            kdp.kBind("playing", () => {
                onPlaying();
            });
        });
    });
})();
// end

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
// end