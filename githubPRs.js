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

    let lastTitleBranchName = "";
    let formUpdateScheduled = false;
    const formUpdateDelays = [0, 100, 250, 500, 1000, 2000, 4000];

    function cleanBranchName(branchName) {
        if (!branchName) return "";

        const headBranchName = branchName.split("...").pop();
        return headBranchName.split(":").pop();
    }

    function getBranchName(pathname) {
        const match = pathname.match(/^\/[^/]+\/[^/]+\/compare\/(.+)$/);

        if (!match) {
            console.log("**** No compare path match:", pathname);
            return "";
        }

        try {
            const branchName = cleanBranchName(decodeURIComponent(match[1]));
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

    function getBranchNameFromPullRequestForm() {
        const paramsBranchName = cleanBranchName(new URLSearchParams(window.location.search).get("title"));
        if (paramsBranchName) return paramsBranchName;

        const comparePathBranchName = getBranchName(window.location.pathname);
        if (comparePathBranchName) return comparePathBranchName;

        const form = document.querySelector("form#new_pull_request");
        const action = form?.getAttribute("action");
        if (!action) return "";

        let url;
        try {
            url = new URL(action, window.location.origin);
        } catch (err) {
            console.error("**** Failed to parse PR form action", err);
            return "";
        }

        const head = url.searchParams.get("head");
        return cleanBranchName(head);
    }

    function setInputValue(input, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(input, "value")?.set;
        const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
            valueSetter.call(input, value);
        } else {
            input.value = value;
        }

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function updatePullRequestTitle() {
        const titleInput = document.querySelector('input[name="pull_request[title]"]');
        if (!titleInput) return;

        const branchName = getBranchNameFromPullRequestForm();
        if (!branchName) return;

        lastTitleBranchName = branchName;

        if (titleInput.value === branchName) return;

        console.log("**** Updating PR title");
        console.log("**** Before:", titleInput.value);
        console.log("**** After :", branchName);

        setInputValue(titleInput, branchName);
    }

    function updatePullRequestDescription() {
        const bodyInput = document.querySelector('textarea[name="pull_request[body]"]');
        if (!bodyInput) return;

        if (bodyInput.dataset.brodCleared === "true") return;
        if (!bodyInput.value) return;

        console.log("**** Clearing PR description:", bodyInput.value);

        setInputValue(bodyInput, "");
        bodyInput.dataset.brodCleared = "true";
    }

    function updatePullRequestForm() {
        updatePullRequestTitle();
        updatePullRequestDescription();
    }

    function schedulePullRequestFormUpdates() {
        if (formUpdateScheduled) return;

        formUpdateScheduled = true;

        formUpdateDelays.forEach(delay => {
            setTimeout(() => {
                updatePullRequestForm();

                if (delay === formUpdateDelays[formUpdateDelays.length - 1]) {
                    formUpdateScheduled = false;
                }
            }, delay);
        });
    }

    function isCreatePullRequestButton(button) {
        return button.textContent.trim().replace(/\s+/g, " ") === "Create pull request";
    }

    function updateComparePullRequestLinks() {
        const links = document.querySelectorAll('a[data-component="LinkButton"]');

        console.log(`**** Scanning ${links.length} LinkButton elements`);

        links.forEach(updateComparePullRequestLink);
        updatePullRequestForm();
    }

    console.log("**** Script initialized");
    console.log("**** Current URL:", location.href);

    updateComparePullRequestLinks();

    document.addEventListener("turbo:load", () => {
        console.log("**** turbo:load fired");
        updateComparePullRequestLinks();
    });

    document.addEventListener("click", event => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const button = target.closest("button");
        if (!button || !isCreatePullRequestButton(button)) return;

        console.log("**** Create pull request button clicked");
        schedulePullRequestFormUpdates();
    }, true);

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

            if (lastTitleBranchName) {
                schedulePullRequestFormUpdates();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    watchForComparePullRequestLinks();
})();
