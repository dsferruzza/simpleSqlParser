// Generate the SQL query corresponding to an AST output by parseSQL()
function ast2sql(ast) {
	var result = '';

	// Define subfunctions
	function select(ast) {
		return 'SELECT ' + ast['SELECT'].join(', ');
	}

	function from(ast) {
		return ' FROM ' + ast['FROM'].join(', ');
	}

	function join(ast, type) {
		if (typeof ast[type + ' JOIN'] != 'undefined') {
			var join = ast[type + ' JOIN'];
			var result = '';
			if (typeof join[0] != 'undefined') {
				join.forEach(function(item) {
					result += ' ' + type + ' JOIN ' + item.table + ' ON ' + cond2sql(item.cond);
				});
			}
			else result += ' ' + type + ' JOIN ' + join.table + ' ON ' + cond2sql(join.cond);
			return result;

		}
		else return '';
	}

	function where(ast) {
		if (typeof ast['WHERE'] != 'undefined') {
			return ' WHERE ' + cond2sql(ast['WHERE']);
		}
		else return '';
	}

	function order_by(ast) {
		if (typeof ast['ORDER BY'] != 'undefined') {
			var result = ' ORDER BY ';
			var order_by = ast['ORDER BY'].map(function (item) {
				return item.column + ' ' + item.order;
			});
			result += order_by.join(', ');
			return result;
		}
		else return '';
	}

	function limit(ast) {
		if (typeof ast['LIMIT'] != 'undefined') {
			var result = ' LIMIT ';
			if (ast['LIMIT'].from != '1') result += ast['LIMIT'].from + ',';
			result += ast['LIMIT'].nb;
			return result;
		}
		else return '';
	}

	function insert_into(ast) {
		var result = 'INSERT INTO ' + ast['INSERT INTO'].table;
		if (typeof ast['INSERT INTO'].columns != 'undefined') {
			result += ' (';
			result += ast['INSERT INTO'].columns.join(', ');
			result += ')';
		}
		return result;
	}

	function values(ast) {
		var result = ' VALUES ';
		var values = ast['VALUES'].map(function (item) {
			return '(' + item.join(', ') + ')';
		});
		result += values.join(', ');
		return result;
	}

	function delete_from(ast) {
		return 'DELETE FROM ' + ast['DELETE FROM'][0];
	}

	function update(ast) {
		return 'UPDATE ' + ast['UPDATE'][0];
	}

	function set(ast) {
		return ' SET ' + ast['SET'].join(', ');
	}


	// Check request's type
	if (typeof ast['SELECT'] != 'undefined' && typeof ast['FROM'] != 'undefined') {
		result = select(ast) + from(ast) + join(ast, 'LEFT') + join(ast, 'INNER') + where(ast) + order_by(ast) + limit(ast);		
	}
	else if (typeof ast['INSERT INTO'] != 'undefined') {
		result = insert_into(ast) + values(ast);
	}
	else if (typeof ast['UPDATE'] != 'undefined') {
		result = update(ast) + set(ast) + where(ast);
	}
	else if (typeof ast['DELETE FROM'] != 'undefined') {
		result = delete_from(ast) + where(ast);
	}
	else result = null

	return result;
}

// Generate SQL from a condition AST output by parseSQL() or CondParser
function cond2sql(cond, not_first) {
	var result = '';

	// If there is a logical operation
	if (typeof cond.logic != 'undefined') {
		result = cond.terms.map(function (item) {
			return cond2sql(item, true);
		});
		result = result.join(' ' + cond.logic + ' ')
		if (not_first != null) result = '(' + result + ')';
	}
	// If there is a condition
	else if (typeof cond.left != 'undefined') {
		result = cond.left;
		if (typeof cond.operator != 'undefined') {
			result += ' ' + cond.operator;
			if (typeof cond.right != 'undefined') {
				result += ' ' + cond.right;
			}
		}
	}
	// If there is a boolean
	else result = cond;

	return result;
}
