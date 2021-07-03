# @pkgdeps/update-github-actions-permissions [![Actions Status: test](https://github.com/pkgdeps/update-github-actions-permissions/workflows/test/badge.svg)](https://github.com/pkgdeps/update-github-actions-permissions/actions?query=workflow%3A"test")

Update GitHub Actions&#39;s `permissions` automatically.

## Features

- Detect using Actions and add `permissions` field to your action yaml file

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @pkgdeps/update-github-actions-permissions --global

or

    npx @pkgdeps/update-github-actions-permissions ".github/workflows/*.{yaml,yml}"

## Usage

    Usage
      $ update-github-actions-permissions "[file|glob]"
 
    Options
      --defaultPermissions                [String] "write-all" or "read-all". Default: "write-all"
      --verbose                           [Boolean] If enable verbose, output debug info.
 
    Examples
      $ update-github-actions-permissions ".github/workflows/test.yml"
      # multiple inputs
      $ update-github-actions-permissions ".github/workflows/test.yml" ".github/workflows/publish.yml" 
      $ update-github-actions-permissions ".github/workflows/*.{yml,yaml}"

## Add existing action's `permissions`

This tool manage `permissions` in [actions.yml](./actions.yml).

If you want to improve the `permissions` definitions, please edit [actions.yml](./actions.yml).

1. Edit [actions.yml](./actions.yml)
2. Submit a Pull Request

:memo: `NODE_AUTH_TOKEN` is special pattern. If you found special env name, please create an issue.

## Changelog

See [Releases page](https://github.com/pkgdeps/update-github-actions-permissions/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/pkgdeps/update-github-actions-permissions/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- azu: [GitHub](https://github.com/azu), [Twitter](https://twitter.com/azu_re)

## License

MIT © azu
