const { describe, it, afterEach, before } = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const path = require("path");
const fs = require("fs").promises;
const api = require("./api");
const db = require("./db");
const syncDirectory = require("./sync-directory").syncDirectory;

// Access the syncFile function for testing
const syncFile = require("./sync-directory").syncFile;

describe("sync-directory.js", () => {
  let fsReaddirStub;
  let fsStatStub;
  let fsReadFileStub;
  let pathJoinStub;
  let uploadFileStub;
  let addFileToKnowledgeStub;
  let getFileStub;
  let recordFileStub;

  before(() => {
    fsReaddirStub = sinon.stub(fs, "readdir");
    fsStatStub = sinon.stub(fs, "stat");
    fsReadFileStub = sinon.stub(fs, "readFile");

    pathJoinStub = sinon.stub(path, "join");
    pathJoinStub.callsFake((dir, file) => `${dir}/${file}`);
    
    uploadFileStub = sinon.stub(api, "uploadFile");
    addFileToKnowledgeStub = sinon.stub(api, "addFileToKnowledge");
    
    getFileStub = sinon.stub(db, "getFile");
    recordFileStub = sinon.stub(db, "recordFile");
  });

  afterEach(() => {
    fsReaddirStub.reset();
    fsStatStub.reset();
    pathJoinStub.reset();
    uploadFileStub.reset();
    addFileToKnowledgeStub.reset();
    getFileStub.reset();
    recordFileStub.reset();
  });

  describe("syncFile", () => {
    it("should upload and record a file if it doesn't exist in the database", async () => {
      const filePath = "/test/file.txt";
      const knowledgeId = "knowledge-123";
      const openWebUIUrl = "https://openwebui.example.com";
      const openWebUIKey = "api-key-123";
      const fileStat = { mtime: "2023-01-01T12:00:00Z" };
      const fileId = "file-456";
      
      // getFileStub.resolves({
      //   fileId,
      //   lastModified: "2024-01-01T12:00:00Z",
      //   filePath,
      //   knowledgeId,
      // });
      fsReadFileStub.resolves("Hello, world!");
      uploadFileStub.resolves(fileId);
      addFileToKnowledgeStub.resolves();
      recordFileStub.resolves();
      
      await syncFile({
        filePath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
        fileStat,
      });
      
      assert.strictEqual(getFileStub.callCount, 1);
      assert.deepStrictEqual(getFileStub.firstCall.args, [filePath, knowledgeId]);
      
      assert.strictEqual(uploadFileStub.callCount, 1);
      assert.deepStrictEqual(uploadFileStub.firstCall.args[0], {
        filePath,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(addFileToKnowledgeStub.callCount, 1);
      assert.deepStrictEqual(addFileToKnowledgeStub.firstCall.args[0], {
        fileId,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(recordFileStub.callCount, 1);
      assert.deepStrictEqual(recordFileStub.firstCall.args[0], {
        fileId,
        lastModified: fileStat.mtime,
        filePath,
        knowledgeId,
      });
    });

    it("should upload and record a file if it has been modified", async () => {
      const filePath = "/test/file.txt";
      const knowledgeId = "knowledge-123";
      const openWebUIUrl = "https://openwebui.example.com";
      const openWebUIKey = "api-key-123";
      const fileStat = { mtime: "2023-01-02T12:00:00Z" };
      const fileId = "file-456";
      
      getFileStub.resolves({
        fileId      : "old-file-id",
        lastModified: "2023-01-01T12:00:00Z",
        filePath,
        knowledgeId,
      });
      uploadFileStub.resolves(fileId);
      addFileToKnowledgeStub.resolves();
      recordFileStub.resolves();
      // Mock recordFile to resolve successfully
      recordFileStub.resolves();
      
      // Execute
      await syncFile({
        filePath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
        fileStat,
      });
      
      // Verify
      assert.strictEqual(getFileStub.callCount, 1);
      assert.deepStrictEqual(getFileStub.firstCall.args, [filePath, knowledgeId]);
      
      assert.strictEqual(uploadFileStub.callCount, 1);
      assert.deepStrictEqual(uploadFileStub.firstCall.args[0], {
        filePath,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(addFileToKnowledgeStub.callCount, 1);
      assert.deepStrictEqual(addFileToKnowledgeStub.firstCall.args[0], {
        fileId,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(recordFileStub.callCount, 1);
      assert.deepStrictEqual(recordFileStub.firstCall.args[0], {
        fileId,
        lastModified: fileStat.mtime,
        filePath,
        knowledgeId,
      });
    });

    it("should not upload a file if it has not been modified", async () => {
      const filePath = "/test/file.txt";
      const knowledgeId = "knowledge-123";
      const openWebUIUrl = "https://openwebui.example.com";
      const openWebUIKey = "api-key-123";
      const fileStat = { mtime: "2023-01-01T12:00:00Z" };
      
      getFileStub.resolves({
        fileId      : "existing-file-id",
        lastModified: "2023-01-01T12:00:00Z",
        filePath,
        knowledgeId,
      });
      
      await syncFile({
        filePath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
        fileStat,
      });
      
      assert.strictEqual(getFileStub.callCount, 1);
      assert.deepStrictEqual(getFileStub.firstCall.args, [filePath, knowledgeId]);
      
      // These should not be called
      assert.strictEqual(uploadFileStub.callCount, 0);
      assert.strictEqual(addFileToKnowledgeStub.callCount, 0);
      assert.strictEqual(recordFileStub.callCount, 0);
    });
  });

  describe("syncDirectory", () => {
    it("should sync all files in a directory", async () => {
      const directoryPath = "/test/dir";
      const knowledgeId = "knowledge-123";
      const openWebUIUrl = "https://openwebui.example.com";
      const openWebUIKey = "api-key-123";
      
      fsReaddirStub.resolves(["file1.txt", "file2.txt"]);
      
      fsStatStub.onFirstCall().resolves({ isDirectory: () => false });
      fsStatStub.onSecondCall().resolves({ isDirectory: () => false });
      
      getFileStub.resolves(null);
      uploadFileStub.resolves("file-id");
      addFileToKnowledgeStub.resolves();
      recordFileStub.resolves();
      
      await syncDirectory({
        directoryPath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(fsReaddirStub.callCount, 1);
      assert.deepStrictEqual(fsReaddirStub.firstCall.args, [directoryPath]);
      
      // Should call fs.stat twice (once for each file)
      assert.strictEqual(fsStatStub.callCount, 2);
      
      // Should call path.join twice (once for each file)
      assert.strictEqual(pathJoinStub.callCount, 2);
      
      // Should call getFile twice (once for each file)
      assert.strictEqual(getFileStub.callCount, 2);
      
      // Should call uploadFile twice (once for each file)
      assert.strictEqual(uploadFileStub.callCount, 2);
      
      // Should call addFileToKnowledge twice (once for each file)
      assert.strictEqual(addFileToKnowledgeStub.callCount, 2);
      
      // Should call recordFile twice (once for each file)
      assert.strictEqual(recordFileStub.callCount, 2);
    });

    it("should recursively sync subdirectories", async () => {
      // Setup
      const directoryPath = "/test/dir";
      const knowledgeId = "knowledge-123";
      const openWebUIUrl = "https://openwebui.example.com";
      const openWebUIKey = "api-key-123";
      
      // Mock fs.readdir to return a file and a directory
      fsReaddirStub.onFirstCall().resolves(["file1.txt", "subdir"]);
      fsReaddirStub.onSecondCall().resolves(["file2.txt"]);
      
      // Mock fs.stat for each file/directory
      fsStatStub.onFirstCall().resolves({ isDirectory: () => false });
      fsStatStub.onSecondCall().resolves({ isDirectory: () => true });
      fsStatStub.onThirdCall().resolves({ isDirectory: () => false });
      
      // Mock getFile to return null for all files (they don't exist in the database)
      getFileStub.resolves(null);
      
      // Mock uploadFile to return a fileId
      uploadFileStub.resolves("file-id");
      
      // Mock addFileToKnowledge to resolve successfully
      addFileToKnowledgeStub.resolves();
      
      // Mock recordFile to resolve successfully
      recordFileStub.resolves();
      
      // Execute
      await syncDirectory({
        directoryPath,
        knowledgeId,
        openWebUIUrl,
        openWebUIKey,
      });
      
      assert.strictEqual(fsReaddirStub.callCount, 2);
      
      // Should call fs.stat three times (once for each file/directory)
      assert.strictEqual(fsStatStub.callCount, 3);
      
      // Should call path.join three times (once for each file/directory)
      assert.strictEqual(pathJoinStub.callCount, 3);
      
      // Should call getFile twice (once for each file)
      assert.strictEqual(getFileStub.callCount, 2);
      
      // Should call uploadFile twice (once for each file)
      assert.strictEqual(uploadFileStub.callCount, 2);
      
      // Should call addFileToKnowledge twice (once for each file)
      assert.strictEqual(addFileToKnowledgeStub.callCount, 2);
      
      // Should call recordFile twice (once for each file)
      assert.strictEqual(recordFileStub.callCount, 2);
    });
  });
}); 
