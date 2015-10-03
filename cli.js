#! /usr/local/bin/node

var fs = require('fs')
var converter = require('./lib/converter')
var commander = require('commander')

var program = require('commander')

program
.version('1.0.0')
.option('-i, --input [path]', 'Input file')
.option('-o, --output [path]', 'Output file')
.parse(process.argv)

if (!program.input) throw 'Please enter an input file.'
if (!program.output) throw 'Please enter an output path.'

try {
    converter.exec(fs.readFileSync(program.input, 'utf-8'), (err, string) => {
        fs.writeFileSync(program.output, string)
    })
} catch (e) {
    throw e
}