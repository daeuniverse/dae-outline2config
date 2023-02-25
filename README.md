# dae-outline2config

This project is used to generate dae configuration, which is useful for GUI projects.

## Usage

Generate `outline.json` using the latest version of dae.

```shell
dae export outline > outline.json
```

Fill `value` into corresponding json units, and generate configuration using `class Marshaller`. See more at [marshaller_test.js](marshaller_test.js).

It is also convenient to use it in a lightweight JavaScript interpreter in other languages (Python, C++, etc.). Go projects can use [v2rayA/dae.config](https://github.com/v2rayA/dae/blob/main/config/marshal.go) without outline.

## Notice

This project does not provide injection protection because the prerequisite is assumed that the user has full modification rights to the configuration file.
