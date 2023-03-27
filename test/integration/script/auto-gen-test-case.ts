//
// /*
//   Usage: ts-node ./test/integration/script/auto-gen-test-case.ts Template.yml
//  */
// import * as path from "path";
// import * as fs from "fs";
// import YAML from "js-yaml";
// import prompt from "prompt";
// async function processFile(filename: string,){
//     const content = fs.readFileSync(
//         path.join(
//             __dirname,
//             "../yaml",
//             filename + (/\.yml|.yaml/.test(filename) ? "" : ".yml")
//         )
//     );
//     let cases = (content.toString().match(/#.*/g)|| []).filter(
//         v => /#(.*)case/.test(v)
//     )
//     const docs = YAML.loadAll(content)
//     const outFile = path.join(__dirname, '../', filename + '.test.ts')
//     if(fs.existsSync(outFile)){
//         console.log("The test file already exist. Do you want to overwrite it?")
//         console.log("Type 'ok' to overwrite");
//         const {ok} = await prompt.get(['ok'])
//         if(ok != 'ok')
//             return console.log(`File exist. Stop! Check manually.`)
//     }
//     let testScript = `
//
//   `;
//     let index = 0
//     testScript += `
// // @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts
//
// import { deployAndCreateHelper, TestFutureHelper } from "./utils";
//
// describe("${filename}", async function(){
//   let testHelper: TestFutureHelper
//
//   beforeEach(async () => {
//     testHelper = await deployAndCreateHelper()
//   })
//
//   `
//     for(const doc of docs){
//         index ++
//         testScript += `
//     it("test case #${cases[index - 1]}. File index ${index}", async function() {
//       return testHelper.process(\`
// ${YAML.dump(doc)}
//       \`)
//     })
//     `
//     }
//     testScript += `})`
//     // testScript = testScript.replace(/null/g, 'ChangePrice')
//     fs.writeFileSync(outFile, testScript)
//     console.log("Done!!");
//
// }
// async function main() {
//     const filename = process.argv[2]
//     console.log(filename);
//     if(filename === 'all'){
//         const files = fs.readdirSync(path.join(__dirname, '../yaml'))
//         for(const filename of files)
//             await processFile(filename.replace('.yml','').replace('.yaml', ''))
//     }else{
//         await processFile(filename)
//     }
// }
//
// main().then(r => {})
