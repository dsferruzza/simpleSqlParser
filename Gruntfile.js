module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'simpleSqlParser.js', 'tests/tests.js'],
      options : {
        multistr: true,
        sub: true,
      },
    },
    qunit: {
      all: ['tests/**/*.html'],
    },
    watch: {
      files: ['**.js'],
      tasks: ['default'],
      options: {
        atBegin: true,
        interrupt: true,
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'qunit']);

};
