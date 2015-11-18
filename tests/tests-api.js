/*global test:true,suite:true*/
'use strict';

var expect = require('chai').expect;
var m = require('../index');
var h = require('./helpers.js');

suite('sql2ast - API');

var q = [
	'SELECT * FROM table',
	'INSERT INTO table VALUES (1, 2, 3)',
	'UPDATE table SET col = "value"',
	'DELETE FROM table',
];
var ast = q.map(m.sql2ast);

var types = ['select', 'delete', 'insert', 'update'];

ast.forEach(function(a) {
	test('A basic query should parse', function() {
		expect(a.status).to.equal(true, 'Parser must parse valid SQL');
		expect(types.indexOf(a.value.type)).not.to.equal(-1, 'AST must contain a valid type');
	});

	if (a.value.type === types[0]) {
		test('SELECT AST is cool', function() {
			h.isArray(a.value.select, "(SELECT) AST must contain a 'select' array");
			h.isArray(a.value.from, "(SELECT) AST must contain a 'from' array");
			h.isArray(a.value.join, "(SELECT) AST must contain a 'join' array");
			h.isObject(a.value.where, "(SELECT) AST must contain a 'where' object");
			h.isArray(a.value.group, "(SELECT) AST must contain a 'group' array");
			h.isArray(a.value.order, "(SELECT) AST must contain a 'order' array");
			h.isObject(a.value.limit, "(SELECT) AST must contain a 'limit' object");
		});
	}
	else if (a.value.type === types[1]) {
		test('DELETE AST is cool', function() {
			h.isArray(a.value.from, "(DELETE) AST must contain a 'from' array");
			h.isObject(a.value.where, "(DELETE) AST must contain a 'where' object");
		});
	}
	else if (a.value.type === types[2]) {
		test('INSERT AST is cool', function() {
			h.isObject(a.value.into, "(INSERT) AST must contain a 'into' object");
			h.isArray(a.value.values, "(INSERT) AST must contain a 'values' array");
		});
	}
	else if (a.value.type === types[3]) {
		test('UPDATE AST is cool', function() {
			h.isObject(a.value.table, "(UPDATE) AST must contain a 'table' object");
			h.isArray(a.value.values, "(UPDATE) AST must contain a 'values' array");
			h.isObject(a.value.where, "(UPDATE) AST must contain a 'where' object");
		});
	}
});
