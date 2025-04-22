const {
  describe, it, afterEach, before, 
} = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const path = require("node:path");
const { getWatcherFn } = require("./watcher");
const syncModule = require("./sync-directory");
const fs = require("node:fs");

describe("watcher.js", () => {
  let syncFileStub;
  let pathJoinStub;
  let fsStatStub;

  before(() => {
    syncFileStub = sinon.stub(syncModule, "syncFile");
    pathJoinStub = sinon.stub(path, "join");
    fsStatStub = sinon.stub(fs.promises, "stat");
  });

  afterEach(() => {
    syncFileStub.reset();
    pathJoinStub.reset();
    fsStatStub.reset();
  });

  it("should create a watcher function that calls syncFile with the correct parameters", async () => {
    const openWebUIUrl = "https://openwebui.example.com";
    const openWebUIKey = "api-key-123";
    const knowledgeId = "knowledge-456";
    const directoryPath = "/test/dir";
    const acceptableExtensions = ["txt", "md", "pdf"];
    const filename = "test.txt";
    const filePath = "/test/dir/test.txt";
    const fileStat = {
      isDirectory: () => false, mtime: new Date(), 
    };
    
    pathJoinStub.returns(filePath);
    fsStatStub.resolves(fileStat);
    const watcherFn = getWatcherFn({
      openWebUIUrl,
      openWebUIKey,
      knowledgeId,
      directoryPath,
      acceptableExtensions,
    });
    
    await watcherFn("add", filename);
    
    assert.strictEqual(pathJoinStub.callCount, 1, "Should call path.join once");
    assert.deepStrictEqual(pathJoinStub.firstCall.args, [directoryPath, filename]);
  
    assert.strictEqual(syncFileStub.callCount, 1, "Should call syncFile once");
    assert.deepStrictEqual(syncFileStub.firstCall.args[0], {
      filePath,
      fileStat,
      knowledgeId,
      openWebUIUrl,
      openWebUIKey,
      acceptableExtensions,
    });
  });

  it("should handle different event types", async () => {
    const openWebUIUrl = "https://openwebui.example.com";
    const openWebUIKey = "api-key-123";
    const knowledgeId = "knowledge-456";
    const directoryPath = "/test/dir";
    const acceptableExtensions = ["txt", "md", "pdf"];
    const filename = "test.txt";
    const filePath = "/test/dir/test.txt";
    const fileStat = {
      isDirectory: () => false, mtime: new Date(), 
    };
    
    pathJoinStub.returns(filePath);
    fsStatStub.resolves(fileStat);
    const watcherFn = getWatcherFn({
      openWebUIUrl,
      openWebUIKey,
      knowledgeId,
      directoryPath,
      acceptableExtensions,
    });
    
    await watcherFn("change", filename);
    await watcherFn("rename", filename);

    assert.strictEqual(syncFileStub.callCount, 2, "Should call syncFile twice");
  });
});
