 let runCmd = (cmd, args) => {
    return new Promise((resolve, reject) => {
      var spawn = require('child_process').spawn
      var child = spawn(cmd, args)
      var resp = ''
      child.stdout.on('data', function (buffer) { resp += buffer.toString() })
      child.stdout.on('end', function () { resolve(resp) })
    })
  }

  export default runCmd('ls').then(ret => console.log(ret))