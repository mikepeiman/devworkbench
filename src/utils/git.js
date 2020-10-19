const exec = require('child_process').exec

exec('git config --global user.name', (err, stdout, stderr) => console.log(stdout))