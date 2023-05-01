const lineRe = /^([^|]+)\| (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] (.+)$/;

function parseLog({content}) {
  const lines = content.split('\n');
  return lines.reduce((newLines, line, i) => {
    const match = line.match(lineRe);
    const lastLine = newLines[newLines.length - 1];
    if (match) {
      const [_, name, ts, level, payload] = match;
      // console.log(i, payload)
      const tsDiff = lastLine ? new Date(ts) - new Date(lastLine.ts) : 0;
      const tsElapsed = newLines[0] ? new Date(ts) - new Date(newLines[0].ts) : 0;
      newLines.push({name, tsDiff, tsElapsed, ts, level, payload});
    } else if (lastLine) {
      if (lastLine.currObj) {
        if (line.startsWith('}') || line.startsWith(']')) {
          const str = lastLine.currObj.str + line.charAt(0);
          const obj = new Function(`return ${str}`)();
          lastLine.data = lastLine.data ?? {};
          lastLine.data[lastLine.currObj.key] = obj;
          lastLine.currObj = null;
          if (line.trim().length > 1) {
            lastLine.payload += line.slice(1);
          }
        } else {
          lastLine.currObj.str += line.trim();
        }
      } else if (lastLine.payload.endsWith('{') || lastLine.payload.endsWith('[')) {
        const [_, key, char] = lastLine.payload.match(/(\w+)\s+([{[])$/);
        lastLine.payload = lastLine.payload.replace(/[[{]$/, `%${key}%`);
        lastLine.currObj = {key, str: char + line.trim()};
      } else {
        lastLine.payload += line.trim();
      }
    }
    return newLines;
  }, []);
}

module.exports = {parseLog};

/*****************

const fs = require('fs')
const {parseLog} = require('./parse-log')

const filepath = process.argv[2]
console.log('processing', filepath)

const content = fs.readFileSync(filepath).toString().replace(/(<Buffer .+>)/g, "'$1'")
const parsedLines = parseLog({content})

console.log(parsedLines.map(({payload}, i) => `${i} ${payload}`).join('\n'))

const parsedLog = parsedLines.map(({name, ts, tsElapsed, tsDiff, level, payload, data}) => `${name.padEnd(12)} | ${String(`+${tsElapsed}ms`).padStart(10)} | ${payload}${data ? ` | ${JSON.stringify(data)}` : ''}`).join('\n')

fs.writeFileSync(filepath.replace('.log', '.parsed.log'), parsedLog)

*******************/
