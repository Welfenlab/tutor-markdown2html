if (!hljs) {
  console.error('make sure to load highlightjs before the markdown processor')
}

var _ = require('lodash')
var moreMarkdown = require('more-markdown')

var createPreview = function (id, config) {
  var processors = []
  if (config.mathjax !== false) { // note that undefined !== false
    var mathjaxProcessor = require('@more-markdown/mathjax-processor')
    processors.push(mathjaxProcessor)
  }

  if (config.codeControls) {
    var codeControls = require('@more-markdown/code-controls')

    processors.push(codeControls('js', {
      run: function () {
        var jailedSandbox = require('@tutor/jailed-sandbox')
        return jailedSandbox.run.apply(undefined, arguments)
      },
      debug: function () {
        var jailedSandbox = require('@tutor/jailed-sandbox')
        return _.partial(jailedSandbox.debug, _, {}, {
          timeout: config.debugTimeout
        }).apply(undefined, arguments)
      }
    }, config.codeControls.template))
  }

  if (config.dotProcessor) {
    var dotProcessor = require('@more-markdown/dot-processor')

    processors.push(dotProcessor('dot',
      config.dotProcessor.baseSVGTemplate,
      config.dotProcessor.errorTemplate)
    )
  }

  if (config.testProcessor) {
    var testProcessor = require('@more-markdown/test-processor')
    var graphTestSuite = require('@tutor/graph-test-suite')
    var testSuite = require('@tutor/test-suite')

    processors.push(testProcessor(['test', 'tests'], {
      tests: [
        testSuite.itTests({
          registerTest: config.testProcessor.register,
          testResult: config.testProcessor.testResult,
          allResults: config.testProcessor.testsFinished
        }), testSuite.jsTests, graphTestSuite.collectGraphs, graphTestSuite.graphApi, testSuite.debugLog
      ],
      testProcessor: {
        init: config.testProcessor.init
      },
      runner: {
        run: function () {
          var jailedSandbox = require('@tutor/jailed-sandbox')
          return _.partial(jailedSandbox.run, _, _, {
            timeout: config.runTimeout
          }).apply(undefined, arguments)
        },
        debug: function () {
          var jailedSandbox = require('@tutor/jailed-sandbox')
          return _.partial(jailedSandbox.debug, _, _, {
            timeout: config.debugTimeout
          }).apply(undefined, arguments)
        }
      },
      templates: {
        tests: config.testProcessor.template
      }
    }))
  }

  if (config.treeProcessor !== false && config.treeProcessor !== undefined) {
    processors.push(require('@more-markdown/tree-processor')('tree',
      config.treeProcessor.baseSVGTemplate,
      config.treeProcessor.errorTemplate))
  }

  if (config.graphProcessor !== false && config.graphProcessor !== undefined) {
    processors.push(require('@more-markdown/graph-chart-processor')('chart',
      config.graphProcessor.baseSVGTemplate,
      config.graphProcessor.errorTemplate))
  }

  return moreMarkdown.create(id, {
    processors: processors,
    html: false,
    highlight: function (code, lang) {
      var error1
      try {
        if ((lang != null) && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value
        } else {
          return hljs.highlightAuto(code).value
        }
      } catch (error1) {
        return ''
      }
    }
  })
}

module.exports = function (config) {
  return function (id) {
    return createPreview(id, config)
  }
}
