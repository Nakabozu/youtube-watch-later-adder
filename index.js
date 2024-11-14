import puppeteer, { Page } from 'puppeteer'

/****
 * THE GOAL
 * Scroll to through the videos until you get to the first one with `#overlays .ytd-thumbnail-overlay-resume-playback-renderer`
 * Click "Watch Later button"
 */

// #region CONSTANTS
export const bT = '\x1b[30m'
export const rT = '\x1b[31m'
export const gT = '\x1b[32m'
export const yT = '\x1b[33m'
export const buT = '\x1b[34m'
export const mT = '\x1b[35m'
export const cT = '\x1b[36m'
export const wT = '\x1b[37m'
export const bB = '\x1b[40m'
export const rB = '\x1b[41m'
export const gB = '\x1b[42m'
export const yB = '\x1b[43m'
export const buB = '\x1b[44m'
export const mB = '\x1b[45m'
export const cB = '\x1b[46m'
export const wB = '\x1b[47m'
export const ansiR = '\x1b[00m'
const url =
    'https://www.youtube.com/@SiIvaGunner/videos?view=0&sort=dd&shelf_id=2'
const progressBarSelector =
    '#overlays #progress.ytd-thumbnail-overlay-resume-playback-renderer'
const unwatchedThumbnailsSelector =
    'div#content:not(:has(#overlays #progress))'
const watchLaterSelector = '#hover-overlays .ytd-thumbnail:last-child span'
const kebabMenuSelector = "ytd-menu-renderer yt-icon-button button"
// This one is so stupid lol.  We get the saveToWatchLater button by getting the element with a specific SVG in it.  Really dumb.
const saveToWatchLaterSelector = `ytd-popup-container ytd-menu-service-item-renderer:has(path[d="M14.97 16.95 10 13.87V7h2v5.76l4.03 2.49-1.06 1.7zM12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9m0-1c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"])`;
// #endregion

//#region HELPER FUNCTIONS

async function autoScroll(page, maxScrolls) {
    await page.evaluate(async (maxScrolls) => {
        await new Promise((resolve) => {
            var totalHeight = 0
            var distance = 2100
            var scrolls = 0 // scrolls counter
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight
                window.scrollBy(0, distance)
                totalHeight += distance
                scrolls++ // increment counter

                // stop scrolling if reached the end or the maximum number of scrolls
                if (
                    totalHeight >= scrollHeight - window.innerHeight ||
                    scrolls >= maxScrolls
                ) {
                    clearInterval(timer)
                    resolve()
                }
            }, 250)
        })
    }, maxScrolls) // pass maxScrolls to the function
}

/**
 * Checks if current puppeteer page has at least a certain number of progress bars for the thumbnails.
 * @param {Page} page A Page object that allows us to interact with content on the website loaded by puppeteer.
 * @param {number} numberOfBars A threshold for the number of progress bars we expect 
 * to see to consider us at the bottom of the content.  
 * Higher means less of a chance that we run into a one-off watched video.
 * I still have no clue where these one-off watches come from, but without a higher threshold,
 * they break the scan for the last video in the watch later playlist.
 * @returns 
 */
const hasProgressBar = async (page, numberOfBars = 1) => {
    // page.evaluate runs a JavaScript function within the page that puppeteer has loaded
    // In this function, we search for an elements with the id of "overlay"
    // Then we check if there's an element with the id of "progress" and the class "ytd-thumbnail-overlay-resume-playback-renderer"
    // If there's at least one element that meets this criteria, it means there's a progress bar on the page somewhere
    return await page.evaluate(() => {
        const foundProgressBar =
            document.querySelectorAll('#overlays #progress').length >= numberOfBars
        console.log(
            foundProgressBar
                ? `Found a progress bar!`
                : `No progress bar... yet.`
        )
        return foundProgressBar
    })
}
//#endregion

//#region PUPPETEER SECTION!

// Start a Puppeteer session with:
// - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
// - no default viewport (`defaultViewport: null` - website page will be in full width and height)
// - executablePath: We define where we want chrome to launch from because if we don't it'll launch in headless mode and that'll prevent us from staying logged in
// - userDataDir: The directory where the Chrome user data is.  This is how we stay logged in as a user.
const browser = await puppeteer.launch({
    executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: null,
    userDataDir: 'C:\\Users\\Naka\\AppData\\Local\\Google\\Chrome\\User Data',
})

// Open a new page
const page = await browser.newPage()

// On this new page:
// - open the YouTube page you want to check
// - wait until the dom content is loaded (HTML is ready)
await page.goto(url, {
    waitUntil: 'domcontentloaded',
})

let tempHasProgressBar = false
while (!tempHasProgressBar) {
    await autoScroll(page, 5000)
    // await page.evaluate(() => {
    //     scrollTo(0, document.body.scrollHeight);
    //     setTimeout(()=>{console.log("WAITING")},1500);
    // })
    await setTimeout(() => {
        console.log(`${mT}Scrolling Down Again${ansiR}`)
    }, 1500)
    tempHasProgressBar = await hasProgressBar(page, 50)
    console.log(
        tempHasProgressBar
            ? `${gT}Found a progress bar!${ansiR}`
            : `${rT}No progress bar... yet.${ansiR}`
    )
}

// OK! We scrolled enough.  Grab all of the thumbnails we need.
const thumbnailList = await page.$$(unwatchedThumbnailsSelector)
thumbnailList.reverse()

console.log(
    `${buB}${wT}${thumbnailList.length}${ansiR}${mT} elements found!${ansiR}`
)

// 
for (let thumbnail of thumbnailList) {
    await thumbnail.hover()
    await pause(50 + Math.floor(Math.random() * 100));
    const kebabMenuForThisThumbnail = await thumbnail.$(kebabMenuSelector)
    await pause(50 + Math.floor(Math.random() * 100));
    await kebabMenuForThisThumbnail.click();
    await pause(50 + Math.floor(Math.random() * 100));
    const saveToWatchLaterButton = page.locator(saveToWatchLaterSelector);
    // wait for 1/4 of a second to 1/2 of a second
    await pause(50 + Math.floor(Math.random() * 100));
    await saveToWatchLaterButton.click();
}
//#endregion

async function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}