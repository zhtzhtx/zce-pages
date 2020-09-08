// 实现这个项目的构建任务
const path = require("path")

const { src, dest, parallel, series, watch } = require('gulp')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')


const del = require('del')

const browserSync = require('browser-sync')
const bs = browserSync.create()

const cwd = process.cwd()
let config = {
  // 默认配置
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  }
}

try {
  const loadConfig = require(path.join(cwd, '/pages.config.js'))//path.join(cwd, '/pages.config.js')
  config = Object.assign({}, config, loadConfig)
} catch (e) { }

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest((config.build.temp)))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.src })
    .pipe(dest(config.build.dist))
}

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))//js
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))//css
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhctespace: true, minifyCSS: true, minifyJS: true })))//html
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)
  watch("**", { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, //browserSync标识隐藏
    port: 2080,//端口设置
    // open: false,//是否自动打开页面
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const compile = parallel(style, script, page)

const build = series(clean, parallel(series(compile, useref), image, font, extra))

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
