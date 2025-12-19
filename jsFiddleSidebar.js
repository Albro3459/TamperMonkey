// ==UserScript==
// @name         Hide JSFiddle Sidebar
// @namespace    http://tampermonkey.net/
// @version      12/19/2025
// @description  Hide JSFiddle Sidebar
// @author       Don't Worry About It Shawty
// @match        https://jsfiddle.net/*
// @grant        none
// ==/UserScript==

let sidebarStyle$ = null;
let sidebarVisible$ = true;

(function () {
    function hideSidebar() {
        const css = `
            @media (min-width: 0px) {
                body #layout-container header {
                    background-color:var(--sidebar-bg)
                }

                body #layout-container {
                    grid-template-columns: 55px 1fr;
                    grid-template-areas: "sidebar header" "content content"
                }

                body #fiddle-info {
                    left: 0
                }

                body #sidebar {
                    grid-template-rows: 66px 0 0 0
                }

                body #sidebar h1 svg {
                    width: 36px
                }

                body #sidebar #sidebar-footer,body #sidebar #sidebar-main,body #sidebar #sidebar-user,body .headerActions li.collaborateButton,body .headerActions li.divider,body .headerActions li.downloadButton,body .headerActions li.embedButton,body .headerActions li.favButton,body .headerActions li.gridButton,body .headerActions li.proButton,body .headerActions li.themeButton,body .headerActions li.togglePrivacy {
                    display: none
                }
            }
        `;

        sidebarStyle$ = document.createElement("style");
        sidebarStyle$.textContent = css;
        document.documentElement.appendChild(sidebarStyle$);

        sidebarVisible$ = false;
    }

    function showSidebar() {
        if (sidebarStyle$) {
            sidebarStyle$.remove();
            sidebarStyle$ = null;
        }

        sidebarVisible$ = true;
    }

    function toggleSidebar(show = false) {
        if (!show) {
            hideSidebar();
        } else {
            showSidebar();
        }
    }

    // Remove the sidebar ad
    const ad = document.querySelector('#sidebar-footer');
    ad?.remove();

    // Start hidden
    toggleSidebar(false);

    const sidebar = document.querySelector('[data-tippy-simple-content="Collapse sidebar"]');
    if (!sidebar) {
        console.log("*** NO SIDEBAR BUTTON ***");
    }
    else {
        // Remove the (PRO) bubble on the tooltip:
        sidebar.removeAttribute('data-tippy-pro');

        sidebar.addEventListener("click", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();

            toggleSidebar(!sidebarVisible$);
        });
    }

})();