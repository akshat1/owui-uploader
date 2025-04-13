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
  const {
    filePath,
    openWebUIUrl,
    openWebUIKey, 
  } = args;
  const fileData = await fs.promises.readFile(filePath);
  const contentType = getContentType(filePath);

  const formData = new FormData();
  formData.append("file", new Blob([fileData], { type: contentType }));
  
  const response = await fetch(`${openWebUIUrl}/api/upload`, {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${openWebUIKey}`, 
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
  
  return response.json();
};

const addFileToKnowledge = async (args) => {
  const {
    fileId,
    knowledgeId,
    openWebUIUrl,
    openWebUIKey, 
  } = args;
  const response = await fetch(`${openWebUIUrl}/api/knowledge/${knowledgeId}/file/add`, {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${openWebUIKey}`, 
    },
    body: JSON.stringify({ file_id: fileId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add file to knowledge: ${response.statusText}`);
  }
  
  return response.json();
};

module.exports = {
  uploadFile,
  addFileToKnowledge, 
};
