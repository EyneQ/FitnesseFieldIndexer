function createMatchedFieldItem(field, index) {

    let documentFragment = new DocumentFragment();

    let matchedFieldItem = createMatchedFieldItemContainer(index);
    matchedFieldItem.appendChild(createMatchedFieldText(field));
    documentFragment.appendChild(matchedFieldItem);

    return documentFragment;

}

function createMatchedFieldItemContainer(index) {

    let container = document.createElement("div");
    container.classList.add("matched_field-item");

    container.addEventListener("mouseenter", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "highlightField", data: index });
        });
    });

    container.addEventListener("mouseleave", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "removeHighlight", data: index });
        });
    });

    return container;

}

function createMatchedFieldText(field) {

    let text = document.createElement("span");
    text.classList.add("body_text");
    text.innerHTML = field;

    return text;

}

window.addEventListener("DOMContentLoaded", () => {

    let checkbox = document.getElementById("hide_highlighter-elements");
    checkbox.addEventListener("change", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "toggleHighlighters", data: checkbox.checked });
        });
    });

    let searchButton = document.getElementById("search_button");
    searchButton.addEventListener("click", () => {

        let searchValue = document.getElementById("search").value;
        if (searchValue !== "") {

            let previousSearchResults = document.getElementsByClassName("matched_field-item");
            while (previousSearchResults[0]) {
                previousSearchResult[0].remove();
            }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.executeScript(tabs[0].id, { file: "scripts/content_script.js" }, () => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "search", data: searchValue }, (matches) => {

                        matches = matches.data;
                        let searchResultsContainer = document.getElementById("results_container");

                        if (!matches) {
                            let noResultsSpan = document.createElement("span");
                            noResultsSpan.innerHTML = `no results found for field "${searchValue}".`;
                            noResultsSpan.classList.add("body_text");
                            searchResultsContainer.appendChild(noResultsSpan);
                        }

                        for (let i = 0; i < matches; i++) {
                            let matchedFieldItem = createMatchedFieldItem(`${searchValue}[${i+1}]`, i);
                            searchResultsContainer.appendChild(matchedFieldItem);
                        }
                    });
                });
            });
        }
    });
});