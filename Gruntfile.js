'use strict';

var request = require('request');

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    var reloadPort = 35729, files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        develop: {
            server: {
                file: 'src/app.js'
            }
        },
        less: {
            development: {
                options: {
                    compress: false,
                    yuicompress: true,
                    optimization: 2
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/css',
                        src: ['*.less'],
                        dest: 'src/css',
                        ext: '.css'
                    }
                ]
            }
        },
        copy: {
            build: {
                files: [
                    {
                        cwd: 'src',
                        src: [ '*.{html,js}', 'kmeans/**', 'spam-classifier/**', 'img/**'],
                        dest: 'dist',
                        expand: true
                    },
                    {
                        cwd: 'src/vendor/ace-builds/src-min-noconflict',
                        src: [ 'theme-ambiance.js', 'mode-javascript.js', 'worker-javascript.js'],
                        dest: 'dist',
                        expand: true
                    },
                    {
                        cwd: 'src/vendor/Semantic-UI/build/minified/',
                        src: [ 'fonts/*'],
                        dest: 'dist/',
                        expand: true
                    },
                    { src: 'package.json', dest: 'dist/' },
                    { src: 'Procfile', dest: 'dist/' },
                ]
            }
        },
        clean: {
            all: {
                src: ['node_modules', 'src/vendor', '.tmp', 'dist', 'src/css/*.css']
            },
            build: {
                src: [ 'dist', '.tmp', 'src/css/*.css' ]
            },
            tmp: {
                src: [ '.tmp']
            }
        },
        'useminPrepare': {
            html: ['src/index.html', 'src/kmeans/kmeans.html', 'src/spam-classifier/classifier.html'],
            options: {
                dest: 'dist'
            }
        },
        usemin: {
            html: 'dist/**/*.html',
            options: {
                assetsDirs: ['src/img']
            }
        },
        rev: {
            dist: {
                files: {
                    src: [
                        'dist/**.{js,css,png,jpg,jpeg,gif,webp,svg}'
                    ]
                }
            }
        },
        watch: {
            options: {
                nospawn: true,
                livereload: reloadPort
            },
            server: {
                files: [
                    'src/app.js',
                    'routes/*.js'
                ],
                tasks: ['develop', 'delayed-livereload']
            },
            html: {
                files: ['src/*.html'],
                options: {
                    livereload: reloadPort
                }
            },
            js: {
                files: ['src/js/*.js'],
                options: {
                    livereload: reloadPort
                }
            },
            styles: {
                files: ['src/css/*.less'],
                tasks: ['less'],
                options: {
                    livereload: reloadPort
                }
            }
        },
        buildcontrol: {
            options: {
                dir: 'dist',
                commit: true,
                push: true,
                message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
            },
            pages: {
                options: {
                    remote: 'https://github.com/patandia/xke-intro-ml.git',
                    branch: 'gh-pages'
                }
            }
        }
    });

    grunt.config.requires('watch.server.files');
    files = grunt.config('watch.server.files');
    files = grunt.file.expand(files);

    grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
        var done = this.async();
        setTimeout(function () {
            request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function (err, res) {
                var reloaded = !err && res.statusCode === 200;
                if (reloaded) {
                    grunt.log.ok('Delayed live reload successful.');
                } else {
                    grunt.log.error('Unable to make a delayed live reload.');
                }
                done(reloaded);
            });
        }, 500);
    });

    grunt.registerTask('bower', 'install the backend and frontend dependencies', function () {
        var exec = require('child_process').exec;
        var cb = this.async();
        exec('bower install', {}, function (err, stdout, stderr) {
            console.log(stdout);
            cb();
        });
    });

    grunt.registerTask('install', ['bower', 'less']);
    grunt.registerTask('dist', ['clean:build', 'install', 'copy', 'useminPrepare', 'usemin', 'concat', 'uglify', 'cssmin', 'clean:tmp']);
    grunt.registerTask('gh-pages', ['dist', 'buildcontrol.pages']);
    grunt.registerTask('start', ['develop', 'watch']);
};
