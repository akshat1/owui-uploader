const { describe, it, afterEach, before } = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const db = require("./db.js");
const sqlite3 = require("sqlite3");

describe("db.js", () => {
  let mockDBInstance;
  let mockDBConstructor;

  before(() => {
    mockDBInstance = sinon.createStubInstance(sqlite3.Database);
    mockDBConstructor = sinon.stub(sqlite3, "Database").callsFake(() => {
      console.log("mockDBConstructor called");
      mockDBInstance._A = "AYE";
      mockDBInstance.exec._foo = "bar";
      return mockDBInstance;
    });
    process.env.HOME = "/mock/home";
  });
  
  afterEach(() => {
    mockDBInstance.exec.reset();
    mockDBInstance.get.reset();
    mockDBInstance.all.reset();
  });
  
  describe("recordFile", () => {
    it("should initialize the database", async () => {
      await db.recordFile({
        fileId      : "file-123",
        lastModified: "2023-01-01T12:00:00Z",
        filePath    : "/path/to/file.txt",
        knowledgeId : "knowledge-456",
      });
      assert.strictEqual(mockDBConstructor.callCount, 1);
      assert.deepStrictEqual(mockDBConstructor.firstCall.args, ["/mock/home/.owui-sync.db"]);
    });

    it("should record a file", async () => {
      const fileId = "file-123";
      const lastModified = "2023-01-01T12:00:00Z";
      const filePath = "/path/to/file.txt";
      const knowledgeId = "knowledge-456";
      
      await db.recordFile({ fileId, lastModified, filePath, knowledgeId });
      assert.strictEqual(mockDBInstance.exec.callCount, 1);
      const insertCall = mockDBInstance.exec.firstCall;
      assert.strictEqual(insertCall.args[0], "INSERT OR REPLACE INTO files (filePath, knowledgeId, fileId, lastModified) VALUES (?, ?, ?, ?);");
      assert.deepStrictEqual(insertCall.args[1], [filePath, knowledgeId, fileId, lastModified]);
    });
  });

  describe("getFile", () => {
    it("should retrieve a file by filePath and knowledge ID", async () => {
      const filePath = "/path/to/file.txt";
      const knowledgeId = "knowledge-456";
      const expectedFile = {
        fileId      : "file-123",
        lastModified: "2023-01-01T12:00:00Z",
        filePath    : "/path/to/file.txt",
        knowledgeId : "knowledge-456",
      };
      mockDBInstance.get.resolves(expectedFile);
      
      const result = await db.getFile(filePath, knowledgeId);
      assert.strictEqual(mockDBInstance.get.callCount, 1);
      assert.strictEqual(mockDBInstance.get.firstCall.args[0], "SELECT * FROM files WHERE filePath = ? AND knowledgeId = ?;");
      assert.deepStrictEqual(mockDBInstance.get.firstCall.args[1], [filePath, knowledgeId]);
      assert.deepStrictEqual(result, expectedFile);
    });
  });

  describe("getFiles", () => {
    it("should retrieve all files for a knowledge ID", async () => {
      const knowledgeId = "knowledge-456";
      const expectedFiles = [
        {
          fileId      : "file-123",
          lastModified: "2023-01-01T12:00:00Z",
          filePath    : "/path/to/file1.txt",
          knowledgeId : "knowledge-456",
        },
        {
          fileId      : "file-456",
          lastModified: "2023-01-02T12:00:00Z",
          filePath    : "/path/to/file2.txt",
          knowledgeId : "knowledge-456",
        },
      ];
      mockDBInstance.all.resolves(expectedFiles);
      
      const result = await db.getFiles(knowledgeId);      
      assert.strictEqual(mockDBInstance.all.callCount, 1);
      assert.strictEqual(mockDBInstance.all.firstCall.args[0], "SELECT * FROM files WHERE knowledgeId = ?;");
      assert.deepStrictEqual(mockDBInstance.all.firstCall.args[1], [knowledgeId]);
      assert.deepStrictEqual(result, expectedFiles);
    });
  });

  describe("deleteFile", () => {
    it("should delete a file by filePath and knowledge ID", async () => {
      const filePath = "/path/to/file.txt";
      const knowledgeId = "knowledge-456";
      
      await db.deleteFile(filePath, knowledgeId);
      assert.strictEqual(mockDBInstance.exec.callCount, 1);
      assert.strictEqual(mockDBInstance.exec.firstCall.args[0], "DELETE FROM files WHERE filePath = ? AND knowledgeId = ?;");
      assert.deepStrictEqual(mockDBInstance.exec.firstCall.args[1], [filePath, knowledgeId]);
    });
  });
});
