/*global test:true,suite:true*/
"use strict";

var expect = require('chai').expect;
var h = require('./helpers.js');

var Delete = [
	{
		c: 'Simple delete',
		q: 'DELETE FROM table',
		a: {
			type: 'delete',
			from: [
				{ expression: 'table', table: 'table', alias: null },
			],
			where: null,
		},
	},
	{
		c: 'Several tables with aliases',
		q: 'DELETE FROM table1 AS t1, table2 "t2"',
		a: {
			type: 'delete',
			from: [
				{ expression: 'table1 AS t1', table: 'table1', alias: 't1' },
				{ expression: 'table2 "t2"', table: 'table2', alias: 't2' },
			],
			where: null,
		},
	},
	{
		c: 'Where #1',
		q: 'DELETE FROM table WHERE this >= that AND col IS NOT NULL',
		a: {
			type: 'delete',
			from: [
				{ expression: 'table', table: 'table', alias: null },
			],
			where: {
				expression: "this >= that AND col IS NOT NULL",
			},
		},
	},
	{
		c: 'Where #2',
		q: 'DELETE FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)',
		a: {
			type: 'delete',
			from: [
				{ expression: 'table', table: 'table', alias: null },
			],
			where: {
				expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
			},
		},
	},
];

suite('sql2ast - delete');

Delete.forEach(function(item) {
	test(item.c, function() {
		h.testAst(item.c, item.q, item.a);
	});
});

suite('ast2sql - delete');

Delete.forEach(function(item) {
	test(item.c, function() {
		h.testBackAndForth(item.c, item.q);
	});
});
