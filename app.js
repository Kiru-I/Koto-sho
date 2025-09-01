import fs from "fs";
import path from "path";

async function translateJPtoEN(text) {
    try {
        const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const results = data.data.map((entry, index) => {
                const japaneseArray = entry.japanese.map((j, i, arr) => {
                    const space = i === arr.length - 1 ? " " : "";
                    return `{"word": "${j.word || ''}","reading": "${j.reading || ''}"${space}}`;
                }).join(",\n  ");

                return {
                    entry: index + 1,
                    jlpt: entry.jlpt || [],
                    japaneseArrayString: japaneseArray,
                    english_definitions: entry.senses.flatMap(s => s.english_definitions)
                };
            });

            const folder = "cards";
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);

            const safeText = text.replace(/[^a-zA-Z0-9_-]/g, "_");
            const filename = path.join(folder, `${safeText}.json`);

            let finalJson = "[\n";
            results.forEach((r, idx) => {
                finalJson += `  {\n    "entry": ${r.entry},\n    "jlpt": ${JSON.stringify(r.jlpt)},\n    "japanese": [\n  ${r.japaneseArrayString}\n    ],\n    "english_definitions": ${JSON.stringify(r.english_definitions)}\n  }`;
                finalJson += idx < results.length - 1 ? ",\n" : "\n";
            });
            finalJson += "]";

            fs.writeFileSync(filename, finalJson, "utf8");
            console.log(`Results saved to ${filename}`);
        } else {
            console.log("No results found.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

const text = process.argv.slice(2).join(" ");
if (!text) console.log("Please provide Japanese text to look up!");
else translateJPtoEN(text);
