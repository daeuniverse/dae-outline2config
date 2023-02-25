# dae-outline2config

This project is used to generate dae configuration, which is useful for GUI programmer.

## Usage

Generate `outline.json` from the latest version of dae.

```shell
dae export outline > outline.json
```

Fill `value` into corresponding json units, and generate configuration using `class Marshaller`. See more at [marshaller_test.js](marshaller_test.js).

It is convenient to use it in a lightweight JavaScript VM in other languages (Python, C++, etc.).

## Notice

This project does not provide injection protection because the prerequisite is assumed that the user has full modification rights to the configuration file.
