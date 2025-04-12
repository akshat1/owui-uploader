const { promises: fs } = require("fs");
const path = require("path");
// We need to require dependencies as an object so that the stubs work.
const api = require("./api");
const db = require("./db");




/**
 * Sync a given file to a given knowledge base in Open WebUI.
 * 
 * @param {Object} args
 * @param {string} args.filePath
 * @param {string} args.knowledgeId
 * @param {string} args.openWebUIUrl
 * @param {string} args.openWebUIKey
 * @param {import("fs").Stats} args.fileStat
 * @returns {Promise<void>}
 */
const syncFile = async (args) => {
  // Compare fileState.mtime with the lastModified field in the database.
  // If the file does not appear in the database, or if the file has been modified, upload the file to Open WebUI.
  // If the file has not been modified, do nothing.
  const {
    filePath,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey,
    fileStat,
  } = args;
  const lastModified = fileStat.mtime;
  const fileRecord = await db.getFile(filePath, knowledgeId);
  if (!fileRecord || fileRecord.lastModified !== lastModified) {
    const { uploadFile, addFileToKnowledge } = api;
    const { recordFile } = db;
    const fileId = await uploadFile({
      filePath,
      openWebUIUrl,
      openWebUIKey, 
    });
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
  }
};

/**
 * Sync a given directory to a given knowledge base in Open WebUI.
 * 
 * @param {Object} args
 * @param {string} args.directoryPath
 * @param {string} args.knowledgeId
 * @param {string} args.openWebUIUrl
 * @param {string} args.openWebUIKey
 * @returns {Promise<void>}
 */
const syncDirectory = async (args) => {
  const {
    directoryPath,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey,
  } = args;
  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileStat = await fs.stat(filePath);
    if (fileStat.isDirectory()) {
      // TODO: Create a queue system for this.
      await syncDirectory({
        directoryPath: filePath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey, 
      });
    } else {
      await syncFile({
        filePath,
        fileStat,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey, 
      });
    }
  }
};


module.exports = {
  syncDirectory,
  syncFile,
};
