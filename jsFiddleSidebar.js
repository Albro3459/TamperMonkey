// ==UserScript==
// @name         Hide JSFiddle Sidebar
// @namespace    http://tampermonkey.net/
// @version      12/19/2025
// @description  Hide JSFiddle Sidebar
// @author       Don't Worry About It Shawty
// @match        https://jsfiddle.net/
// @grant        none
// ==/UserScript==

(function () {
  const css = `
    /* this '@media' query is the fix. 'min-width: 0px' makes this always applied. Also // comments don't work in CSS */
    @media (min-width: 0px) {
        /* Inner css is exactly the same as the 'css/dist-editor.css?*' file */
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

        body #fiddle-info .sidebarToggle {
            display: none
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

  const style = document.createElement("style");
  style.textContent = css;
  document.documentElement.appendChild(style);
})();