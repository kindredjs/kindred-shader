const format = require('kindred-shader-formatter')
const staticModule = require('static-module')
const isRequire = require('is-require')()
const combine = require('stream-combiner')
const through = require('through2')
const glslify = require('glslify')
const shortid = require('shortid')
const falafel = require('falafel')
const xtend = require('xtend')
const path = require('path')

const parseOptions = {
  ecmaVersion: 6,
  sourceType: 'module',
  allowReserved: true,
  allowReturnOutsideFunction: true,
  allowHashBang: true
}

module.exports = transform

function transform (filename, opts) {
  return combine(
    templateTransform(filename, opts),
    fileTransform(filename, opts)
  )
}

function templateTransform (filename, transformOpts) {
  var stream = through(write, flush)
  var cwd = path.dirname(filename)
  var buffer = []

  return stream

  function write (chunk, _, next) {
    buffer.push(chunk)
    next()
  }

  function flush () {
    var src = buffer.join('')
    var requires = []
    var queue = 0

    if (src.indexOf('kindred-shader') === -1) {
      this.push(src)
      this.push(null)
      return
    }

    try {
      src = falafel(src, parseOptions, function (node) {
        scrapeRequires(node)
        scrapeTemplates(node)
      })
    } catch (e) {
      return stream.emit('error', e)
    }

    checkQueue()

    function scrapeRequires (node) {
      if (!isRequire(node)) return

      var args = node.arguments
      if (args.length < 1) return

      var target = args[0]
      if (target.type !== 'Literal') return

      var value = target.value
      if (value !== 'kindred-shader') return
      if (node.parent.type !== 'VariableDeclarator') return
      if (node.parent.id.type !== 'Identifier') return

      var varName = node.parent.id.name
      requires.push(varName)
    }

    function scrapeTemplates (node) {
      if (node.type !== 'TaggedTemplateExpression') return
      if (node.tag.type !== 'Identifier') return
      if (requires.indexOf(node.tag.name) === -1) return

      var textBits = node.quasi.quasis
      var expressions = node.quasi.expressions
      var replaceMap = []
      var combined = []

      for (var i = 0; i + 1 < textBits.length; i++) {
        var mapping = '_' + shortid.generate()
        var expr = expressions[i].source().trim()
        replaceMap[expr] = replaceMap[expr] || mapping
        combined.push(textBits[i].source())
        combined.push(mapping)
      }

      combined.push(textBits[textBits.length - 1].source())
      combined = combined.join('')
      queue++

      glslify.bundle(combined, {
        basedir: cwd,
        inline: true
      }, function (err, source) {
        if (err) return stream.emit('error', err)

        var jsReplacement = splitAndFormat(source, replaceMap)
        node.update(jsReplacement)
        checkQueue(queue--)
      }).on('file', function (file) {
        stream.emit('file', file)
      })
    }

    function checkQueue () {
      if (queue) return

      stream.push(src.toString())
      stream.push(null)
    }
  }
}

function fileTransform (filename, transformOpts) {
  var cwd = path.dirname(filename)
  var stream = staticModule({
    'kindred-shader': {
      file: replaceStream,
      raw: function (vert, frag) {
        var prefix = '(require("kindred-shader/raw")('
        var args = [JSON.stringify(vert), JSON.stringify(frag)]
        return prefix + args.join(',') + '))'
      }
    }
  }, {
    vars: {
      __dirname: cwd,
      __filename: filename
    },
    varModules: {
      path: path
    }
  })

  return stream

  function replaceStream (glslFile, opts) {
    var replacer = through()

    opts = xtend({
      basedir: cwd
    }, transformOpts || {}, opts || {})

    glslify.bundle(glslFile, opts, function (err, bundled) {
      if (err) return stream.emit('error', err)

      var jsReplacement = splitAndFormat(bundled)
      replacer.push(jsReplacement)
      replacer.push(null)
    }).on('file', function (file) {
      stream.emit('file', file)
    })

    return replacer
  }
}

function splitAndFormat (source, replaceMap) {
  var vert = JSON.stringify(format.vert(source))
  var frag = JSON.stringify(format.frag(source))
  var bundled = ''

  if (replaceMap) {
    Object.keys(replaceMap).forEach(function (value) {
      var key = replaceMap[value]

      vert = vert.replace(new RegExp(key, 'g'), '"+(' + value + ')+"')
      frag = frag.replace(new RegExp(key, 'g'), '"+(' + value + ')+"')
    })
  }

  bundled += 'require("kindred-shader/raw")('
  bundled += vert
  bundled += ','
  bundled += frag
  bundled += ')'

  return bundled
}
