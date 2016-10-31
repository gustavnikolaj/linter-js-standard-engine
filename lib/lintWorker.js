var linterName = process.argv[2]
var linter = require(linterName)

process.on('message', function (data) {
  linter.lintText(data.source, function (err, result) {
    process.send({
      id: data.id,
      source: data.source,
      result: result || null,
      err: err
    })
  })
})
