var spawn           = require('child_process').spawn
  , path            = require('path')
  , Stream          = require('stream').Stream

  , defaultFormat   = 'html'
  , defaultLang     = 'js'
  , defaultEncoding = 'utf8'

  , fromString = function(exec, code, callback) {
      var stdout = []
        , stderr = ''

      exec.stdout.on('data', function(data) {
        stdout.push(data)
      })

      exec.stderr.on('data', function (data) {
        stderr += data.toString()
      })

      exec.on('exit', function (code) {
        if (code !== 0) return callback('Error: ' + stderr)

        var buf = new Buffer(stdout.reduce(function (p, c) { return p + c.length }, 0))
          , i = 0

        stdout.forEach(function(s) {
          s.copy(buf, i, 0, s.length)
          i += s.length
        })

        callback(null, buf)
      })

      exec.stdin.write(code)
      exec.stdin.end()
    }

  , fromStream = function(exec) {
      var stream = new Stream()
        , stderr = ''

      stream.writable = true
      stream.readable = true

      exec.stdout.on('data', function(data) {
        stream.emit('data', data)
      })

      exec.stderr.on('data', function (data) {
        stderr += data.toString()
      })

      exec.on('exit', function (code) {
        if (code !== 0) {
          stream.emit('error', stderr)
        } else {
          stream.emit('end')
        }
      })

      stream.write = function(data) {
        exec.stdin.write(data)
      }

      stream.end = function() {
        exec.stdin.end()
      }

      stream.destroy = function() {
        stream.emit("close")
      }

      return stream
    }

  , pygmentize = function (options, code, callback) {
      options = options || {}

      var execArgs = options.args || [];
      if (execArgs.indexOf("-f") == -1) { execArgs.push('-f'); execArgs.push(options.format || defaultFormat) }
      if (execArgs.indexOf("-l") == -1) { execArgs.push('-l'); execArgs.push(options.lang || defaultLang) }
      if (execArgs.indexOf("-P") == -1) { execArgs.push('-P'); execArgs.push('encoding=' + (options.encoding || defaultEncoding)) }

      var exec = spawn(path.join(__dirname, 'vendor/pygments/pygmentize'), execArgs)

      return typeof code == 'string' && typeof callback == 'function'
        ? fromString(exec, code, callback)
        : fromStream(exec)
    }

module.exports = pygmentize