/**
 * Parse a complete JSON string value or key.
 *
 * @param str - The string to parse.
 * @param startPos - The start position.
 * @param isKey - Whether the string is a key.
 *
 * @returns The parsed value and the end position.
 */
export const parseString = (
  str: string,
  startPos: number,
  isKey = false,
): { value: string; endPos: number } | null => {
  if (str[startPos] !== '"') return null;

  let pos = startPos + 1;
  let value = "";
  let escaped = false;
  // Track depth of { } for embedded JSON.
  let braceDepth = 0;

  while (pos < str.length) {
    const char = str[pos];

    if (escaped) {
      // Handle escape sequences.
      switch (char) {
        case '"':
        case "\\":
        case "/":
          value += char;
          break;
        case "b":
          value += "\b";
          break;
        case "f":
          value += "\f";
          break;
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        case "u":
          // Unicode escape - need 4 hex digits.
          if (pos + 4 < str.length) {
            const hex = str.substr(pos + 1, 4);
            value += String.fromCharCode(parseInt(hex, 16));
            pos += 4;
          }
          break;
        default:
          value += char;
      }
      escaped = false;
    } else {
      if (char === "\\") {
        escaped = true;
      } else if (char === "{") {
        value += char;
        braceDepth++;
      } else if (char === "}") {
        value += char;
        braceDepth--;
      } else if (char === '"') {
        // Found a quote - check if this is actually the closing quote
        // by looking at what comes after.s
        const nextPos = pos + 1;
        if (nextPos >= str.length) {
          // End of string - this is likely the closing quote.
          return { value, endPos: pos + 1 };
        }

        // Skip whitespace after the quote.
        let checkPos = nextPos;
        while (checkPos < str.length) {
          const checkChar = str[checkPos];
          if (!checkChar || !/\s/.test(checkChar)) break;
          checkPos++;
        }

        if (checkPos >= str.length) {
          // Only whitespace after quote - it's the closing quote.
          return { value, endPos: pos + 1 };
        }

        const nextChar = str[checkPos];
        if (!nextChar) {
          return { value, endPos: pos + 1 };
        }

        // For keys, closing quote should be followed by colon
        // For values, closing quote should be followed by comma, closing brace, or end.
        if (isKey) {
          if (nextChar === ":") {
            // This is the closing quote for a key
            return { value, endPos: pos + 1 };
          } else {
            // Not followed by colon, so keep reading (incomplete key).
            value += char;
          }
        } else {
          // Only consider this a closing quote if we're at brace depth 0
          // and it's followed by proper JSON structure.
          if (braceDepth === 0 && (nextChar === "," || nextChar === "}")) {
            // This is the closing quote
            return { value, endPos: pos + 1 };
          } else {
            // This quote is part of embedded content.
            // Continue treating it as content.
            value += char;
          }
        }
      } else {
        value += char;
      }
    }

    pos++;
  }

  // String not closed.
  return null;
};

/**
 * Extract partial string content (for incomplete strings).
 *
 * @param str - The string to parse.
 * @param startPos - The start position.
 *
 * @returns The partial string content.
 */
export const extractPartialString = (str: string, startPos: number): string | null => {
  if (str[startPos] !== '"') return null;

  let pos = startPos + 1;

  // If nothing after the opening quote, return null (not an empty string).
  if (pos >= str.length) {
    return null;
  }

  let value = "";

  // For incomplete strings, just extract everything remaining as-is
  // The string is incomplete, so there's no closing quote.
  while (pos < str.length) {
    value += str[pos];
    pos++;
  }

  return value;
};

/**
 *
 * @param str - The string to parse.
 * @param startPos - The start position.
 *
 * @returns The parsed value and the end position.
 */
export const parsePrimitive = (
  str: string,
  startPos: number,
): { value: boolean | null | number; endPos: number } | null => {
  let pos = startPos;
  let value = "";

  while (pos < str.length) {
    const char = str[pos];
    if (!char || /[,}\s]/.test(char)) break;
    value += char;
    pos++;
  }

  if (value === "true") return { value: true, endPos: pos };
  if (value === "false") return { value: false, endPos: pos };
  if (value === "null") return { value: null, endPos: pos };

  const num = Number(value);
  if (!Number.isNaN(num)) {
    return { value: num, endPos: pos };
  }

  return null;
};
