import * as mime from 'mime';
import * as fs from 'fs';

let mockDeps = null;

export function setMockDeps(deps) {
  mockDeps = deps;
}

export function getContentType(filePath) {
  const extension = filePath.split('.').pop();
  return (mockDeps ? mockDeps : { mime }).mime.lookup(extension);
}

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
export async function uploadFile({ filePath, openWebUIUrl, openWebUIKey }) {
  const deps = mockDeps || { fs, fetch: global.fetch };
  const fileData = await deps.fs.promises.readFile(filePath);
  const contentType = getContentType(filePath);
  
  const formData = new FormData();
  formData.append('file', new Blob([fileData], { type: contentType }));
  
  const response = await deps.fetch(`${openWebUIUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openWebUIKey}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
  
  return response.json();
}

export async function addFileToKnowledge({ fileId, knowledgeId, openWebUIUrl, openWebUIKey }) {
  const deps = mockDeps || { fetch: global.fetch };
  const response = await deps.fetch(`${openWebUIUrl}/api/knowledge/${knowledgeId}/file/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openWebUIKey}`
    },
    body: JSON.stringify({ file_id: fileId })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add file to knowledge: ${response.statusText}`);
  }
  
  return response.json();
}
