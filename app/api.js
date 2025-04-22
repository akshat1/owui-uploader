const path = require("node:path");
const mime = require("./mime");
const fs = require("fs");

const getContentType = (filePath) => {
  const extension = filePath.split(".").pop();
  return mime.lookup(extension);
};

/**
 * @typedef {Object} UploadFileResponse
 * @property {string} id - The id of the file
 */

/**
 * Uploads a file to open-webui
 * @param {Object} args
 * @property {string} args.filePath - The path to the file to upload
 * @property {string} args.openWebUIUrl - The url of the open-webui instance
 * @property {string} args.openWebUIKey - The api key for the open-webui instance
 * @returns {Promise<Object>} The response from the open-webui instance
 */
const uploadFile = async (args) => {
  console.log(`\n\n[uploadFile] Uploading file ${args.filePath}`);
  const {
    filePath,
    openWebUIUrl,
    openWebUIKey, 
  } = args;
  
  const contentType = getContentType(filePath);
  console.log(`[uploadFile] Content type: ${contentType}`);
  const body = new FormData();
  const buffer = await fs.promises.readFile(filePath);
  const blob = new Blob([buffer], { type: contentType });
  body.append("file", blob, path.basename(filePath));
  const headers = {
    "Authorization": `Bearer ${openWebUIKey}`,
    "Accept"       : "application/json", 
  };
  console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
  const url = `${openWebUIUrl}api/v1/files/`;
  console.log(`[uploadFile] Uploading file (${(buffer.length / 1024).toFixed(2)} KB) to ${url}`);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });
  
  if (!response.ok) {
    console.error(`[uploadFile] Failed to upload file: ${response.statusText}`);
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  const responseJson = await response.json();

  if (responseJson.error) {
    console.error(`[uploadFile] Failed to upload file: ${responseJson.error}`);
    throw new Error(`Failed to upload file: ${responseJson.error}`);
  }

  console.log(`[uploadFile] File uploaded successfully.\n${JSON.stringify(responseJson, null, 2)}`);
  return responseJson;
};

const addFileToKnowledge = async (args) => {
  console.log(`[addFileToKnowledge] Adding file to knowledge: ${args.fileId}`);
  const {
    fileId,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey, 
  } = args;

  console.log(`[addFileToKnowledge] Adding ${args.fileId} to`);
  const response = await fetch(`${openWebUIUrl}/api/v1/knowledge/${knowledgeId}/file/add`, {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${openWebUIKey}`, 
    },
    body: JSON.stringify({ file_id: fileId }),
  });

  /* c8 ignore next 4 */
  if (!response.ok) {
    console.error(`[addFileToKnowledge] Failed to add file to knowledge: ${response.statusText}`);
    throw new Error(`Failed to add file to knowledge: ${response.statusText}`);
  }
  
  console.log(`[addFileToKnowledge] File added to knowledge successfully.\n${JSON.stringify(response.json(), null, 2)}`);
  return response.json();
};

module.exports = {
  uploadFile, addFileToKnowledge, 
};
