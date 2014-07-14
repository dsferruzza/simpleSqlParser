/*global test:true,suite:true*/
"use strict";

var expect = require('chai').expect;
var h = require('./helpers.js');

var Select = [
	{
		c: 'Simple select',
		q: 'SELECT * FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Column quotes',
		q: 'SELECT col1, `col2` FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'col1', column: 'col1', table: null, alias: null, position: { start: 7, end: 11 } },
				{ expression: '`col2`', column: 'col2', table: null, alias: null, position: { start: 13, end: 19 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 25, end: 30 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Special words',
		q: 'SELECT fromage "from", asymetric AS as FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'fromage "from"', column: 'fromage', table: null, alias: 'from', position: { start: 7, end: 21 } },
				{ expression: 'asymetric AS as', column: 'asymetric', table: null, alias: 'as', position: { start: 23, end: 38 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 44, end: 49 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: '"table.column" notation',
		q: 'SELECT table.col1, table.`col2`, `table`.col3, `table`.`col4` FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'table.col1', column: 'col1', table: 'table', alias: null, position: { start: 7, end: 17 } },
				{ expression: 'table.`col2`', column: 'col2', table: 'table', alias: null, position: { start: 19, end: 31 } },
				{ expression: '`table`.col3', column: 'col3', table: 'table', alias: null, position: { start: 33, end: 45 } },
				{ expression: '`table`.`col4`', column: 'col4', table: 'table', alias: null, position: { start: 47, end: 61 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 67, end: 72 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Strings',
		q: 'SELECT "string", "\\"special\\" string" FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: '"string"', column: null, table: null, alias: null, position: { start: 7, end: 15 } },
				{ expression: '"\\"special\\" string"', column: null, table: null, alias: null, position: { start: 17, end: 37 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 43, end: 48 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Column alias #1',
		q: 'SELECT col1 AS alias, col2 AS "alias" FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'col1 AS alias', column: 'col1', table: null, alias: 'alias', position: { start: 7, end: 20 } },
				{ expression: 'col2 AS "alias"', column: 'col2', table: null, alias: 'alias', position: { start: 22, end: 37 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 43, end: 48 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Column alias #2',
		q: 'SELECT col1 alias, col2 "alias" FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'col1 alias', column: 'col1', table: null, alias: 'alias', position: { start: 7, end: 17 } },
				{ expression: 'col2 "alias"', column: 'col2', table: null, alias: 'alias', position: { start: 19, end: 31 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 37, end: 42 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Mathematical expressions',
		q: 'SELECT 1 + 1, col1*0.7 AS test FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: '1 + 1', column: null, table: null, alias: null, position: { start: 7, end: 12 } },
				{ expression: 'col1*0.7 AS test', column: null, table: null, alias: 'test', position: { start: 14, end: 30 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 36, end: 41 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Functions',
		q: 'SELECT FUNC(), OTHERFUN(col, FUNC(1/4, -3.05), "string") FROM table',
		a: {
			type: 'select',
			select: [
				{ expression: 'FUNC()', column: null, table: null, alias: null, position: { start: 7, end: 13 } },
				{ expression: 'OTHERFUN(col, FUNC(1/4, -3.05), "string")', column: null, table: null, alias: null, position: { start: 15, end: 56 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 62, end: 67 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Table alias',
		q: 'SELECT * FROM table AS t, table2 AS "t2"',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table AS t', table: 'table', alias: 't', position: { start: 14, end: 24 } },
				{ expression: 'table2 AS "t2"', table: 'table2', alias: 't2', position: { start: 26, end: 40 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Simple inner join',
		q: 'SELECT * FROM table INNER JOIN table2 ON table2.id = id_table2',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [
				{ type: 'inner', table: 'table2', alias: null, position: { start: 31, end: 37 }, condition: { expression: 'table2.id = id_table2', position: { start: 41, end: 62 } } },
			],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Several joins',
		q: 'SELECT * FROM table INNER JOIN t1 ON t1.id = id_table2 AND t1.bool LEFT JOIN t2 ON t2.id = t1.id_t2 RIGHT JOIN t3 AS table3 ON t3.id = FUNC(t1.stuff)',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [
				{ type: 'inner', table: 't1', alias: null, position: { start: 31, end: 33 }, condition: { expression: 't1.id = id_table2 AND t1.bool', position: { start: 37, end: 66 } } },
				{ type: 'left', table: 't2', alias: null, position: { start: 77, end: 79 }, condition: { expression: 't2.id = t1.id_t2', position: { start: 83, end: 99 } } },
				{ type: 'right', table: 't3', alias: 'table3', position: { start: 111, end: 123 }, condition: { expression: 't3.id = FUNC(t1.stuff)', position: { start: 127, end: 149 } } },
			],
			where: null,
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Where #1',
		q: 'SELECT * FROM table WHERE this >= that AND col IS NOT NULL',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: {
				expression: "this >= that AND col IS NOT NULL",
				position: { start: 26, end: 58 },
			},
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Where #2',
		q: 'SELECT * FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: {
				expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
				position: { start: 26, end: 67 },
			},
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Where #3',
		q: 'SELECT * FROM table WHERE column IN ("val1", "val2")',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: {
				expression: "column IN (\"val1\", \"val2\")",
				position: { start: 26, end: 52 },
			},
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Where #3 with spaces',
		q: 'SELECT * FROM table WHERE column IN ( "val1", "val2" )',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: {
				expression: "column IN ( \"val1\", \"val2\" )",
				position: { start: 26, end: 54 },
			},
			group: [],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Group by',
		q: 'SELECT * FROM table GROUP BY col1, MONTH(col2), table.col3',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: null,
			group: [
				{ expression: 'col1', table: null, column: 'col1' },
				{ expression: 'MONTH(col2)', table: null, column: null },
				{ expression: 'table.col3', table: 'table', column: 'col3' },
			],
			order: [],
			limit: null,
		},
	},
	{
		c: 'Order by',
		q: 'SELECT * FROM table ORDER BY table.col1, col2 DESC, FUNC(col3 + 7) ASC',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: null,
			group: [],
			order: [
				{ expression: "table.col1", table: "table", column: "col1", order: "ASC" },
				{ expression: "col2 DESC", table: null, column: "col2", order: "DESC" },
				{ expression: "FUNC(col3 + 7) ASC", table: null, column: null, order: "ASC" },
			],
			limit: null,
		},
	},
	{
		c: 'Limit #1',
		q: 'SELECT * FROM table LIMIT 5',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: { from: null, nb: 5 },
		},
	},
	{
		c: 'Limit #2',
		q: 'SELECT * FROM table LIMIT 1, 2',
		a: {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null, position: { start: 7, end: 8 } },
			],
			from: [
				{ expression: 'table', table: 'table', alias: null, position: { start: 14, end: 19 } },
			],
			join: [],
			where: null,
			group: [],
			order: [],
			limit: { from: 1, nb: 2 },
		},
	},
];

suite('sql2ast - select');

Select.forEach(function(item) {
	test(item.c, function() {
		h.testAst(item.c, item.q, item.a);
	});
});

suite('ast2sql - select');

Select.forEach(function(item) {
	test(item.c, function() {
		h.testBackAndForth(item.c, item.q);
	});
});
