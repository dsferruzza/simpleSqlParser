/*global test:true*/
"use strict";

var expect = require('chai').expect;
var h = require('./helpers.js');

var Update = [
	{
		c: 'Simple update',
		q: 'UPDATE table SET col = "value"',
		a: {
			type: 'update',
			table: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			where: null,
			values: [
				{ target: { expression: 'col', column: 'col' }, value: '"value"'},
			],
		},
	},
	{
		c: 'Several columns',
		q: 'UPDATE table SET col = "value", col2 = NULL, table.col3 = col',
		a: {
			type: 'update',
			table: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			where: null,
			values: [
				{ target: { expression: 'col', column: 'col' }, value: '"value"'},
				{ target: { expression: 'col2', column: 'col2' }, value: 'NULL'},
				{ target: { expression: 'table.col3', column: 'col3' }, value: 'col'},
			],
		},
	},
	{
		c: 'Where #1',
		q: 'UPDATE table SET col = "value" WHERE this >= that AND col IS NOT NULL',
		a: {
			type: 'update',
			table: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			where: {
				expression: "this >= that AND col IS NOT NULL",
			},
			values: [
				{ target: { expression: 'col', column: 'col' }, value: '"value"'},
			],
		},
	},
];

test('sql2ast - update', function() {
	Update.forEach(function(test) {
		h.testAst(test.c, test.q, test.a);
	});
});

test('ast2sql - update', function() {
	Update.forEach(function(test) {
		h.testBackAndForth(test.c, test.q);
	});
});
