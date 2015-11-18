/*global test:true,suite:true*/
"use strict";

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
				position: { start: 37, end: 69 },
			},
			values: [
				{ target: { expression: 'col', column: 'col' }, value: '"value"'},
			],
		},
	},
];

suite('sql2ast - update');

Update.forEach(function(item) {
	test(item.c, function() {
		h.testAst(item.c, item.q, item.a);
	});
});

suite('ast2sql - update');

Update.forEach(function(item) {
	test(item.c, function() {
		h.testBackAndForth(item.c, item.q);
	});
});
