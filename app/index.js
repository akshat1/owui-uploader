const fs = require("node:fs");
const path = require("node:path");
const { getWatcherFn } = require("./watcher");
const { syncDirectory } = require("./sync-directory");

/**
 * @typedef {Object} WatchedDirectory
 * @property {string} path - The path to the directory to watch
 * @property {string[]} acceptableExtensions - A list of acceptable file extensions
 * @property {string} knowledgeId - The knowledge id to use for the directory
 */

/**
 * @typedef {Object} Config
 * @property {Array<WatchedDirectory>} directories
 */

const main = () => {
  const openWebUIUrl = process.env.OPEN_WEBUI_URL;
  const openWebUIKey = process.env.OPEN_WEBUI_API_KEY;
  console.log(`[main] Starting OWUI Uploader to ${openWebUIUrl} with API key ${openWebUIKey.replace(/./g, "*")}`);
  /** @type {Config} */
  const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, ".owui-uploader", "config.json"), "utf8"));
  const { directories } = config;
  console.log(`[main] Watching ${directories.length} directories`);
  // watch directories
  for (const directory of directories) {
    console.log(`[main] Watching ${directory.path}`);
    const directoryPath = directory.path.replace("$HOME", process.env.HOME);
    syncDirectory({
      directoryPath,
      openWebUIUrl,
      openWebUIKey,
      knowledgeId         : directory.knowledgeId,
      acceptableExtensions: directory.acceptableExtensions,
    });
    // Schedule a sync of the directory because things might have changed while we were not watching
    // Start watching directory 
    fs.watch(
      path.resolve(directoryPath),
      getWatcherFn({
        openWebUIUrl,
        openWebUIKey,
        directoryPath,
        knowledgeId         : directory.knowledgeId,
        acceptableExtensions: directory.acceptableExtensions,
      }),
    );
  }
};

main();
