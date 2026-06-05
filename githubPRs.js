// ==UserScript==
// @name         GitHub PR Title Fix
// @namespace    http://tampermonkey.net/
// @version      2026-06-05
// @description  Set GitHub Compare & pull request links to use the branch name as the PR title
// @author       Don't Worry About It Shawty
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    function getBranchName(pathname) {
        const match = pathname.match(/^\/[^/]+\/[^/]+\/compare\/(.+)$/);

        if (!match) {
            console.log("**** No compare path match:", pathname);
            return "";
        }

        try {
            const branchName = decodeURIComponent(match[1]);
            console.log("**** Extracted branch name:", branchName);
            return branchName;
        } catch (err) {
            console.error("**** Failed to decode branch name", err);
            return "";
        }
    }

    function updateComparePullRequestLink(link) {
        const label = link.textContent.trim().replace(/\s+/g, " ");

        if (label !== "Compare & pull request") return;

        console.log("**** Found Compare & pull request link:", link);

        const href = link.getAttribute("href");

        if (!href) {
            console.log("**** Skipping link with no href");
            return;
        }

        console.log("**** Original href:", href);

        let url;

        try {
            url = new URL(href, window.location.origin);
        } catch (err) {
            console.error("**** Failed to parse URL", err);
            return;
        }

        const branchName = getBranchName(url.pathname);

        if (!branchName) {
            console.log("**** Skipping because no branch name was found");
            return;
        }

        const originalUrl = url.toString();

        url.searchParams.delete("expand");
        url.searchParams.set("quick_pull", "1");
        url.searchParams.set("title", branchName);

        const newHref = `${url.pathname}?${url.searchParams.toString()}`;

        console.log("**** Rewriting URL");
        console.log("**** Before:", originalUrl);
        console.log("**** After :", newHref);

        link.href = newHref;
    }

    function updateComparePullRequestLinks() {
        const links = document.querySelectorAll('a[data-component="LinkButton"]');

        console.log(`**** Scanning ${links.length} LinkButton elements`);

        links.forEach(updateComparePullRequestLink);
    }

    console.log("**** Script initialized");
    console.log("**** Current URL:", location.href);

    updateComparePullRequestLinks();

    document.addEventListener("turbo:load", () => {
        console.log("**** turbo:load fired");
        updateComparePullRequestLinks();
    });

    function watchForComparePullRequestLinks() {
        if (!document.body) {
            console.log("**** document.body not ready, retrying...");
            setTimeout(watchForComparePullRequestLinks, 250);
            return;
        }

        console.log("**** Starting MutationObserver");

        const observer = new MutationObserver((mutations) => {
            console.log(`**** MutationObserver triggered (${mutations.length} mutations)`);
            updateComparePullRequestLinks();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    watchForComparePullRequestLinks();
})();
