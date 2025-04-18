const fs = require("node:fs");
const path = require("node:path");

/**
 * @typedef {Object} WatchedDirectory
 * @property {string} path - The path to the directory to watch
 * @property {string} knowledgeId - The knowledge id to use for the directory
 */

/**
 * @typedef {Object} Config
 * @property {Array<WatchedDirectory>} directories
 */

/**
 * @param {Object} args
 * @param {string} args.owuiURL - The URL of the Open WebUI instance
 * @param {string} args.owuiApiKey - The API key for the Open WebUI instance
 * @param {string} args.knowledgeId - The ID of the knowledge to add the file to
 * @returns {Function} - A function that gets called when a file is added to the directory
 */
const getWatcherFn = () =>
  async (event, filename) => {
    // const { owuiURL, owuiApiKey, knowledgeId } = args;
    console.log(`${event}: ${filename}`);
    // const filePath = path.join(directoryPath, filename);
    // const fileId = await uploadFile({ filePath, openWebUIUrl: owuiPath, openWebUIKey: owuiApiKey });
    // await addFileToKnowledge({ fileId, knowledgeId, openWebUIUrl: owuiPath, openWebUIKey: owuiApiKey }); 
  };

const main = () => {
  const owuiURL = process.env.OPEN_WEBUI_URL;
  const owuiApiKey = process.env.OPEN_WEBUI_API_KEY;
  /** @type {Config} */
  const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
  const { directories } = config;
  // watch directories
  for (const directory of directories) {
    const directoryPath = directory.path.replace("$HOME", process.env.HOME);
    // Schedule a sync of the directory because things might have changed while we were not watching
    // Start watching directory 
    fs.watch(
      path.resolve(directoryPath),
      getWatcherFn({
        owuiURL,
        owuiApiKey,
        knowledgeId: directory.knowledgeId,
      }),
    );
  }
};

main();
