const { describe, test, afterEach, before } = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const fs = require("node:fs");
const { uploadFile, addFileToKnowledge } = require("./api.js");

describe("api", () => {
  let mockFetch;

  before(() => {
    mockFetch = sinon.stub(global, "fetch");
  });

  afterEach(() => {
    sinon.reset();
  });

  test("uploadFile", async () => {
    mockFetch.resolves({
      ok  : true,
      json: sinon.stub().resolves({ id: "123" }),
    });
    sinon.stub(fs.promises, "readFile")
      .resolves("test");
    
    const fakeForm = (() => {
      const data = new Map();
      return {
        append: sinon.stub((key, value) => {
          data.set(key, value);
        }),
        get: key => data.get(key),
      };
    })();
    sinon.stub(global, "FormData")
      .returns(fakeForm);

    const response = await uploadFile({
      filePath    : "test.txt",
      openWebUIUrl: "http://localhost:3000",
      openWebUIKey: "TEST KEY",
    });

    assert.strictEqual(response.id, "123");
    assert.strictEqual(mockFetch.callCount, 1);
    assert.strictEqual(mockFetch.args[0][0], "http://localhost:3000/api/upload");
    const fetchOpts = mockFetch.args[0][1];
    assert.strictEqual(fetchOpts.method, "POST");
    assert.strictEqual(fetchOpts.headers["Content-Type"], "application/json");
    assert.strictEqual(fetchOpts.headers["Authorization"], "Bearer TEST KEY");
    
    const formData = fetchOpts.body;
    assert.strictEqual(await formData.get("file").text(), "test");
    assert.strictEqual(formData.get("file").type, "text/plain");
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
    assert.strictEqual(mockFetch.args[0][0], "http://localhost:3000/api/knowledge/456/file/add");
    const fetchOpts = mockFetch.args[0][1];
    assert.strictEqual(fetchOpts.method, "POST");
    assert.strictEqual(fetchOpts.headers["Content-Type"], "application/json");
    assert.strictEqual(fetchOpts.headers["Authorization"], "Bearer TEST KEY");

    const body = JSON.parse(fetchOpts.body);
    assert.strictEqual(body.file_id, "123");
  });
});
