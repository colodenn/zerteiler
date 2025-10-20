import { z } from "zod";
import { extractPartialString, parsePrimitive, parseString } from "@/src/utils";

/**
 * Extracts keys from a Zod schema shape
 */
const getSchemaKeys = (schema: z.ZodTypeAny): string[] => {
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  return [];
};

/**
 * This functions takes in a unfinished or complete json string and returns a json object.
 *
 * @param input - Incomplete or complete JSON string from streaming LLM tool call
 * @param schema - Zod schema defining the expected shape
 *
 * @returns Parsed object with extracted values, null for missing values
 */
export const parse = <T extends z.ZodTypeAny>(input: string, schema: T): z.infer<T> => {
  const keys = getSchemaKeys(schema);

  // Initialize result with null values for all expected keys.
  const result: Record<string, unknown> = Object.fromEntries(
    keys.map((key) => [key, null]),
  );

  // Handle empty or very short strings.
  if (!input || input.length === 0) {
    return result as z.infer<T>;
  }

  // Find the opening brace (allow leading whitespace).
  let startIdx = 0;
  while (startIdx < input.length) {
    const char = input[startIdx];
    if (!char || !/\s/.test(char)) break;
    startIdx++;
  }

  // Must start with opening brace.
  if (startIdx >= input.length || input[startIdx] !== "{") {
    return result as z.infer<T>;
  }

  try {
    // Try parsing as valid JSON first (for complete JSON).
    return JSON.parse(input) as z.infer<T>;
  } catch {
    // Continue with streaming parser for incomplete JSON.
  }

  // State machine for parsing incomplete JSON.
  let pos = startIdx + 1; // Skip opening brace
  const len = input.length;

  while (pos < len) {
    // Skip whitespace.
    while (pos < len) {
      const char = input[pos];
      if (!char || !/\s/.test(char)) break;
      pos++;
    }

    if (pos >= len) break;

    const currentChar = input[pos];
    if (!currentChar) break;

    // Check for closing brace or comma.
    if (currentChar === "}" || currentChar === ",") {
      pos++;
      continue;
    }

    // Parse key.
    if (currentChar === '"') {
      const keyResult = parseString(input, pos, true); // true = parsing a key
      if (keyResult === null) {
        // Incomplete key - check what kind of incompleteness.
        if (pos + 1 >= len) {
          // Just an opening quote with nothing after.
          break;
        } else if (input[len - 1] === "\\") {
          // Ends with backslash (incomplete escape sequence).
          break;
        } else {
          // There's content after the quote, so we have a partial key.
          // Return the result with null values for all keys.
          break;
        }
      }

      const key = keyResult.value;
      pos = keyResult.endPos;

      // Skip whitespace after key.
      while (pos < len) {
        const char = input[pos];
        if (!char || !/\s/.test(char)) break;
        pos++;
      }

      // Check for colon.
      const colonChar = input[pos];
      if (pos >= len || colonChar !== ":") {
        // No colon yet, key is complete but value not started.
        break;
      }

      pos++; // Skip colon.

      // Skip whitespace after colon.
      while (pos < len) {
        const char = input[pos];
        if (!char || !/\s/.test(char)) break;
        pos++;
      }

      if (pos >= len) {
        // Nothing after colon.
        break;
      }

      const valueStartChar = input[pos];
      if (!valueStartChar) break;

      // Parse value.
      if (valueStartChar === '"') {
        const valueResult = parseString(input, pos);
        if (valueResult === null) {
          // String started but not complete, return what we have as value.
          const partialValue = extractPartialString(input, pos);
          if (partialValue !== null) {
            result[key] = partialValue;
          }
          break;
        } else {
          result[key] = valueResult.value;
          pos = valueResult.endPos;
        }
      } else if (valueStartChar === "{" || valueStartChar === "[") {
        // Object or array value - skip for now, just break.
        break;
      } else if (/[tfn0-9-]/.test(valueStartChar)) {
        // Boolean, null, or number - parse primitive.
        const valueResult = parsePrimitive(input, pos);
        if (valueResult !== null) {
          result[key] = valueResult.value;
          pos = valueResult.endPos;
        } else {
          break;
        }
      } else {
        // Unknown value start.
        break;
      }
    } else {
      // Unexpected character.
      break;
    }
  }

  return result as z.infer<T>;
};
