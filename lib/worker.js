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
    /* In standard-engine <6.0.0 the linter.lintText was async, but from
     * version 6.0.0 it changed to be sync. This callback is left in here to
     * handle the older versions of standard-engine based linters. We can
     * remove it in a later major version, if it becomes a liability.
     */
    const returnValue = linter.lintText(text, { filename, fix }, (err, { results } = {}) => {
      if (err) {
        process.send({
          error: cleanYamlObject(err),
          id
        })
      } else {
        process.send({
          id,
          results
        })
      }
    })

    if (returnValue) {
      const { results } = returnValue
      return process.send({
        id,
        results
      })
    }
  } catch (err) {
    process.send({
      error: cleanYamlObject(err),
      id
    })
  }
})
