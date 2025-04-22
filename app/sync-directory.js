const { promises: fs } = require("fs");
const path = require("path");
// We need to require dependencies as an object so that the stubs work.
const api = require("./api");
const db = require("./db");

/**
 * Delay for a given number of milliseconds.
 * 
 * Until we implement a proper queue and rate limiting system, we need to delay the sync of files.
 * 
 * @param {number} ms 
 * @returns 
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sync a given file to a given knowledge base in Open WebUI.
 * 
 * @param {Object} args
 * @param {string} args.filePath
 * @param {string} args.knowledgeId
 * @param {string} args.openWebUIUrl
 * @param {string} args.openWebUIKey
 * @param {string[]} args.acceptableExtensions
 * @param {import("fs").Stats} args.fileStat
 * @returns {Promise<void>}
 */
const syncFile = async (args) => {
  console.log(`[syncFile] Syncing file ${args.filePath}`);
  // Compare fileState.mtime with the lastModified field in the database.
  // If the file does not appear in the database, or if the file has been modified, upload the file to Open WebUI.
  // If the file has not been modified, do nothing.
  const {
    filePath,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey,
    fileStat,
    acceptableExtensions,
  } = args;
  
  const fileExtension = path.extname(filePath).slice(1);
  /* c8 ignore next 4 */
  if (acceptableExtensions.indexOf(fileExtension) === -1) {
    console.log(`[syncFile] File ${filePath} has an unacceptable extension ${fileExtension}`);
    return;
  }
  const lastModified = fileStat.mtime;
  const fileRecord = await db.getFile(filePath, knowledgeId);
  if (!fileRecord || fileRecord.lastModified !== lastModified) {
    console.log(`[syncFile] File ${filePath} has been modified`);
    const {
      uploadFile, addFileToKnowledge, 
    } = api;
    const { recordFile } = db;
    try {
      const { id: fileId } = await uploadFile({
        filePath,
        openWebUIUrl,
        openWebUIKey, 
      });
      console.log(`[syncFile] File ${filePath} uploaded to Open WebUI with id ${fileId}\n`);

      await addFileToKnowledge({
        fileId,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey, 
      });

      await recordFile({
        fileId,
        lastModified,
        filePath,
        knowledgeId, 
      });
      /* c8 ignore next 3 */
    } catch (error) {
      console.error(`[syncFile] Failed to sync file ${filePath}: ${error}\n\n`);
    }
  } else {
    console.log(`[syncFile] File ${filePath} has not been modified`);
  }

  console.log("[syncFile] Delaying for 1 second");
  await delay(1000);
};

/**
 * Sync a given directory to a given knowledge base in Open WebUI.
 * 
 * @param {Object} args
 * @param {string} args.directoryPath
 * @param {string} args.knowledgeId
 * @param {string} args.openWebUIUrl
 * @param {string} args.openWebUIKey
 * @param {string[]} args.acceptableExtensions
 * @returns {Promise<void>}
 */
const syncDirectory = async (args) => {
  console.log(`[syncDirectory] Syncing directory ${args.directoryPath}`);
  const {
    directoryPath,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey,
    acceptableExtensions,
  } = args;
  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    console.log(`[syncDirectory] Syncing ${file} from ${directoryPath}`);
    const filePath = path.join(directoryPath, file);
    const fileStat = await fs.stat(filePath);
    console.log(`[syncDirectory] File stat: ${JSON.stringify(fileStat)}`);
    if (fileStat.isDirectory()) {
      console.log(`[syncDirectory] ${filePath} is a directory, syncing it.`);
      // TODO: Create a queue system for this.
      await syncDirectory({
        directoryPath: filePath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey, 
        acceptableExtensions,
      });
    } else {
      console.log(`[syncDirectory] ${filePath} is a file, syncing it.`);
      await syncFile({
        filePath,
        fileStat,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey, 
        acceptableExtensions,
      });
    }
  }
};


module.exports = {
  syncDirectory, syncFile, 
};
