const { describe, it } = require("node:test");
const assert = require("node:assert");
const { lookup } = require("./mime.js");

describe("mime.js", () => {
  describe("lookup", () => {
    it("should return the correct MIME type for text files", () => {
      assert.strictEqual(lookup("txt"), "text/plain");
    });

    it("should return the correct MIME type for PDF files", () => {
      assert.strictEqual(lookup("pdf"), "application/pdf");
    });

    it("should return the correct MIME type for Word documents", () => {
      assert.strictEqual(lookup("doc"), "application/msword");
      assert.strictEqual(lookup("docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    });

    it("should return the correct MIME type for CSV files", () => {
      assert.strictEqual(lookup("csv"), "text/csv");
    });

    it("should return the correct MIME type for JSON files", () => {
      assert.strictEqual(lookup("json"), "application/json");
    });

    it("should return the correct MIME type for XML files", () => {
      assert.strictEqual(lookup("xml"), "application/xml");
    });

    it("should return the correct MIME type for HTML files", () => {
      assert.strictEqual(lookup("html"), "text/html");
    });

    it("should return the correct MIME type for Markdown files", () => {
      assert.strictEqual(lookup("md"), "text/markdown");
      assert.strictEqual(lookup("mdx"), "text/markdown");
    });

    it("should return the correct MIME type for YAML files", () => {
      assert.strictEqual(lookup("yaml"), "text/yaml");
      assert.strictEqual(lookup("yml"), "text/yaml");
    });

    it("should return the correct MIME type for TOML files", () => {
      assert.strictEqual(lookup("toml"), "text/toml");
    });

    it("should return application/octet-stream for unknown file extensions", () => {
      assert.strictEqual(lookup("unknown"), "application/octet-stream");
      assert.strictEqual(lookup("xyz"), "application/octet-stream");
      assert.strictEqual(lookup(""), "application/octet-stream");
    });

    it("should handle case-insensitive file extensions", () => {
      assert.strictEqual(lookup("TXT"), "text/plain");
      assert.strictEqual(lookup("PDF"), "application/pdf");
      assert.strictEqual(lookup("JSON"), "application/json");
    });
  });
}); 