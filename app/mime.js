const lookup = (extName) => {
  switch (extName.toLowerCase()) {
    case "txt":
      return "text/plain";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    case "html":
      return "text/html";
    case "md":
      return "text/markdown";
    case "mdx":
      return "text/markdown";
    case "yaml":
      return "text/yaml";
    case "yml":
      return "text/yaml";
    case "toml":
      return "text/toml";
    default:
      return "application/octet-stream";
  }
};

module.exports = {
  lookup,
};
