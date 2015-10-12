if(!hljs){
  console.error("make sure to load highlightjs before the markdown processor");
}

var _ = require("lodash");
var moreMarkdown = require('more-markdown')
var mathjaxProcessor = require('@more-markdown/mathjax-processor')
var codeControls     = require('@more-markdown/code-controls')
var dotProcessor     = require('@more-markdown/dot-processor')
var testProcessor    = require('@more-markdown/test-processor')
var treeProcessor    = require('@more-markdown/tree-processor')
var testSuite      = require('@tutor/test-suite')
var graphTestSuite = require('@tutor/graph-test-suite')
var jsSandbox      = require('@tutor/javascript-sandbox')
var jailedSandbox  = require('@tutor/jailed-sandbox')
var browserDebug   = require('@tutor/browser-debug-js')

var createPreview = function(id, config) {
  return moreMarkdown.create(id, {
    processors: [
      mathjaxProcessor,
      codeControls("js", {
        run: jailedSandbox.run,
        debug: _.partial(jailedSandbox.debug, _, {}, {
          timeout: config.debugTimeout
        })
      }, config.codeControls.template),
      dotProcessor("dot",
        config.dotProcessor.baseSVGTemplate,
        config.dotProcessor.errorTemplate),
      testProcessor(["test", "tests"], {
        tests: [
          testSuite.itTests({
            registerTest: config.testProcessor.register,
            testResult: config.testProcessor.testResult,
            allResults: config.testProcessor.testsFinished
          }), testSuite.jsTests, graphTestSuite.collectGraphs, graphTestSuite.graphApi, testSuite.debugLog
        ],
        runner: {
          run: _.partial(jailedSandbox.run, _, _, {
            timeout: config.runTimeout
          }),
          debug: _.partial(jailedSandbox.debug, _, _, {
            timeout: config.debugTimeout
          })
        },
        templates: {
          tests: config.testProcessor.template
        }
      })
    ],
    html: false,
    highlight: function(code, lang) {
      var error1;
      try {
        if ((lang != null) && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      } catch (error1) {
        return '';
      }
    }
  });
};

module.exports = function(config){
  return function(id){
    return createPreview(id, config);
  }
}
