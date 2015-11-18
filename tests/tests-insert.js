/*global test:true,suite:true*/
"use strict";

var h = require('./helpers.js');

var Insert = [
	{
		c: 'Simple insert',
		q: 'INSERT INTO table VALUES (1, 2, 3)',
		a: {
			type: 'insert',
			into: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			values: [
				{ target: null, value: '1'},
				{ target: null, value: '2'},
				{ target: null, value: '3'},
			],
		},
	},
	{
		c: 'Complex values',
		q: 'INSERT INTO table VALUES (1 + 9, FUNC(2, col), "string")',
		a: {
			type: 'insert',
			into: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			values: [
				{ target: null, value: '1 + 9'},
				{ target: null, value: 'FUNC(2, col)'},
				{ target: null, value: '"string"'},
			],
		},
	},
	{
		c: 'Insert with columns',
		q: 'INSERT INTO table (col1, `col2`, col3) VALUES (1, 2, 3)',
		a: {
			type: 'insert',
			into: {
				expression: 'table',
				table: 'table',
				alias: null,
			},
			values: [
				{ target: { expression: 'col1', column: 'col1' }, value: '1'},
				{ target: { expression: '`col2`', column: 'col2' }, value: '2'},
				{ target: { expression: 'col3', column: 'col3' }, value: '3'},
			],
		},
	},
];

suite('sql2ast - insert');

Insert.forEach(function(item) {
	test(item.c, function() {
		h.testAst(item.c, item.q, item.a);
	});
});

suite('ast2sql - insert');

Insert.forEach(function(item) {
	test(item.c, function() {
		h.testBackAndForth(item.c, item.q);
	});
});
