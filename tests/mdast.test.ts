import { isNotVoid } from "typed-assert";
import { afterEach, test, expect } from "vitest";

import {
  findHeadingWithChildren,
  fromMarkdown,
  isList,
  sortListsRecursively,
  sortListsRecursivelyByTimestamp,
  sortListsRecursivelyInMarkdown,
  toMarkdown,
} from "../src/mdast/mdast";
import { configureTimestampRegExps } from "../src/regexp";

afterEach(() => configureTimestampRegExps("HH:mm"));

test("roundtripping doesn't mess up Obsidian-styled markdown", () => {
  const input = `# [[Heading]]

- [!] This is ![[custom syntax]] all #over the place ^block-id
  \`\`\`js
  console.log("this is a code block");
  \`\`\`
  paragraph text
    - [ ] Task
- [x] 1 [key:: value]
    - [ ] 2

| table | blah |
| ----- | ---- |
| key   | val  |

- [ ] Task
  \`\`\`yaml
  planner:
    log:
      - start: 2024-01-01
  \`\`\`
- [ ] Another task
`;

  const parsed = fromMarkdown(input);

  expect(toMarkdown(parsed)).toEqual(input);
});

test("Find heading position", () => {
  const input = `1
2

# Target

text

## Sub-heading

sub-heading text

# Next heading

text
`;

  const expected = `# Target

text

## Sub-heading

sub-heading text
`;

  const mdastRoot = fromMarkdown(input);

  const headingWithChildren = findHeadingWithChildren(mdastRoot, "Target");

  isNotVoid(headingWithChildren);

  expect(toMarkdown(headingWithChildren)).toBe(expected);
});

test("Sort lists recursively", () => {
  const input = `- b
- c
    - a
    - c
    - b
- a
`;

  const expected = `- a
- b
- c
    - a
    - b
    - c
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  const actual = toMarkdown(sortListsRecursively(list));

  expect(actual).toBe(expected);
});

test("Sorts timed groups while preserving attached untimed items", () => {
  const input = `- 10:00 - 11:00 b
- No time
- 09:00 - 10:00 a
- 13:00 d
- 11:00 - 12:00 c
- Another item without time
- 15:00 f
- 14:00 e
`;

  const expected = `- 09:00 - 10:00 a
- 10:00 - 11:00 b
- No time
- 11:00 - 12:00 c
- Another item without time
- 13:00 d
- 14:00 e
- 15:00 f
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  const actual = toMarkdown(sortListsRecursivelyByTimestamp(list));

  expect(actual).toBe(expected);
});

test("Keeps numeric-leading text untimed when sorting with HH:mm", () => {
  const input = `- 2026 goals
- 10:00 b
- 09:00 a
`;
  const expected = `- 2026 goals
- 09:00 a
- 10:00 b
`;
  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  expect(toMarkdown(sortListsRecursivelyByTimestamp(list))).toBe(expected);
});

test("Sorts compact timed ranges with HHmm", () => {
  configureTimestampRegExps("HHmm");

  const input = `- 1000 - 1100 b
- Notes for b
- 0900 - 1000 a
`;
  const expected = `- 0900 - 1000 a
- 1000 - 1100 b
- Notes for b
`;
  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  expect(toMarkdown(sortListsRecursivelyByTimestamp(list))).toBe(expected);
});

test("Sorts timed groups recursively at each nested level", () => {
  const input = `- Parent
    - 11:00 Child b
    - Untimed child
    - 10:00 Child a
    - 09:00 Child c
- 12:00 Root b
- Root without time
- 11:00 Root a
`;

  const expected = `- Parent
    - 09:00 Child c
    - 10:00 Child a
    - 11:00 Child b
    - Untimed child
- 11:00 Root a
- 12:00 Root b
- Root without time
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  const actual = toMarkdown(sortListsRecursivelyByTimestamp(list));

  expect(actual).toBe(expected);
});

test("Does not sort embedded clock text as a timed group", () => {
  const input = `- [ ] SRT 371(15:36 출발)
- [ ] 12:00 Root b
- [ ] 11:00 Root a
`;

  const expected = `- [ ] SRT 371(15:36 출발)
- [ ] 11:00 Root a
- [ ] 12:00 Root b
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  const actual = toMarkdown(sortListsRecursivelyByTimestamp(list));

  expect(actual).toBe(expected);
});

test.each([
  "Compare model output (version 5.6)",
  "Complete migration phase 2.",
  "Keep the trailing marker -",
])(
  "preserves the next schedule line after list-like text: %s",
  (nestedItem) => {
    const input = `- 10:00 - 11:00 Focus session
  - ${nestedItem}
- 09:00 - 10:00 Preparation
  - Review the checklist
- 11:00 - 12:00 Break
`;
    const expected = `- 09:00 - 10:00 Preparation
    - Review the checklist
- 10:00 - 11:00 Focus session
    - ${nestedItem}
- 11:00 - 12:00 Break
`;

    const actual = sortListsRecursivelyInMarkdown(input);

    expect(actual).toBe(expected);
    expect(sortListsRecursivelyInMarkdown(actual)).toBe(expected);
  },
);

test.each(["-", "--", "---", "----", "=", "==", "==="])(
  "keeps an indented %s separator from turning a schedule into a heading",
  (separator) => {
    const input = `- 10:00 - 11:00 Focus session
  ${separator}
- 11:00 - 12:00 Break
`;
    const expected = `- 10:00 - 11:00 Focus session

    ***
- 11:00 - 12:00 Break
`;

    const actual = sortListsRecursivelyInMarkdown(input);

    expect(actual).toBe(expected);
    expect(sortListsRecursivelyInMarkdown(actual)).toBe(expected);
  },
);

test.todo("Tabs don't get replaced with spaces on roundtripping");

test("Does not throw errors on empty lists", () => {
  const input = `- b
- 
- a
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];

  isList(list);

  expect(() => toMarkdown(sortListsRecursively(list))).not.toThrow();
});
