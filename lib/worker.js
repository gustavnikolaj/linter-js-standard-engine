const cleanYamlObject = require('clean-yaml-object')
const resolveCwd = require('resolve-cwd')

const linterName = process.argv[2]
let linter, loadFailure
{
  const linterPath = resolveCwd(linterName)
  if (linterPath) {
    try {
      linter = require(linterPath)
    } catch (err) {
      loadFailure = {
        error: cleanYamlObject(err)
      }
    }
  } else {
    loadFailure = {
      results: [
        {
          messages: [
            {
              message: `Could not load linter "${linterName}"`,
              fatal: true
            }
          ]
        }
      ]
    }
  }
}

process.on('message', ({ filename, fix, id, text }) => {
  if (loadFailure) {
    process.send(Object.assign({ id }, loadFailure))
    return
  }

  try {
    if (linter.lintTextSync) {
      const { results } = linter.lintTextSync(text, { filename, fix })
      process.send({ id, results })
    } else {
      linter.lintText(text, { filename, fix }, (err, { results } = {}) => {
        if (err) {
          process.send({
            error: cleanYamlObject(err),
            id
          })
        } else {
          process.send({ id, results })
        }
      })
    }
  } catch (err) {
    process.send({
      error: cleanYamlObject(err),
      id
    })
  }
})
