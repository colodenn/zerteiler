# 🧱 Zerteiler: A simple JSON parser for handling incomplete JSON strings from LLM tool calls

⚠️ The library is yet only experimental and might change over time.

## 📖 Usage

```ts
import { parse } from 'zerteiler';
import { z } from "zod";

const schema = z.object({
  path: z.string(),
  content: z.string(),
});

const invalidJsonString = `{\"path\": \"// This is a comment \nconst content = {"test": "value"} `;

const validJSON = parse(invalidJsonString, schema)
console.log(validJSON)
```

#### Output:

```json
{ path: `// This is a comment \nconst content = {"test": "value"} `, content: null}
```

## 📚 Installation

`npm install zerteiler`

## 📝 License
This project is licensed under the terms of the MIT license. See the [LICENSE](https://github.com/colodenn/zerteiler/blob/main/LICENSE) file for details.