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
