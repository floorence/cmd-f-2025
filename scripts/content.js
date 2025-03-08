

const cssclasses = "span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3";
const backendserver = "";

// void -> string[]
function extractTweets() {
    const textelements = Array.from(document.querySelectorAll(cssclasses))
        .map(span => span.textContent);
    //console.log(textelements);
    const tweets = extractTweetsForReal(textelements);
    return tweets;
}



// string[] -> {string username; string tweet;}[]
function extractTweetsForReal(textelements) {
    const tweets = []; // {string username; string tweet;}[]
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
                    tweets.push({username: username, tweet: tweet});
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

// Observer to detect DOM changes (new tweets loading)
const observer = new MutationObserver(() => {
    const tweets = extractTweets();
    console.log("Extracted tweets:", tweets);
    sendTweets(JSON.stringify(tweets));

});

// Start observing the page (watch for added/removed nodes)
observer.observe(document.body, { childList: true, subtree: true });

// Run initially in case tweets are already there
// main
extractTweets();
