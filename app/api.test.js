import { test, mock } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create mock module
const mockModule = {
  mime: {
    lookup: () => {}
  },
  fs: {
    promises: {
      readFile: () => {}
    }
  },
  fetch: () => {}
};

// Mock FormData and Blob
global.FormData = class FormData {
  append() {}
};

global.Blob = class Blob {
  constructor() {}
};

test('getContentType function', async (t) => {
  const lookupMock = mock.fn(() => 'application/pdf');
  mockModule.mime.lookup = lookupMock;
  
  try {
    const { getContentType, setMockDeps } = await import('./api.js');
    setMockDeps({ mime: mockModule.mime });
    
    const result = getContentType('test.pdf');
    
    assert.strictEqual(result, 'application/pdf');
    assert.strictEqual(lookupMock.mock.calls.length, 1);
    assert.strictEqual(lookupMock.mock.calls[0].arguments[0], 'pdf');
  } finally {
    // Reset mock
    mockModule.mime.lookup = () => {};
  }
});

test('uploadFile function - success case', async (t) => {
  const readFileMock = mock.fn(() => Promise.resolve(Buffer.from('test data')));
  const lookupMock = mock.fn(() => 'text/plain');
  const fetchMock = mock.fn(() => Promise.resolve({
    ok: true,
    statusText: 'OK',
    json: () => Promise.resolve({ id: 'file-123' })
  }));
  
  mockModule.fs.promises.readFile = readFileMock;
  mockModule.mime.lookup = lookupMock;
  mockModule.fetch = fetchMock;
  
  try {
    const { uploadFile, setMockDeps } = await import('./api.js');
    setMockDeps({
      fs: mockModule.fs,
      mime: mockModule.mime,
      fetch: mockModule.fetch
    });
    
    const args = {
      filePath: '/path/to/test.txt',
      openWebUIUrl: 'https://example.com',
      openWebUIKey: 'test-key'
    };
    
    const result = await uploadFile(args);
    
    // Verify the result
    assert.deepStrictEqual(result, { id: 'file-123' });
    
    // Verify fetch was called with correct arguments
    assert.strictEqual(fetchMock.mock.calls.length, 1);
    assert.strictEqual(fetchMock.mock.calls[0].arguments[0], 'https://example.com/api/upload');
    assert.deepStrictEqual(fetchMock.mock.calls[0].arguments[1].method, 'POST');
    assert.deepStrictEqual(fetchMock.mock.calls[0].arguments[1].headers, {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-key'
    });
    
    // Verify fs.promises.readFile was called with correct arguments
    assert.strictEqual(readFileMock.mock.calls.length, 1);
    assert.strictEqual(readFileMock.mock.calls[0].arguments[0], '/path/to/test.txt');
    
    // Verify mime.lookup was called with correct arguments
    assert.strictEqual(lookupMock.mock.calls.length, 1);
    assert.strictEqual(lookupMock.mock.calls[0].arguments[0], 'txt');
  } finally {
    // Reset mocks
    mockModule.fs.promises.readFile = () => {};
    mockModule.mime.lookup = () => {};
    mockModule.fetch = () => {};
  }
});

test('uploadFile function - error case', async (t) => {
  const readFileMock = mock.fn(() => Promise.resolve(Buffer.from('test data')));
  const lookupMock = mock.fn(() => 'text/plain');
  const fetchMock = mock.fn(() => Promise.resolve({
    ok: false,
    statusText: 'Not Found'
  }));
  
  mockModule.fs.promises.readFile = readFileMock;
  mockModule.mime.lookup = lookupMock;
  mockModule.fetch = fetchMock;
  
  try {
    const { uploadFile, setMockDeps } = await import('./api.js');
    setMockDeps({
      fs: mockModule.fs,
      mime: mockModule.mime,
      fetch: mockModule.fetch
    });
    
    const args = {
      filePath: '/path/to/test.txt',
      openWebUIUrl: 'https://example.com',
      openWebUIKey: 'test-key'
    };
    
    // Verify the function throws an error
    await assert.rejects(
      async () => await uploadFile(args),
      /Failed to upload file: Not Found/
    );
  } finally {
    // Reset mocks
    mockModule.fs.promises.readFile = () => {};
    mockModule.mime.lookup = () => {};
    mockModule.fetch = () => {};
  }
});

test('addFileToKnowledge function - success case', async (t) => {
  const fetchMock = mock.fn(() => Promise.resolve({
    ok: true,
    statusText: 'OK',
    json: () => Promise.resolve({ success: true })
  }));
  
  mockModule.fetch = fetchMock;
  
  try {
    const { addFileToKnowledge, setMockDeps } = await import('./api.js');
    setMockDeps({ fetch: mockModule.fetch });
    
    const args = {
      fileId: 'file-123',
      knowledgeId: 'knowledge-456',
      openWebUIUrl: 'https://example.com',
      openWebUIKey: 'test-key'
    };
    
    const result = await addFileToKnowledge(args);
    
    // Verify the result
    assert.deepStrictEqual(result, { success: true });
    
    // Verify fetch was called with correct arguments
    assert.strictEqual(fetchMock.mock.calls.length, 1);
    assert.strictEqual(fetchMock.mock.calls[0].arguments[0], 'https://example.com/api/knowledge/knowledge-456/file/add');
    assert.deepStrictEqual(fetchMock.mock.calls[0].arguments[1].method, 'POST');
    assert.deepStrictEqual(fetchMock.mock.calls[0].arguments[1].headers, {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-key'
    });
    assert.deepStrictEqual(JSON.parse(fetchMock.mock.calls[0].arguments[1].body), { file_id: 'file-123' });
  } finally {
    // Reset mock
    mockModule.fetch = () => {};
  }
});

test('addFileToKnowledge function - error case', async (t) => {
  const fetchMock = mock.fn(() => Promise.resolve({
    ok: false,
    statusText: 'Not Found'
  }));
  
  mockModule.fetch = fetchMock;
  
  try {
    const { addFileToKnowledge, setMockDeps } = await import('./api.js');
    setMockDeps({ fetch: mockModule.fetch });
    
    const args = {
      fileId: 'file-123',
      knowledgeId: 'knowledge-456',
      openWebUIUrl: 'https://example.com',
      openWebUIKey: 'test-key'
    };
    
    // Verify the function throws an error
    await assert.rejects(
      async () => await addFileToKnowledge(args),
      /Failed to add file to knowledge: Not Found/
    );
  } finally {
    // Reset mock
    mockModule.fetch = () => {};
  }
}); 