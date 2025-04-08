# Open Web UI Uploader

This app watches directories mentioned in config.json, and keeps watched directories in-sync with open web ui. 

### Config

A sample config file looks like this:

```json
{
  "directories": [{
    "path": "$HOME/Notes",
    "knowledgeId": "notes-knowledge-id"
  }, {
    "path": "$HOME/Receipts",
    "knowledgeId": "reciepts-knowledge-id"
  }, {
    "path": "$HOME/Medical Docs",
    "knowledgeId": "medical-docs-id"
  }]
}
```

Additionally, we expect the following environment variables

- `OPEN_WEBUI_URL`
- `OPEN_WEBUI_API_KEY`

### Internals

We record details of files we upload to a sqlite database at `~/.owui-sync.db`, so that we can avoid re-uploading files unless they have changed. We currently do not (can not) delete files from open web ui knowledge collections, but we can update modified ones.

# Development

## Dependency management
We use yarn for managing dependencies.

## Code organization

We are not utilizing any transpilation. Our code lives as ESM in `/app`. Why ESM? because we want to use top level awaits. Potentially. It's nice to have options.

## Testing

We use node's built in test runner. Each source file `foo.js` may have a corresponding `foo.test.js` containing unit tests for `foo.js`.
