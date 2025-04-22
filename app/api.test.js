const {
  describe, test, afterEach, before, after, 
} = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const fs = require("node:fs");
const {
  uploadFile, addFileToKnowledge, 
} = require("./api.js");

describe("api", () => {
  let mockFetch;
  let consoleLogStub;
  let consoleErrorStub;
  let mockReadFile;
  let mockFormData;

  before(() => {
    mockFetch = sinon.stub(global, "fetch");
    consoleLogStub = sinon.stub(console, "log");
    consoleErrorStub = sinon.stub(console, "error");
    mockReadFile = sinon.stub(fs.promises, "readFile");
    mockFormData = sinon.stub(global, "FormData");
  });

  afterEach(() => {
    sinon.reset();
  });

  after(() => {
    sinon.restore();
  });

  test("uploadFile", async () => {
    mockFetch.resolves({
      ok  : true,
      json: sinon.stub().resolves({ id: "123" }), 
    });
    mockReadFile.resolves(Buffer.from("test"));
    
    const fakeForm = (() => {
      const data = new Map();
      return {
        append: sinon.stub((key, value) => {
          data.set(key, value);
        }),
        get: key => data.get(key), 
      };
    })();
    mockFormData.returns(fakeForm);

    const response = await uploadFile({
      filePath    : "test.txt",
      openWebUIUrl: "http://localhost:3000",
      openWebUIKey: "TEST KEY",
    });

    assert.strictEqual(response.id, "123");
    assert.strictEqual(mockFetch.callCount, 1);
    assert.strictEqual(mockFetch.args[0][0], "http://localhost:3000api/v1/files/");
    const fetchOpts = mockFetch.args[0][1];
    assert.strictEqual(fetchOpts.method, "POST");
    assert.strictEqual(fetchOpts.headers["Authorization"], "Bearer TEST KEY");
    assert.strictEqual(fetchOpts.headers["Accept"], "application/json");
    
    const formData = fetchOpts.body;
    assert.strictEqual(formData.get("file").type, "text/plain");
    
    // Verify logging
    assert.ok(consoleLogStub.calledWith(sinon.match(/\[uploadFile\] Uploading file test.txt/)));
    assert.ok(consoleLogStub.calledWith(sinon.match(/\[uploadFile\] Content type: text\/plain/)));
    assert.ok(consoleLogStub.calledWith(sinon.match(/\[uploadFile\] Uploading file/)));
    assert.ok(consoleLogStub.calledWith(sinon.match(/\[uploadFile\] File uploaded successfully/)));
  });

  test("uploadFile handles error response", async () => {
    mockFetch.resolves({
      ok        : false,
      statusText: "Not Found", 
    });
    mockReadFile.resolves(Buffer.from("test"));
    
    const fakeForm = (() => {
      const data = new Map();
      return {
        append: sinon.stub((key, value) => {
          data.set(key, value);
        }),
        get: key => data.get(key), 
      };
    })();
    mockFormData.returns(fakeForm);

    try {
      await uploadFile({
        filePath    : "test.txt",
        openWebUIUrl: "http://localhost:3000",
        openWebUIKey: "TEST KEY",
      });
      assert.fail("Expected error to be thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Failed to upload file: Not Found");
      assert.ok(consoleErrorStub.calledWith(sinon.match(/\[uploadFile\] Failed to upload file: Not Found/)));
    }
  });

  test("uploadFile handles error in JSON response", async () => {
    mockFetch.resolves({
      ok  : true,
      json: sinon.stub().resolves({ error: "Invalid file" }), 
    });
    mockReadFile.resolves(Buffer.from("test"));
    
    const fakeForm = (() => {
      const data = new Map();
      return {
        append: sinon.stub((key, value) => {
          data.set(key, value);
        }),
        get: key => data.get(key), 
      };
    })();
    mockFormData.returns(fakeForm);

    try {
      await uploadFile({
        filePath    : "test.txt",
        openWebUIUrl: "http://localhost:3000",
        openWebUIKey: "TEST KEY",
      });
      assert.fail("Expected error to be thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Failed to upload file: Invalid file");
      assert.ok(consoleErrorStub.calledWith(sinon.match(/\[uploadFile\] Failed to upload file: Invalid file/)));
    }
  });

  test("addFileToKnowledge", async () => {
    mockFetch.resolves({
      ok  : true,
      json: sinon.stub().resolves({}), 
    });

    await addFileToKnowledge({
      fileId      : "123",
      knowledgeId : "456",
      openWebUIUrl: "http://localhost:3000",
      openWebUIKey: "TEST KEY",
    });

    assert.strictEqual(mockFetch.callCount, 1);
    assert.strictEqual(mockFetch.args[0][0], "http://localhost:3000/api/v1/knowledge/456/file/add");
    const fetchOpts = mockFetch.args[0][1];
    assert.strictEqual(fetchOpts.method, "POST");
    assert.strictEqual(fetchOpts.headers["Content-Type"], "application/json");
    assert.strictEqual(fetchOpts.headers["Authorization"], "Bearer TEST KEY");

    const body = JSON.parse(fetchOpts.body);
    assert.strictEqual(body.file_id, "123");
  });
});
