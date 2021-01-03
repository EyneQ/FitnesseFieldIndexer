
function getAbsoluteFieldLayoutXPath() {

    return "//*[(self::label or self::span) and contains(@class, 'FieldLayout---field_label') and starts-with(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),{0})]/parent::div/parent::div";

}

function formatString(template, args) {

    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] != "undefined") {
            let templateRegexExp = new RegExp(`\\{${i}\\}`, "g");
            template = template.replace(templateRegexExp, args[i]);
        }
    }

    return template;

}

function formatXPath(xpath, args) {

    for (let i = 0; i < args.length; i++) {
        args[i] = escapeXPathVariables(args[i]);
    }

    return formatString(xpath, args);

}

function escapeXPathVariables(variable) {

    variable = variable.toLowerCase();
    if (variable.includes("'") || variable.includes("\"")) {
        return `'${variable.replace("'", "', \"'\", '")}'`;
    }
    return `'${variable}'`;

}

function getFieldsByXPath(xpath, parentNode) {

    let results = [];
    let query = document.evaluate(xpath, parentNode || document, 
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < query.snapshotLength; i++) {
        results.push(query.snapshotItem(i));
    }
    return results;

}

function createElementHighlighter(x, y, w, h) {

    let padding = 5;
    let highlighter = document.createElement("div");

    highlighter.classList.add("element_indexer-highlighter_element");
    highlighter.style.left = `${x - padding}px`;
    highlighter.style.top = `${y}px`;
    highlighter.style.width = `${w + (padding * 2)}px`;
    highlighter.style.height = `${h}px`;

    return highlighter;

}

function generateElementHighlighters(nodes) {

    let highlighters = [];
    for (let i = 0; i < nodes.length; i++) {
        let nodeDimensions = nodes[i].getBoundingClientRect();
        highlighters.push(createElementHighlighter(nodeDimensions.x, nodeDimensions.y, 
            nodeDimensions.width, nodeDimensions.height));
    }

    return highlighters;

}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    let currentHighlighterElements = document.getElementsByClassName("element_indexer-highlighter_element");
    let hiddenHighlighterElements = document.getElementsByClassName("element_indexer-highligher_element-hidden");
    switch (request.type) {

        case "search":
            while (currentHighlighterElements[0]) {
                currentHighlighterElements[0].remove();
            }

            let fieldXPath = formatXPath(getAbsoluteFieldLayoutXPath(), request.data);
            let fields = getFieldsByXPath(fieldXPath);
            let highlighterElements = generateElementHighlighters(fields);
            let size = highlighterElements.length;
            for (let i = 0; i < size; i++) {
                document.body.appendChild(highlighterElements[i]);
            }

            sendResponse({ data: size });
            break;

        case "highlightField":

            let selectedHighlighterElement = currentHighlighterElements[request.data];
            selectedHighlighterElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            selectedHighlighterElement.style.background = "green";
            sendResponse({});

            break;

        case "removeHighlight":

            currentHighlighterElements[request.data].style.background = "red";
            sendResponse({});

            break;

        case "toggleHighlighters":

            if (request.data) {
                while (currentHighlighterElements[0]) {
                    currentHighlighterElements[0].classList.remove("element_indexer-highlighter_element");
                    currentHighlighterElements[0].classList.add("element_indexer-highligher_element-hidden");
                }
            } else {
                while (hiddenHighlighterElements[0]) {
                    hiddenHighlighterElements[0].classList.remove("element_indexer-highligher_element-hidden");
                    hiddenHighlighterElements[0].classList.add("element_indexer-highlighter_element");
                }
            }
            sendResponse({});

            break;

        default:

            console.log(`no applicable action found for request ${request.type}`);
            sendResponse({ data: "error no action found for this type of request" });
            break;

    }
});