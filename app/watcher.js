const path = require("node:path");
const syncModule = require("./sync-directory");
const fs = require("node:fs").promises;

/**
 * @param {Object} args
 * @param {string} args.openWebUIUrl - The URL of the Open WebUI instance
 * @param {string} args.openWebUIKey - The API key for the Open WebUI instance
 * @param {string} args.knowledgeId - The ID of the knowledge to add the file to
 * @param {string} args.directoryPath - The path to the directory to watch
 * @param {string[]} args.acceptableExtensions - A list of acceptable file extensions
 * @returns {Function} - A function that gets called when a file is added to the directory
 */
const getWatcherFn = (args) =>
  async (event, filename) => {
    const {
      openWebUIUrl,
      openWebUIKey,
      knowledgeId,
      directoryPath,
      acceptableExtensions,
    } = args;

    console.log(`[watcher] ${event}: ${filename}`);
    const filePath = path.join(directoryPath, filename);
    const fileStat = await fs.stat(filePath);
    await syncModule.syncFile({
      filePath,
      fileStat,
      knowledgeId,
      openWebUIUrl,
      openWebUIKey, 
      acceptableExtensions,
    }); 
  };

module.exports = { getWatcherFn };
