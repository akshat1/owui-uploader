/**
 * This module provides functions for our main logic to record and retrieve file metadata from a SQLite database.
 * The database is stored in the user's home directory as `.owui-sync.db`.
 * We need to store the following metadata for each file:
 * - fileId
 * - lastModified
 * - path
 * - knowledgeId
 */

import sqlite3 from "node:sqlite3";
import path from "node:path";


let db = null;

export const initializeDB = async () => {
  if (db)
    return;
  db = new sqlite3.Database(path.join(process.env.HOME, ".owui-sync.db"));
  db.exec(` 
    CREATE TABLE IF NOT EXISTS files (
      fileId TEXT PRIMARY KEY,
      lastModified TEXT,
      path TEXT,
      knowledgeId TEXT
    )
  `);
};

export const recordFile = async (fileId, lastModified, path, knowledgeId) => {
  await initializeDB();
  db.exec(`
    INSERT INTO files (fileId, lastModified, path, knowledgeId) VALUES (?, ?, ?, ?);
  `, [fileId, lastModified, path, knowledgeId]);
};

export const getFile = async (fileId) => {
  await initializeDB();
  const result = await db.get(`
    SELECT * FROM files WHERE fileId = ?;
  `, [fileId]);
  return result;
};

export const getFiles = async (knowledgeId) => {
  await initializeDB();
  const result = await db.all(`
    SELECT * FROM files WHERE knowledgeId = ?;
  `, [knowledgeId]);
  return result;
};

export const deleteFile = async (fileId) => {
  await initializeDB();
  db.exec(`
    DELETE FROM files WHERE fileId = ?;
  `, [fileId]);
};
