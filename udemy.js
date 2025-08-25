// ==UserScript==
// @name         Udemy Fix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fixes Udemy
// @author       Don't Worry About It Shawty
// @match        https://*.udemy.com/course/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

// Set da window size
(function() {
    'use strict';

    console.log("*** Loaded ReSize script");

    // Wait for element to load
    setTimeout(() => {
        const elems = document.querySelectorAll('.curriculum-item-view--scaled-height-limiter--lEOjL');
        elems.forEach(elem => {
            elem.style.setProperty('max-block-size', 'calc(100vh - 10rem)');
        });
        console.log("*** Ran Udemy ReSize script");
    }, 2000);
})();

// Set the default playback rate
(function() {
    'use strict';

    console.log("*** Loaded Playback Rate script");

    const setRateTo = 1.75;

    // Save to cookies for when this or the next video loads
    document.cookie = "playbackspeed=1.75; path=/;";

    // Not needed because Udemy just pulls from the cookie
    // Wait for element to load
    // setTimeout(() => {
    //     const video = document.querySelector('video');
    //     if (video) {
    //         video.playbackRate = setRateTo;
    //     }

    //     const labelElem = document.querySelector('.playback-rate--trigger-text--l7hqr');
    //     if (labelElem) {
    //         labelElem.textContent = setRateTo + "x";
    //     }

    // }, 2000);
    console.log("*** Ran Udemy Playback Rate script");
})();
