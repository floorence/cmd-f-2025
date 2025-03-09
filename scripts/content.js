
const cssclasses = "span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3";
const backendserver = "";
const processedTweets = new Set(); //set of strings representing tweet objects

// Tweet is {string username; string text;}

// NodeList<Element> -> string[]
function extractTweets(elements) {
    //const textelements = Array.from(elements).map(span => span.textContent);
    //console.log(textelements);
    const tweetElements = extractTweetElementsAndTweets(Array.from(elements));
    return tweetElements.tweets.map(tweet => tweet.text);
}

// Element[] -> {element: Element, tweet: Tweet}[]
// pair elements with corresponding tweet
function extractTweetElementsAndTweets(elements) {
    const elementTweets = []; // {element: Element, tweet: Tweet}[]
    for (let i = 1; i < elements.length; i++) {
        const textelement = elements[i].textContent;
        if (textelement.length > 0 && textelement.charAt(0) === "@") { // find username
            if (i + 1 < elements.length && elements[i+1].textContent === "·") { //double check it's a tweet
                if (i + 2 < elements.length) { //double check again 💀😭
                    const username = textelement.substring(1);
                    let tweet = "";
                    let j = i + 2;
                    while (true) { // manage tweet getting split up bc of emojis
                        const partoftweet = elements[j].textContent;
                        if (!isNaN(Number(getNumPart(partoftweet)))) {
                            break;
                        }
                        tweet += partoftweet;
                        j++;
                    }
                    const tweetObj = {username: username, text: tweet};
                    const elementTweet = {element: elements[i], tweet: tweetObj};
                    elementTweets.push(elementTweet);
                    i = j; // skip elements we already checked
                }
            }
        }
    }
    return elementTweets;
}

// string -> string
function getNumPart(str) {
    if (str.length > 1) {
        return str.substring(0, str.length - 1);
    } else {
        return str;
    }
}

// string -> void
function sendTweets(tweets) {
    fetch(backendserver, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: tweets,
      }).catch(error => console.error("Request failed:", error));
}

// string -> boolean
async function tweetMisinfo(tweet) {
    /*
    const response = await fetch(backendserver, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: tweet,
    }).catch(error => console.error("Request failed:", error));

    return response;
    */
   return true;

}

// Observer to detect DOM changes (new tweets loading)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Ensure it's an element
                const elements = node.querySelectorAll(cssclasses)
                const elementTweets = extractTweetElementsAndTweets(Array.from(elements));
                
                if (elementTweets.length > 0) { 
                    console.log("Extracted tweets:", elementTweets);
                    elementTweets.forEach(processTweet);
                    sendTweets(JSON.stringify(elementTweets.map(elementTweet => elementTweet.tweet)));
                }
            }
        }
    }
});

// {element: Element, tweet: Tweet} -> void
function processTweet(elementTweet) {
    const tweetKey = JSON.stringify(elementTweet.tweet); // Convert object to a unique string

    if (processedTweets.has(tweetKey)) return; // Skip already processed tweets

    tweetMisinfo(elementTweet.tweet.text).then((isMisinformation) => {
        if (isMisinformation) {
            console.log("adding warning...");
            addWarningUI(elementTweet.element);
        }
    });

    processedTweets.add(tweetKey); // Store as a unique string
}

// string -> void
function addWarningUI(element) {
    const warning = document.createElement('div');
    warning.textContent = "⚠️ Misinformation detected!";
    warning.style.color = "red";
    warning.style.fontWeight = "bold";
    element.appendChild(warning); // Adjust positioning as needed
}


// Start observing the page (watch for added/removed nodes)
observer.observe(document.body, { childList: true, subtree: true });

// Run initially in case tweets are already there
// main
//extractTweets();
