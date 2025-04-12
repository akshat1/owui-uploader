const { describe, test, afterEach } = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const fs = require("node:fs");
const { uploadFile } = require("./api.js");

describe("api", () => {
  test("uploadFile", async () => {
    const mockFetch = sinon.stub(global, "fetch")
      .resolves({
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

  afterEach(() => {
    sinon.restore();
  });
});
