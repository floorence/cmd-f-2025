
const cssclasses = "span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3";
const backendserver = "";
const processedTweets = new Set(); //set of strings representing tweet objects

// Tweet is {string username; string text;}

// Element[] -> string[]
function extractTweets(elements) {
    const textelements = Array.from(elements).map(span => span.textContent);
    //console.log(textelements);
    const tweets = extractTweetsForReal(textelements);
    return tweets;
}

// string[] -> Tweet[]
function extractTweetsForReal(textelements) {
    const tweets = []; // Tweet[]
    for (let i = 1; i < textelements.length; i++) {
        if (textelements[i].length > 0 && textelements[i].charAt(0) === "@") { // find username
            if (i + 1 < textelements.length && textelements[i+1] === "·") { //double check it's a tweet
                if (i + 2 < textelements.length) { //double check again 💀😭
                    const username = textelements[i].substring(1);
                    let tweet = "";
                    let j = i + 2;
                    while (true) { // manage tweet getting split up bc of emojis
                        const partoftweet = textelements[j];
                        if (!isNaN(Number(getNumPart(partoftweet)))) {
                            break;
                        }
                        tweet += partoftweet;
                        j++;
                    }
                    const tweetObj = {username: username, text: tweet};
                    tweets.push(tweetObj);
                }
            }
        }
    }
    return tweets;
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
                const tweets = extractTweets(elements);
                if (tweets.length > 0) { 
                    console.log("Extracted tweets:", tweets);
                    tweets.forEach(processTweet);
                    sendTweets(JSON.stringify(tweets));
                }
            }
        }
    }
});

// Tweet -> void
function processTweet(tweet) {
    const tweetKey = JSON.stringify(tweet); // Convert object to a unique string

    if (processedTweets.has(tweetKey)) return; // Skip already processed tweets

    tweetMisinfo(tweet.text).then((isMisinformation) => {
        if (isMisinformation) {
            console.log("adding warning...");
            addWarningUI(tweet);
        }
    });

    processedTweets.add(tweetKey); // Store as a unique string
}

// string -> void
function addWarningUI(tweet) {
    const warning = document.createElement('div');
    warning.textContent = "⚠️ Misinformation detected!";
    warning.style.color = "red";
    warning.style.fontWeight = "bold";
    tweet.appendChild(warning); // Adjust positioning as needed
}


// Start observing the page (watch for added/removed nodes)
observer.observe(document.body, { childList: true, subtree: true });

// Run initially in case tweets are already there
// main
//extractTweets();
