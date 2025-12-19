// ==UserScript==
// @name         Hide JSFiddle Sidebar
// @namespace    http://tampermonkey.net/
// @version      12/19/2025
// @description  Hide JSFiddle Sidebar
// @author       Don't Worry About It Shawty
// @match        https://jsfiddle.net/
// @grant        none
// ==/UserScript==

let sidebarStyle$;

(function () {
    const el = document.querySelector('.sidebarToggle');
    if (el) {
        el.className = 'sidebarToggle'; // start clean
    }

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

                body .modalBody {
                    align-items: start
                }

                body .modalApp {
                    min-width: auto;
                    height: auto;
                    min-height: auto
                }

                body #editor-options .fieldsCont {
                    grid-template-columns: 1fr 1fr
                }
            }
        `;

        sidebarStyle$ = document.createElement("style");
        sidebarStyle$.textContent = css;
        document.documentElement.appendChild(sidebarStyle$);

        // add disabled
        const el = document.querySelector('.sidebarToggle');
        if (el) {
            el.className = 'sidebarToggle disabled';
        }
    }

    function showSidebar() {
        if (sidebarStyle$) {
            sidebarStyle$.remove();
            sidebarStyle$ = null;
        }

        // remove disabled
        const el = document.querySelector('.sidebarToggle');
        if (el) {
            el.className = 'sidebarToggle';
        }
    }

    function toggleSidebar(show = false) {
        if (!show) {
            hideSidebar();
        } else {
            showSidebar();
        }
    }

    function isSidebarDisabled() {
        return document.querySelector('.sidebarToggle.disabled') !== null;
    }

    const sidebar = document.querySelector('[data-tippy-simple-content="Collapse sidebar"]');
    if (!sidebar) {
        // console.log("*** NO TOOLTIP ***");
        toggleSidebar(false);
    } else {
        // Remove the (PRO) bubble on the tooltip:
        sidebar.removeAttribute('data-tippy-pro');

        document.addEventListener(
            "click",
            (e) => {
                if (sidebar) {
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    toggleSidebar(isSidebarDisabled());
                } else {
                    // console.log("*** NO SIDEBAR TOGGLE ***");
                }
            },
            true
        );
    }

})();