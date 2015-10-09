if(!hljs){
  console.error("make sure to load highlightjs before the markdown processor");
}

var moreMarkdown = require('more-markdown')
var mathjaxProcessor = require('@more-markdown/mathjax-processor')
var codeControls     = require('@more-markdown/code-controls')
var dotProcessor     = require('@more-markdown/dot-processor')
var testProcessor    = require('@more-markdown/test-processor')

var createPreview = function(id, config) {
  return moreMarkdown.create(id, {
    processors: [
      mathjaxProcessor, codeControls("js", {
        run: jailedSandbox.run,
        debug: _.partial(jailedSandbox.debug, _, {}, {
          timeout: 1 * 60 * 1000
        })
      }, _.template(fs.readFileSync(__dirname + "/js_controls.html", "utf8"))), dotProcessor("dot", _.template("<svg data-element-id=\"<%= id %>\"><g/></svg>"), _.template("<p style='background-color:red'><%= error %></p>")), testProcessor(["test", "tests"], {
        tests: [
          testSuite.itTests({
            registerTest: (function(name, elem) {
              return elem.innerHTML += "<li>" + name + "</li>";
            }),
            testResult: (function(status, index, elem) {
              if (status === null) {
                return elem.children[index].innerHTML += " <span style='color:green'>Success</span>";
              } else {
                return elem.children[index].innerHTML += " <span style='color:red'>Failed (" + status.exception + ")</span>";
              }
            }),
            allResults: (function(error, passed, failed) {
              return console.log("passed " + passed + ", failed " + failed + " (error: " + error + ")");
            })
          }), testSuite.jsTests, graphTestSuite.collectGraphs, graphTestSuite.graphApi, testSuite.debugLog
        ],
        runner: {
          run: _.partial(jailedSandbox.run, _, _, {
            timeout: 1 * 60 * 1000
          }),
          debug: _.partial(jailedSandbox.debug, _, _, {
            timeout: 1 * 60 * 1000
          })
        },
        templates: {
          tests: _.template("<h1>Tests</h1><ul data-element-id=\"<%= id %>\"></ul>")
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
    createPreview(id, config);
  }
}
