
test('trim', function () {
	expect(5);

	equal(trim('test'), 'test');
	equal(trim('test '), 'test');
	equal(trim(' test'), 'test');
	equal(trim(' test '), 'test');
	equal(trim('test test'), 'test test');
});
