// const exec = require('child_process').exec

// exec('node .', (err, stdout, stderr) => console.log(stdout))

const exec = require('child_process').exec

let runner = () => {
  exec('notepad.exe', (err, stdout, stderr) => console.log(stdout))
}
export default runner