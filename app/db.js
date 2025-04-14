/**
 * This module provides functions for our main logic to record and retrieve file metadata from a SQLite database.
 * The database is stored in the user's home directory as `.owui-sync.db`.
 * We need to store the following metadata for each file:
 * - filePath (part of PRIMARY KEY)
 * - knowledgeId (part of PRIMARY KEY)
 * - fileId
 * - lastModified
 */

const sqlite3 = require("sqlite3");
const path = require("node:path");


let db = null;

/**
 * Initialize the database.
 * 
 * If the database already exists, it will not be initialized again.
 * 
 * @returns {Promise<void>}
 */
const initializeDB = async () => {
  if (db)
    return;
  db = new sqlite3.Database(path.join(process.env.HOME, ".owui-sync.db"));
  db.exec(` 
    CREATE TABLE IF NOT EXISTS files (
      filePath TEXT,
      knowledgeId TEXT,
      fileId TEXT,
      lastModified TEXT,
      PRIMARY KEY (filePath, knowledgeId)
    )
  `);
};

/**
 * Make a record of a file uploaded to Open WebUI. Next time we sync, we'll
 * check if the file has been modified. If so, we'll use the fileId to update
 * the file.
 * 
 * @param {Object} args
 * @param {string} args.fileId
 * @param {string} args.lastModified
 * @param {string} args.filePath
 * @param {string} args.knowledgeId
 */
const recordFile = async (args) => {
  const {
    fileId,
    lastModified,
    filePath,
    knowledgeId,
  } = args;
  await initializeDB();
  db.exec("INSERT OR REPLACE INTO files (filePath, knowledgeId, fileId, lastModified) VALUES (?, ?, ?, ?);", [filePath, knowledgeId, fileId, lastModified]);
};

/**
 * @param {string} filePath
 * @param {string} knowledgeId
 * @returns {import("sqlite3").Row}
 */
const getFile = async (filePath, knowledgeId) => {
  await initializeDB();
  const result = await db.get("SELECT * FROM files WHERE filePath = ? AND knowledgeId = ?;", [filePath, knowledgeId]);
  return result;
};

/**
 * @param {string} knowledgeId
 * @returns {import("sqlite3").Row[]}
 */
const getFiles = async (knowledgeId) => {
  await initializeDB();
  const result = await db.all("SELECT * FROM files WHERE knowledgeId = ?;", [knowledgeId]);
  return result;
};

/**
 * @param {string} filePath
 * @param {string} knowledgeId
 */
const deleteFile = async (filePath, knowledgeId) => {
  await initializeDB();
  db.exec("DELETE FROM files WHERE filePath = ? AND knowledgeId = ?;", [filePath, knowledgeId]);
};

module.exports = {
  recordFile,
  getFile,
  getFiles,
  deleteFile,
};
