'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();
var del = require('del');
var source = require('vinyl-source-stream');


var runSequence = require('run-sequence');

gulp.task('clean:dev', function() {
    del.sync(['.tmp']);
});

gulp.task('clean:dist', function() {
    del.sync(['dist']);
});

gulp.task('imagemin', function() {
    return gulp.src('app/images/*')
        .pipe($.imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }]
        }))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('copy', function() {
    return gulp.src(['app/*.txt', 'app/*.ico', 'app/fonts'])
        .pipe(gulp.dest('dist'));
})

gulp.task('copyFonts', function() {
    return gulp.src(['app/fonts/*'])
        .pipe(gulp.dest('dist/fonts'));
})

gulp.task('styles', function() {
    return gulp.src('app/scss/cress.scss')
        .pipe($.sass())
        .pipe($.autoprefixer({
            browsers: ['last 5 versions']
        }))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.livereload());
});

gulp.task('pages', function(){
  return gulp.src('app/*.html')
    .pipe($.injectReload())
    .pipe(gulp.dest('.tmp'))
    .pipe($.livereload());
});

gulp.task('bundle', function() {
    var assets = $.useref.assets({
        searchPath: '{.tmp,app,node_modules}'
    });
    var jsFilter = $.filter(['**/*.js']);
    var cssFilter = $.filter(['**/*.css']);
    var htmlFilter = $.filter(['*.html']);

    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.autoprefixer({
            browsers: ['last 5 versions']
        }))
        .pipe($.minifyCss())
        .pipe(cssFilter.restore())
        .pipe(htmlFilter)
        .pipe($.htmlmin({
            collapseWhitespace: true
        }))
        .pipe(htmlFilter.restore())
        .pipe($.revAll({
            ignore: [/^\/favicon.ico$/g, '.html']
        }))
        .pipe($.revReplace())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('build', function(callback) {
    env = 'prod';

    runSequence(['clean:dev', 'clean:dist'], ['imagemin', 'styles', 'copy', 'copyFonts'],
        ['bundle'], callback);
});

gulp.task('webserver', function() {
    return gulp.src(['.tmp', 'app', 'node_modules'])
        .pipe($.webserver({
            host: '0.0.0.0', //change to 'localhost' to disable outside connections
            livereload: false,
            open: false
        }));
});


gulp.task('webserver-dist', function() {
    return gulp.src(['dist'])
        .pipe($.webserver({
            host: '0.0.0.0', //change to 'localhost' to disable outside connections
            port: 8001,
            livereload: false,
            open: true
        }));
});

gulp.task('serve', function() {
    $.livereload({start: true});
    runSequence('clean:dev', 'styles', 'pages', 'webserver');

    gulp.watch('app/scss/**/*.scss', ['styles']);
    gulp.watch('app/*.html', ['pages']);
});
