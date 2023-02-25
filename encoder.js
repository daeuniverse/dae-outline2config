/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (c) 2023, v2rayA Organization <team@v2raya.org>
 */

function quote(str) {
    return "'" + unescape(escape(str).replace(/%27/g, "%5c'")) + "'"
}

module.exports = class Encoder {
    constructor() {
        this.mapping = {
            "config.FunctionListOrString": '',
            "config.FunctionOrString": '',
            "config.KeyableString": '',
            "config_parser.Function": '',
            "config_parser.RoutingRule": '',
            "string": '',
            "time.Duration": '',
        }
    }

    static FunctionListOrString(andFunctions, string) {
        if (andFunctions) {
            if (!Array.isArray(andFunctions)) {
                throw new Error('andFunctions should be undefined or array of functions')
            }
            return andFunctions.join(' && ')
        }
        return string || ''
    }

    static FunctionOrString(func, string) {
        if (func) {
            return func
        }
        return string || ''
    }

    static KeyableString(key, value) {
        if (value.startsWith(`'`) || value.startsWith(`"`)) {
            throw new Error("do not quote the value of KeyableString")
        }
        if (key) {
            return key + ": " + value
        }
        return value
    }

    static Param(key, value) {
        switch (typeof value) {
            case "boolean":
            case "number":
            case "bigint":
                break
            case "string":
                value = quote(value)
                break
            default:
                throw new Error('unexpected value type: ' + typeof value)
        }
        if (value.startsWith(`'`) || value.startsWith(`"`)) {
            throw new Error("do not quote the value of KeyableString")
        }
        if (key) {
            return key + ': ' + value
        }
        return value
    }

    static Function(name, params, isOutbound = false) {
        if (!Array.isArray(params)) {
            throw new Error('params should be array of param')
        }
        let paramList = `(${params.join(', ')})`
        if (isOutbound && params.length === 0) {
            paramList = ''
        }
        return name + paramList
    }

    static RoutingRule(andFunctions, outboundFunction) {
        if (!Array.isArray(andFunctions)) {
            throw new Error('andFunctions should be array of functions')
        }
        return andFunctions.join(' && ') + ' -> ' + outboundFunction
    }
}
