
const cssclasses = "span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3";
const usernamecssclasses = "div.css-175oi2r.r-1awozwy.r-18u37iz.r-1wbh5a2";
const backendserver = "https://a99c-142-103-203-209.ngrok-free.app/predict";
const questionmarkicon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2"/>
    <text x="12" y="18" text-anchor="middle" font-size="14" font-family="Arial" fill="black">?</text>
    </svg>`;
let numMisinfos = 0;
let numPosts = 0;
let lastUrl = location.href;

// Load processed tweets from localStorage (if any)
const processedTweets = new Map();

// Tweet is {string username; string text;}

// NodeList<Element> -> string[]
function extractTweets(elements) {
    //const textelements = Array.from(elements).map(span => span.textContent);
    //console.log(textelements);
    const tweetElements = extractTweetElementsAndTweets(Array.from(elements));
    return tweetElements.tweets.map(tweet => tweet.text);
}

// Element[] -> {element: Element, tweet: Tweet}[]
// pair elements with corresponding tweet, element is username element
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
                    const lastElementIdx = (j > i + 2) ? j-1 : j;
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

// string -> 0 | 1
async function tweetMisinfo(tweet) {
    
    const response = await fetch(backendserver, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({text: tweet}),
    }).catch(error => console.error("Request failed:", error));

    const data = await response.json();
    let prediction = data.prediction;  // Extract the "prediction" value
    console.log("Prediction:", prediction);  // Log 0 or 1
    return prediction;
    
   return 0;
}


// Observer to detect DOM changes (new tweets loading)
const observer = new MutationObserver((mutations) => {
    if (location.href !== lastUrl) {
        lastUrl = location.href; // Update last known URL
        processedTweets.clear();

        if (isProfilePage()) {
            console.log("profile page");
            numMisinfos = 0;
            numPosts = 0;
            setTimeout(() => {
                console.log("about to check profile");
                checkProfile(); // Run function after 1 second
            }, 2000);
        }
    }
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Ensure it's an element
                const elements = node.querySelectorAll(cssclasses)
                const elementTweets = extractTweetElementsAndTweets(Array.from(elements));
                
                if (elementTweets.length > 0) { 
                    //console.log("Extracted tweets:", elementTweets);
                    elementTweets.forEach(processTweet);

                }
            }
        }
    }
    
});

// {element: Element, tweet: Tweet} -> void
async function processTweet(elementTweet) {
    const tweetKey = JSON.stringify(elementTweet.tweet); // Unique tweet key

    if (processedTweets.has(tweetKey)) {
        const existingStatus = processedTweets.get(tweetKey);
        
        // If it's still pending (undefined), wait for it to resolve
        if (existingStatus === undefined) return; 

        // If the tweet was found to be misinformation, ensure UI is added
        if (existingStatus === 0) {
            addWarningUI(elementTweet.element);
        }
        //if (existingStatus) addWarningUI(elementTweet.element);
        return;
    }

    // **Mark as pending immediately** to prevent duplicate calls
    processedTweets.set(tweetKey, undefined);

    // **Call async misinfo check**
    const isMisinfo = await tweetMisinfo(elementTweet.tweet.text);
    // **Now store the final result**
    processedTweets.set(tweetKey, isMisinfo);
    //saveProcessedTweets(); 

    numPosts++;
    if (isMisinfo === 0) {
        numMisinfos++;
        addWarningUI(elementTweet.element);
    }
}

// Element -> void
function addWarningUI(tweetElement) {
    const tweetContainer = tweetElement.closest("article");

    if (!tweetContainer) {
        console.warn("❌ Could not find tweet container for:", tweetElement);
        return;
    } 

    const warning = document.createElement("div");
    warning.textContent = "⚠️ Misinformation detected!";
    warning.classList.add("misinfo-warning");
    Object.assign(warning.style, {
        display: "inline-block",  // Makes it stay on the same line
        color: "red",
        fontWeight: "bold",
        fontSize: "14px",
        fontFamily: "'Tahoma', sans-serif",
        marginTop: "5px",
        display: "block",
        position: "relative",
        zIndex: "999",
    });

    const infoIcon = document.createElement("span");
    Object.assign(infoIcon.style, {
        display: "inline-block",  
        verticalAlign: "middle",  
        marginLeft: "5px",  
        marginTop: "10px",
        cursor: "pointer",  
        fontWeight: "bold",
    });
    infoIcon.innerHTML = questionmarkicon;
    infoIcon.title = "This post has been flagged for containing misinformation based on our current training data. Please note that HealthShield can make mistakes; consult a doctor for professional advice.";

    const container = document.createElement("span"); // Wrapper to keep them in one line
    container.style.display = "inline-flex"; // Ensures they stay on the same line
    container.style.alignItems = "center"; // Aligns them nicely

    container.appendChild(warning);
    container.appendChild(infoIcon);


    // **Find where to place the warning**
    let textContainer = tweetContainer.querySelector('[lang]'); // Finds main text block
    if (textContainer) {
        // **Delay to ensure tweet is fully loaded**
        setTimeout(() => {
            // **Final duplicate check before adding UI**
            if (tweetContainer.querySelector(".misinfo-warning")) {
                console.log("⚠️ Warning already exists, skipping...");
                return;
            }

            textContainer.parentNode.appendChild(container);
            //console.log("✅ Successfully added warning:", tweetContainer);
        }, 500);
    } else {
        setTimeout(() => {
            tweetContainer.appendChild(warning);
            //console.log("✅ Successfully added warning:", tweetContainer);
        }, 500);
    }
}

function addUserWarningUI(userElement) {

    const warning = document.createElement("div");
    warning.textContent = "⚠️ Untrustworthy user!";
    warning.classList.add("user-misinfo-warning");
    Object.assign(warning.style, {
        color: "orange",
        fontWeight: "bold",
        fontSize: "14px",
        fontFamily: "'Tahoma', sans-serif",
        marginLeft: "5px",
        display: "block",
        position: "relative",
        zIndex: "999",
    });

    const infoIcon = document.createElement("span");
    Object.assign(infoIcon.style, {
        display: "inline-block",  
        verticalAlign: "middle",  
        marginLeft: "5px",  
        marginTop: "5px",
        cursor: "pointer",  
        fontWeight: "bold",
    });
    infoIcon.innerHTML = questionmarkicon;
    infoIcon.title = "This user has been flagged to frequently spread misinformation according to their recent posts.";

    const container = document.createElement("span"); // Wrapper to keep them in one line
    container.style.display = "inline-flex"; // Ensures they stay on the same line
    container.style.alignItems = "center"; // Aligns them nicely

    container.appendChild(warning);
    container.appendChild(infoIcon);

    // **Find where to place the warning**

    // **Delay to ensure tweet is fully loaded**
    setTimeout(() => {
        // **Final duplicate check before adding UI**
        if (userElement.querySelector(".user-misinfo-warning")) {
            console.log("⚠️ Warning already exists, skipping...");
            return;
        }

       userElement.appendChild(container);
        //console.log("✅ Successfully added warning:", tweetContainer);
    }, 500);
}

// void -> boolean
function isProfilePage() {
    const pathname = window.location.pathname;

    // Exclude paths that are not profiles
    const nonProfilePaths = ["/home", "/search", "/explore", "/notifications", "/messages", "/settings", "/i/"];
    
    // If there's a slash ("/") in the middle, it's probably not a profile (e.g., /username/status/12345)
    if (pathname.split('/').length > 2) return false;

    // If it's in the list of non-profile paths, it's not a profile page
    if (nonProfilePaths.some(path => pathname.startsWith(path))) return false;

    return true;
}

// void -> void
function checkProfile() {
    console.log("checking profile");
    console.log("numMisinfos:", numMisinfos);
    console.log("numPosts:", numPosts);
    if (numMisinfos / numPosts > 0.50) {
        const elements = document.querySelectorAll(usernamecssclasses);
        console.log(Array.from(elements).map(element => element.textContent));
        const userElement = getUsernameElement(Array.from(elements));
        addUserWarningUI(userElement);
    }
}

// Element[] -> Element
function getUsernameElement(elements) {
    for (let i = 1; i < elements.length; i++) {
        const textelement = elements[i].textContent;
        if (textelement.length > 0 && textelement.charAt(0) === "@") { // find username
            return elements[i];
        }
    }
    return null;
}

// Start observing the page (watch for added/removed nodes)
observer.observe(document.body, { childList: true, subtree: true });

if (isProfilePage()) {
    console.log("profile page");
    numMisinfos = 0;
    numPosts = 0;
    setTimeout(() => {
        console.log("about to check profile");
        checkProfile(); 
    }, 4000);
}

// Run initially in case tweets are already there
// main
//extractTweets();
