"use strict";

module.exports = function(astObject) {
	/*if (typeof ast === 'object' && ast.status === true) ast = ast.value;
	else return false;*/
	if (typeof astObject !== 'object' || astObject.status !== true) return false;

	function select(ast) {
		var result = 'SELECT ';
		result += ast.select.map(function(item) {
			return item.expression;
		}).join(', ');
		return result;
	}

	function from(ast) {
		var result = 'FROM ';
		result += ast.from.map(function(item) {
			return item.expression;
		}).join(', ');
		return result;
	}

	function join(ast) {
		return ast.join.map(function(item) {
			var result = '';
			if (item.type === 'inner') result += 'INNER JOIN ';
			else if (item.type === 'left') result += 'LEFT JOIN ';
			else if (item.type === 'right') result += 'RIGHT JOIN ';
			else return '';
			result += item.table;
			if (item.alias !== null) result += ' AS ' + item.alias;
			result += ' ON ';
			result += item.condition.expression;
			return result;
		}).join(' ');
	}

	function where(ast) {
		var result = '';
		if (ast.where !== null) result += 'WHERE ' + ast.where.expression;
		return result;
	}

	function group(ast) {
		var result = '';
		if (ast.group.length > 0) {
			result += 'GROUP BY ';
			result += ast.group.map(function(item) {
				return item.expression;
			}).join(', ');
		}
		return result;
	}

	function order(ast) {
		var result = '';
		if (ast.order.length > 0) {
			result += 'ORDER BY ';
			result += ast.order.map(function(item) {
				return item.expression;
			}).join(', ');
		}
		return result;
	}

	function limit(ast) {
		var result = '';
		if (ast.limit !== null) {
			result += 'LIMIT ';
			if (ast.limit.from !== null) result += ast.limit.from + ', ';
			result += ast.limit.nb;
		}
		return result;
	}

	function into(ast) {
		return 'INSERT INTO ' + ast.into.expression;
	}

	function values(ast) {
		var result = '';
		var targets = ast.values.filter(function(item) {
			return item.target !== null;
		});
		if (targets.length > 0) {
			result += '(';
			result += targets.map(function(item) {
				return item.target.expression;
			}).join(', ');
			result += ') ';
		}
		result += 'VALUES (';
		result += ast.values.map(function(item) {
			return item.value;
		}).join(', ');
		result += ')';
		return result;
	}

	function table(ast) {
		return 'UPDATE ' + ast.table.expression;
	}

	function update(ast) {
		var result = 'SET ';
		result += ast.values.map(function(item) {
			return item.target.expression + ' = ' + item.value;
		}).join(', ');
		return result;
	}

	var ast = astObject.value;
	var parts = [];
	if (ast.type === 'select') {
		parts.push(select(ast));
		parts.push(from(ast));
		parts.push(join(ast));
		parts.push(where(ast));
		parts.push(group(ast));
		parts.push(order(ast));
		parts.push(limit(ast));
	}
	else if (ast.type === 'insert') {
		parts.push(into(ast));
		parts.push(values(ast));
	}
	else if (ast.type === 'update') {
		parts.push(table(ast));
		parts.push(update(ast));
		parts.push(where(ast));
	}
	else if (ast.type === 'delete') {
		parts.push('DELETE');
		parts.push(from(ast));
		parts.push(where(ast));
	}
	else return false;

	return parts.filter(function(item) {
		return item !== '';
	}).join(' ');
};
