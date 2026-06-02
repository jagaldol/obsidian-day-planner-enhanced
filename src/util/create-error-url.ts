export function createErrorUrl(error: Error) {
  const asMarkdown = `
<!-- Don't forget to add a descriptive title! -->

Steps to reproduce:
1. 

Error log:
\`\`\`log
${error.stack}
\`\`\`

Other relevant details:
`;

  const encoded = encodeURI(asMarkdown);

  return `https://github.com/jagaldol/obsidian-day-planner-enhanced/issues/new?assignees=&labels=bug&projects=&template=bug_report.yaml&body=${encoded}`;
}
