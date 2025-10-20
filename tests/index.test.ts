import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { parse } from "@/src/index";

const schema = z.object({
  path: z.string().nullable(),
  content: z.string().nullable(),
});

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
