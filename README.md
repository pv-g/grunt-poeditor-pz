# grunt-poeditor-pz

> Call POEditor's APIs & download exports from a grunt task.

## Getting Started

First, check out [POEditor](https://poeditor.com) if you don't know what it is.

This plugin requires Grunt `~0.4.0`.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-poeditor-pz --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-poeditor-pz');
```

or using the very convenient [load-grunt-tasks](https://github.com/sindresorhus/load-grunt-tasks) utility.

## Usage

**This a non-tested plugin, use at your own risk.**  
On the other, it's only a convenient plugin, just take care of the downloaded exports.

### Example

```js
grunt.initConfig({
  poeditor: {
    target1: {
      command: { // POEditor's API args
        action: 'list_languages',
        id: '9999'
      }
    },
    target2: {
      download: {
        project_id: '9999', // POEditor's project id
        languages: { // matching POEditor's language codes with yours
          'en-us': 'en',
          'es': 'es',
          'es-ar': 'es_AR',
          'fr': 'fr'
        },
        type: 'po', // export type (check out the doc)
        dest: '<%= conf.front %>/locale/?/LC_MESSAGES/django.po'
        // grunt style dest files
      }
    },
    options: {
      api_token: '[your API token here]'
    }
  },
});
```

### Options

#### command
An object specifying the API command.  
Check out the doc : https://poeditor.com/api_reference/.

#### download
Check out the doc too, at the Export command.  
Export type = po, pot, mo, xls, apple_strings, android_strings, resx, resw, properties, or json.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

- 0.1.0 initial (non-tested) release

## License
MIT License, see LICENSE-MIT for details.
