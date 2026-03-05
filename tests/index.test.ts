import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { parse, type ToolParametersSchema } from "@/src/index";

const primitiveSchema = z.object({
  count: z.number().nullable(),
  flag: z.boolean().nullable(),
  value: z.null(),
}) as unknown as ToolParametersSchema;

const schema = z.object({
  path: z.string().nullable(),
  content: z.string().nullable(),
}) as unknown as ToolParametersSchema;

describe("incomplete json string", () => {
  test("empty string", () => {
    const invalidJsonString = ``;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("opening brace", () => {
    const invalidJsonString = `{`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("backslash after opening brace", () => {
    const invalidJsonString = `{\\`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("double quote after opening brace", () => {
    const invalidJsonString = `{\"`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("partial first key", () => {
    const invalidJsonString = `{\"path`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("partial first path with backslash", () => {
    const invalidJsonString = `{\"path\\`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("first path with double quote without colon", () => {
    const invalidJsonString = `{\"path\"`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("first path with double quote with colon", () => {
    const invalidJsonString = `{\"path\":`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("first path with double quote with colon and space", () => {
    const invalidJsonString = `{\"path\": `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("starting value with backslash", () => {
    const invalidJsonString = `{\"path\": \\`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("starting value with double quote", () => {
    const invalidJsonString = `{\"path\": \"`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: null, content: null });
  });

  test("starting value with double quote and first token", () => {
    const invalidJsonString = `{\"path\": \"//`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: "//", content: null });
  });

  test("starting value with double quote and comment as value", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: "// This is a comment ", content: null });
  });

  test("starting value with double quote and comment as value with newline", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \n`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({ path: "// This is a comment \n", content: null });
  });

  test("self contained json string", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"}`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"}`,
      content: null,
    });
  });

  test("self contained json string with newline and whitespace", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: null,
    });
  });

  test("self contained json string with newline and whitespace and second key value beginning", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} \" `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: null,
    });
  });

  test("self contained json string with newline and whitespace and second key value beginning", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} \", \"content `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: null,
    });
  });

  test("self contained json string with newline and whitespace and second key value beginning key fully streamed", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} \", \"content\": `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: null,
    });
  });

  test("self contained json string with newline and whitespace and second key value beginning key fully streamed starting value", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} \", \"content\": \"export `;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: `export `,
    });
  });

  test("self contained json string with finished", () => {
    const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} \", \"content\": \"export const test = "help";\"}`;

    const result = parse(invalidJsonString, schema);

    expect(result).toEqual({
      path: `// This is a comment \nconst content = {"test": "value"} `,
      content: `export const test = "help";`,
    });
  });
});

describe("primitive values", () => {
  test("integer value", () => {
    const result = parse(`{"count": 42, "flag": true, "value": null}`, primitiveSchema);
    expect(result).toEqual({ count: 42, flag: true, value: null });
  });

  test("float value", () => {
    const result = parse(
      `{"count": 3.14, "flag": false, "value": null}`,
      primitiveSchema,
    );
    expect(result).toEqual({ count: 3.14, flag: false, value: null });
  });

  test("negative number", () => {
    const result = parse(`{"count": -1, "flag": true, "value": null}`, primitiveSchema);
    expect(result).toEqual({ count: -1, flag: true, value: null });
  });

  test("boolean true", () => {
    const result = parse(`{"count": null, "flag": true, "value": null}`, primitiveSchema);
    expect(result).toEqual({ count: null, flag: true, value: null });
  });

  test("boolean false", () => {
    const result = parse(
      `{"count": null, "flag": false, "value": null}`,
      primitiveSchema,
    );
    expect(result).toEqual({ count: null, flag: false, value: null });
  });

  test("null value", () => {
    const result = parse(`{"count": null, "flag": null, "value": null}`, primitiveSchema);
    expect(result).toEqual({ count: null, flag: null, value: null });
  });

  test("incomplete primitive stops mid-token", () => {
    // A single digit at end-of-string is a valid number token, so it is parsed.
    const result = parse(`{"count": 4`, primitiveSchema);
    expect(result).toEqual({ count: 4, flag: null, value: null });
  });

  test("partial boolean keyword", () => {
    const result = parse(`{"flag": tru`, primitiveSchema);
    expect(result).toEqual({ count: null, flag: null, value: null });
  });
});

describe("escape sequences", () => {
  test('escaped double quote (\\")', () => {
    const result = parse(`{"path": "say \\"hi\\"", "content": "ok"}`, schema);
    expect(result).toEqual({ path: 'say "hi"', content: "ok" });
  });

  test("escaped backslash (\\\\)", () => {
    const result = parse(`{"path": "C:\\\\Users", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "C:\\Users", content: "ok" });
  });

  test("escaped forward slash (\\/)", () => {
    const result = parse(`{"path": "a\\/b", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "a/b", content: "ok" });
  });

  test("escaped newline (\\n)", () => {
    const result = parse(`{"path": "line1\\nline2", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "line1\nline2", content: "ok" });
  });

  test("escaped carriage return (\\r)", () => {
    const result = parse(`{"path": "a\\rb", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "a\rb", content: "ok" });
  });

  test("escaped tab (\\t)", () => {
    const result = parse(`{"path": "a\\tb", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "a\tb", content: "ok" });
  });

  test("escaped backspace (\\b)", () => {
    const result = parse(`{"path": "a\\bb", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "a\bb", content: "ok" });
  });

  test("escaped form feed (\\f)", () => {
    const result = parse(`{"path": "a\\fb", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "a\fb", content: "ok" });
  });
});

describe("unicode escapes", () => {
  test("valid \\u0041 decodes to A", () => {
    const result = parse(`{"path": "\\u0041", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "A", content: "ok" });
  });

  test("valid \\u00e9 decodes to é", () => {
    const result = parse(`{"path": "caf\\u00e9", "content": "ok"}`, schema);
    expect(result).toEqual({ path: "café", content: "ok" });
  });

  test("malformed \\uZZZZ does not crash", () => {
    // Invalid hex digits: escape is silently skipped, remaining chars are literal
    const result = parse(`{"path": "\\uZZZZ"}`, schema);
    expect(result).toEqual({ path: "ZZZZ", content: null });
  });

  test("truncated unicode escape at end of input returns partial string", () => {
    // Input cut after only 3 hex digits - string is incomplete so partial is extracted
    const result = parse(`{"path": "\\u004`, schema);
    expect(result.path).not.toBeNull();
    expect(result.content).toBeNull();
  });
});

describe("edge cases", () => {
  test("whitespace-only input returns all null", () => {
    const result = parse("   \t\n  ", schema);
    expect(result).toEqual({ path: null, content: null });
  });

  test("array value field stays null, preceding fields still parsed", () => {
    // Streaming parser breaks on '[', so only fields before the array are extracted.
    // Complete JSON would be parsed by JSON.parse - use an incomplete input to force
    // the streaming path.
    const arrSchema = z.object({
      name: z.string().nullable(),
      items: z.string().nullable(),
      extra: z.string().nullable(),
    }) as unknown as ToolParametersSchema;
    const result = parse(`{"name": "test", "items": [1, 2, 3], "extra": "foo`, arrSchema);
    expect(result.name).toBe("test");
    expect(result.items).toBeNull();
    expect(result.extra).toBeNull();
  });

  test("trailing backslash yields partial string up to backslash", () => {
    // The value string is incomplete (ends mid-escape), extractPartialString is used.
    const result = parse(`{"path": "test\\`, schema);
    expect(result.path).toBe("test\\");
    expect(result.content).toBeNull();
  });
});
