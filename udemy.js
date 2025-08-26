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

    // Wait for element to load
    setTimeout(() => {
        const elems = document.querySelectorAll('.curriculum-item-view--scaled-height-limiter--lEOjL');
        elems.forEach(elem => {
            elem.style.setProperty('max-block-size', 'calc(100vh - 10rem)');
        });
    }, 2000);
})();

// Set the default playback rate
(function() {
    'use strict';

    const setRateTo = 1.75;

    // Save to cookies for when this or the next video loads
    document.cookie = "playbackspeed=1.75; path=/;";
})();



// Make checkboxes selectable
function fixCheckboxes() {
    // Where ID like "popper-trigger--%"
    const elems = document.querySelectorAll('div[id^="popper-trigger--"]'); // from id

    elems.forEach(e => {
        const label = e.querySelector('label');
        const input = label.querySelector('input');

        // Enable toggle
        label?.classList.remove('ud-toggle-input-disabled');
        label?.classList.add('ud-toggle-input');

        // Enable input
        input?.removeAttribute('disabled');
    });

    // Stop annoying popups onHover
    const style = document.createElement("style");
    style.textContent = `
        div[class^="popper-module--popper-content--"] [class*="tooltip-module--tooltip--"] {
            display: none !important;
        }`;
    document.head.appendChild(style);
}

setTimeout(() => {
    fixCheckboxes();

    // Watch for section open/close
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'data-checked') {
                if (m.target.getAttribute('data-checked') === 'checked') {
                    // New section just opened
                    fixCheckboxes();
                }
            }
        }
    });

    // Attach observer to the whole body, watching for data-checked to flip
    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-checked']
    });

}, 2000);