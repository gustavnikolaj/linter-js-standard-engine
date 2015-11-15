var spawn = require('child_process').spawn

module.exports = function getLinter (pathToLinter) {
  var linterProg = [
    'var buffer = [];',
    "process.stdin.on('data', function (chunk) { buffer.push(chunk); })",
    ".on('end', function () { ",
    "require('{pathToLinter}')",
    '.lintText(Buffer.concat(buffer).toString(),',
    'function (err, result) {',
    'if (err) { console.log("NOTJSON") } else {',
    'console.log(JSON.stringify(result))',
    '}',
    '})});'
  ].join('')

  return new Promise(function (resolve, reject) {
    try {
      resolve({
        lintText: function (fileContent, cb) {
          var linter = spawn('node', ['-e', linterProg.replace('{pathToLinter}', pathToLinter)])
          linter.on('error', function (err) {
            cb(err)
          })

          var stdout = []
          linter.stdout.on('data', function (chunk) {
            stdout.push(chunk)
          })

          linter.on('close', function () {
            var output = Buffer.concat(stdout).toString()
            var result

            try {
              result = JSON.parse(output)
            } catch (err) {
              console.log('ERROR:', err)
              console.log('when parsing:', output)
              return cb(err)
            }

            cb(null, result)
          })

          linter.stdin.setEncoding('utf-8')
          linter.stdin.write(fileContent)
          linter.stdin.end()
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
