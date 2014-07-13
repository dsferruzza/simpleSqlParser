"use strict";

var expect = require('chai').expect;
var m = require('../index');

function ok(ast) {
	return {
		status: true,
		value: ast
	};
}

function testAst(comment, query, ast) {
	expect(m.sql2ast(query)).to.eql(ok(ast), comment + ': ' + query);
}

function testBackAndForth(comment, query) {
	expect(m.ast2sql(m.sql2ast(query))).to.eql(query, comment + ': ' + query);
}

function isArray(variable, message) {
	expect(variable).to.be.instanceOf(Array, message);
}

function isObject(variable, message) {
	expect(variable).not.to.be.instanceOf(Array, message);
}

module.exports = {
	ok: ok,
	testAst: testAst,
	testBackAndForth: testBackAndForth,
	isArray: isArray,
	isObject: isObject,
};
