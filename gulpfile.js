'use strict';

const {src, dest, series, parallel, watch, lastRun} = require('gulp')
const plumber = require('gulp-plumber') // модуль для отслеживания ошибок
const sourcemaps = require('gulp-sourcemaps') // модуль для генерации карты исходных файлов
const sass = require('gulp-sass') // модуль для компиляции SASS (SCSS) в CSS
const autoprefixer = require('gulp-autoprefixer') // модуль для автоматической установки автопрефиксов
const cleanCSS = require('gulp-clean-css') // плагин для минимизации CSS
const uglify = require('gulp-uglify') // модуль для минимизации JavaScript
const cache = require('gulp-cache') // модуль для кэширования
const rigger = require('gulp-rigger') // модуль для импорта содержимого одного файла в другой
const imagemin = require('gulp-imagemin') // плагин для сжатия PNG, JPEG, GIF и SVG изображений
const jpegrecompress = require('imagemin-jpeg-recompress') // плагин для сжатия jpeg
const pngquant = require('imagemin-pngquant') // плагин для сжатия png
const pug = require('gulp-pug') //HTML шаблонизатор
const pugbem = require('gulp-pugbem')
const babel = require('gulp-babel')
const rename = require("gulp-rename")
const svgSprite = require('gulp-svg-sprite') //для создания спрайтов svg
const spritesmith = require('gulp.spritesmith') //для создания спрайтов png
const svgmin = require('gulp-svgmin')
const cheerio = require('gulp-cheerio')
const replace = require('gulp-replace')
const del = require('del') // плагин для удаления файлов и каталогов
const sync = require('browser-sync').create() // сервер для работы и автоматического обновления страниц



function pugFiles() {
	return src('assets/src/pug/*.pug')
		.pipe(plumber())
		.pipe(pug({
			pretty: true,
			plugins: [pugbem]
		}))
		.pipe(dest('assets/build'))
		.on('end', sync.reload);
}

function scss() {
	return src('assets/src/sass/main.scss')
		.pipe(plumber())
		.pipe(sass({
			outputStyle: 'expanded'// Options: nested, expanded, compact, compressed
		})) // scss -> css
		.pipe(autoprefixer())
		.pipe(dest('assets/build/css'))
		//.pipe(sync.stream())
		.on('end', sync.reload);
}

function scssBuild() {
	return src('assets/src/sass/main.scss')
		.pipe(plumber())
		.pipe(sass({
			outputStyle: 'expanded'// Options: nested, expanded, compact, compressed
		})) // scss -> css
		.pipe(autoprefixer())
		.pipe(cleanCSS({
			level: 2
		}))
		.pipe(dest('assets/build/css'))
}

function scrits() {
	return src(['assets/src/js/*.js','!assets/src/js/vendors.js'])
		.pipe(plumber())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(dest('assets/build/js'))
}

function vendorsJS() {
	return src('assets/src/js/vendors.js')
		.pipe(plumber())
		.pipe(rigger()) // импортируем все указанные файлы в vendors.js
		.pipe(sourcemaps.init()) // инициализируем sourcemap
		.pipe(uglify())
		.pipe(rename('vendors.min.js'))
		.pipe(sourcemaps.write('./')) // записываем sourcemap
		.pipe(dest('assets/build/js'))
}

function vendorsBuildJS() {
	return src('assets/src/js/vendors.js')
		.pipe(plumber())
		.pipe(rigger()) // импортируем все указанные файлы в vendors.js
		.pipe(uglify())
		.pipe(rename('vendors.min.js'))
		.pipe(dest('assets/build/js'))
}

function vendorsStyle() {
	return src('assets/src/sass/vendors.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init()) // инициализируем sourcemap
		.pipe(sass()) // scss -> css
		.pipe(cleanCSS({
			level: 2
		})) // минимизируем CSS
		.pipe(rename('vendors.min.css'))
		.pipe(sourcemaps.write('./')) // записываем sourcemap
		.pipe(dest('assets/build/css'))
}

function vendorsBuildStyle() {
	return src('assets/src/sass/vendors.scss')
		.pipe(plumber())
		.pipe(sass()) // scss -> css
		.pipe(cleanCSS({
			level: 2
		})) // минимизируем CSS
		.pipe(rename('vendors.min.css'))
		.pipe(dest('assets/build/css'))
}

function fonts() {
	return src('assets/src/fonts/**/*.*')
		.pipe(dest('assets/build/fonts'))
}

function libs() {
	return src('assets/src/libs/**/*.*')
		.pipe(dest('assets/build/libs'))
}

function spriteSvg() {
	return src('assets/src/img/spriteSvg/**/*.svg')
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "../spriteSVG.svg"
				}
			}
		}))
		.pipe(dest('assets/src/img'));
}

function sprite() {
	const spriteData = src('assets/src/img/sprite/**/*.png')
		.pipe(plumber())
		.pipe(spritesmith({
			imgName: 'sprite.png',
			imgPath: '../img/sprite.png',
			cssName: '_sprite.scss',
			cssPath: '/sass/',
			// retinaSrcFilter: 'assets/src/img/sprite/*@2x.png',
			// retinaImgName: 'sprite@2x.png',
			// retinaImgPath: '../img/sprite@2x.png',
			algorithm: 'binary-tree',
			padding: 5
		}))
	const imgStream = spriteData.img
		.pipe(dest('assets/src/img/'))

	const cssStream = spriteData.css
		.pipe(dest('assets/src/sass'))
	return spriteData
}

function images() {
	return src(['assets/src/img/**/*.*','!assets/src/img/spriteSVG.svg'])
		.pipe(cache(imagemin([ // сжатие изображений
			imagemin.gifsicle({interlaced: true}),
			jpegrecompress({
				progressive: true,
				max: 90,
				min: 80
			}),
			pngquant(),
			imagemin.svgo({plugins: [
					{removeViewBox: false}
				]})
		])))
		.pipe(dest('assets/build/img'))
		.pipe(sync.stream())
}

function moveSpriteSvg() {
	return src('assets/src/img/spriteSVG.svg')
		.pipe(dest('assets/build/img'))
}

function cacheClear() {
	return cache.clearAll();
}

function clear() {
	return del('assets/build')
}


function serve() {
	sync.init({
		server: {
			baseDir: './assets/build'
		},
		notify: false
	})

	watch('assets/src/libs/**/*.*', series(libs)).on('change', sync.reload)
	watch('assets/src/fonts/**/*.*', series(fonts)).on('change', sync.reload)
	watch('assets/src/sass/vendors.scss', series(vendorsStyle)).on('change', sync.reload)
	watch('assets/src/js/vendors.js', series(vendorsJS)).on('change', sync.reload)
	watch('assets/src/pug/**/*.pug', series(pugFiles))
	watch('assets/src/sass/**/*.scss', series(scss))
	watch('assets/src/js/**/*.js', series(scrits)).on('change', sync.reload)
	watch('assets/src/img/**/*.*', series(images)).on('change', sync.reload)
	watch('assets/src/img/spriteSVG.svg', series(moveSpriteSvg)).on('change', sync.reload)
}


exports.build = series(clear, fonts, vendorsBuildJS, libs, scssBuild, vendorsBuildStyle, pugFiles, images, moveSpriteSvg, scrits)
exports.serve = series(clear, fonts, vendorsJS, libs, vendorsStyle, pugFiles, scss, scrits, images, moveSpriteSvg, serve)
exports.clear = clear
exports.cacheClear = cacheClear
exports.spriteSvg = spriteSvg
exports.sprite = sprite





