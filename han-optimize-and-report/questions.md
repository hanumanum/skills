# Questions

Walk these in order. Each one is a search, then at most one code change. Skip a question when the search finds nothing that matches, and write the reason in `tests/load-tests/progress.md`. The code examples are shapes. Use the types and libraries this repository already has.

The ten checks at the end run after every measurement. They are not extra code changes.

## 01. Are we downloading the original picture?

Search image tags and helpers that build file URLs with no width, quality, or format. A photo drawn small and weighing megabytes is the bug.

What is going wrong: the browser downloads the file the editor uploaded. Under load those files fill the connection, and later page loads are skipped because every fake user is still fetching pictures.

Change: request the format and width the layout uses. A responsive set of widths belongs in this change when the markup already has a place for it.

## 02. Are we building the same heavy data on every request?

Search work inside a render that does not depend on this visitor: a search index, a sort of a large list, a deep copy of a cached payload, or several API calls whose answers are the same for everyone.

What is going wrong: a short cache still misses when many people arrive together. Each render calls the API and builds the same structure.

Change: keep that shared data for longer than the page cache, and make concurrent renders share one in-flight fetch.

## 03. What is hidden inside the HTML?

Search the rendered document for lists the user has not asked for: a search index, a full article body inside a card, every column of a record when the widget shows a title and a picture.

What is going wrong: server rendering serializes the data the page fetched. Unused data rides inside every document.

Change: load that data at the moment it is needed, and ask the API only for the fields the widget shows.

## 04. Is the cache actually on in the server that is running?

Search route cache rules and any condition that reads an environment variable when the image is built. Then check the live response headers on the deployed URL.

What is going wrong: a comment that says "cached" is a wish until the response says so. A string where the server expects a number leaves the cache off. Some responses must stay fresh: a form, a notification, a just-published item. Leave those uncached on purpose.

Change: make the running server emit the cache header the rule describes. Confirm the header on the real URL after the deploy.

## 05. When the cache is empty, do all the visitors fetch at once?

Search a cache read followed by a fetch, with no lock and no shared promise.

What is going wrong: everyone misses together. The cache is correct and still useless for that second.

Change: one key shares one fetch. Give the paths that were still fetching on every render the same short window, except the paths that must stay fresh.

## 06. Is the slow function even on the path this test hits?

Ask this when a number does not move.

Search the trace of a slow sample, or the code path of the page that was measured. If the function you would change never runs for that page, the table cannot show the change.

What is going wrong: the measured page is served from a cache, or it never calls that function. A flat row is the expected result. Test the page that actually calls it, or record why the homepage row cannot prove this change.

Change: only when the measured pages do hit the slow function. Otherwise skip, and name the page that would prove it.

## 07. Does every visitor download code that only an editor uses?

Search the client entry, plugins that run on every page, and imports of editor, animation, or search libraries. If a normal visitor downloads the package, it is on the public path.

What is going wrong: a top-level import ships to everyone, even when the function runs only after a click or only in a preview mode.

Change: import that library at the moment it is used, and only on the path that needs it. Dev-only tools stay out of the production build.

## 08. Does one import pull in every block on the page?

Search a container that statically imports every possible block. The page renders a few of them. The visitor downloads all of them.

What is going wrong: a static import means the file is needed now.

Change: load a block when that block is actually on the page.

## 09. Does every page call an API that only one page needs?

Search plugins and layout code that run on every navigation. List the URLs. Open a page that cannot show that data and see if the URL is still called.

What is going wrong: shared chrome becomes a tax. A call that exists for one screen runs on every screen.

Change: the screen that shows the data loads it. A homepage or layout stops calling it. Check the screen that still needs the data, not only the homepage.

## 10. Are we loading a language the site does not offer?

Search locale registration, date libraries, translation files, and the language switcher. Compare that list with the languages the site actually serves.

What is going wrong: extra locales cost bytes on every page, and they imply a language the site does not speak.

Change: remove the locale the site does not offer. Check that a date in a language the site does speak still renders.

## After the numbers

Do these in this order when a tracing or log tool was saved. The window is `startedAt` minus 60 seconds through `finishedAt` plus 60 seconds. Never print the API key.

1. Errors and warnings in that window, before any theory.
2. Up to five of the slowest document samples. Search by the request id (`x-request-id` on the sample, when the server sends one).
3. Open the trace for that id. Read the service, the span name, the duration, the URL, and the status.
4. If the id has no trace, say so. Fall back to a trace id printed in the log. An empty log is an empty log.
5. Also read the slowest server spans for that host. A slow asset often has no document request id.
6. Write one cause, the evidence, and stop. The next question gets its own run.

How to read a trace:

- The parent span is long and the longest child is short: time was spent in this process.
- The parent span and one downstream call are almost the same length: this process waited on that call.
- The browser waited for the first byte and the server log says the page finished in a few milliseconds: the wait is in front of this process. A component change will not move that number.
- A cache hit is a short span with no child calls. Stop optimizing those milliseconds.

When no tracing tool was saved, write the load-test numbers and set the cause to unknown.

## Checks on every kept change

These do not open a new branch. Write the answer in the row note when one of them fails, and stop if the user needs to decide.

1. Did the page still look right? A faster page that drops a control is a bug. Logs do not render the page. Open the measured URLs when a browser is available.
2. Which saved pages were not measured? A homepage row can hide a slower inner page. Every URL in `.han-optimize.json` gets a row.
3. Was this run a cold process, a deploy still rolling, or the code? HTML size answers part of it. The second run answers the rest.
4. Whose wait is this? This process, an API, object storage, or the gateway. The span tree answers it when the children are open.
5. What does a second click do in a real browser? This test turns the cache off on purpose. Say so when the row is easy to misread.
6. Is a cached page allowed to be as old as the cache window? A form, a notification, and a just-published item are different from a header.
7. Did this row mix two ideas? One idea, one merge, one row.
8. Can this commit be reverted on its own tomorrow?
9. Is the server span already a few milliseconds while the user still waits seconds? Stop editing the component. The next question has to be about the path in front of this process.
10. How many round trips happen before the first byte on a cold process? A warm trace hides them because the cache skips the calls.
