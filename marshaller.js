/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (c) 2023, v2rayA Organization <team@v2raya.org>
 */

function quote(str) {
    return "'" + unescape(escape(str).replace(/%27/g, "%5c'")) + "'"
}

function parseKeyableString(str) {
    const firstColon = str.indexOf(':')
    if (firstColon < 0) {
        return ['', str]
    }
    if (str.slice(firstColon).startsWith("://")) {
        return ['', str]
    }
    return [str.slice(0, firstColon).trim(), str.slice(firstColon + 1).trim()]
}


module.exports = class Marshaller {
    constructor(outlineText, indent = 4) {
        this.buf = ''
        this.indent = indent
        this.outline = JSON.parse(outlineText)
        this.leaves = new Set(this.outline.leaves)
        this.structure = this.outline.structure
    }

    marshal() {
        const structure = this.structure
        for (let item of structure) {
            this.marshalSection(item, 0)
        }
        return this.buf
    }

    marshalSection(section, depth) {
        this.writeLine(section.mapping + " {", depth)
        if (section.isArray) {
            // String array or section array.
            if (section.type === 'config.KeyableString') {
                this.marshalKeyableStringList(section.value, depth + 1)
            } else {
                this.marshalSectionArray(section, depth + 1)
            }
        } else {
            // Section content.
            if (section.structure) {
                for (let item of section.structure) {
                    this.marshalLeaf(item, depth + 1)
                }
            }

        }
        this.writeLine('}', depth)
    }

    marshalLeaf(item, depth) {
        if (this.leaves.has(item.type) && !item.value) {
            return
        }
        if (item.name === "Name" && item.mapping === "_") {
            // Ignore.
            return
        }
        const key = item.mapping
        let value
        let quoteFunc = quote
        let strAsIs = str => str
        let squeeze = false
        if (item.isArray) {
            let list = []
            let delimiter = ', '
            switch (item.type) {
                case "config.FunctionListOrString":
                    throw new Error(`unexpected type: ${item.type}`)
                case "uint":
                case "uint8":
                case "uint16":
                case "uint32":
                case "uint64":
                case "int":
                case "int8":
                case "int16":
                case "int32":
                case "int64":
                    for (let v of item.value) {
                        list.push(parseInt(v))
                    }
                    break
                case "bool":
                    for (let v of item.value) {
                        list.push(v.toString())
                    }
                    break
                case "config_parser.RoutingRule":
                    squeeze = true
                case "config.FunctionOrString":
                case "config_parser.Function":
                    delimiter = ' && '
                    quoteFunc = strAsIs
                case "time.Duration":
                case "string":
                    for (let v of item.value) {
                        list.push(v)
                    }
                    break
                case 'config.KeyableString':
                    this.writeLine(key + ' {', depth)
                    this.marshalKeyableStringList(item.value, depth + 1)
                    this.writeLine('}', depth)
                    return
                default:
                    // Unnamed sections.
                    // 'Name' should be in structure.
                    this.marshalSectionArray(item, depth)
            }
            if (squeeze) {
                for (let v of list) {
                    this.writeLine(v, depth)
                }
                return
            } else {
                value = list.join(delimiter)
            }
        } else {
            switch (item.type) {
                case "uint":
                case "uint8":
                case "uint16":
                case "uint32":
                case "uint64":
                case "int":
                case "int8":
                case "int16":
                case "int32":
                case "int64":
                    value = parseInt(item.value)
                    break
                case "bool":
                    value = item.value.toString()
                    break
                case "config_parser.RoutingRule":
                    squeeze = true
                case "config.FunctionListOrString":
                case "config.FunctionOrString":
                case "config_parser.Function":
                    quoteFunc = strAsIs
                case "time.Duration":
                case "string":
                    value = item.value
                    break
                default:
                    if (this.leaves.has(item.type)) {
                        throw new Error(`unknown leaf type: ${item.type}`)
                    }
                    this.marshalSection(item, depth)
                    return

            }
        }

        if (key === '_') {
            this.writeLine(quoteFunc(value), depth)
        } else {
            this.writeLine(key + ': ' + quoteFunc(value), depth)
        }
    }

    marshalSectionArray(section, depth = 0) {
        let length = 0
        const structure = section.structure
        if (structure.length) {
            const v = structure[0].value
            if (!v) {
                return
            }
            length = v.length
        }
        // Marshal sections.
        for (let i = 0; i < length; i++) {
            let name
            for (let item of structure) {
                if (item.name === "Name" &&
                    item.value && i < item.value.length) {
                    name = item.value[i]
                    break
                }
            }
            if (!name) {
                throw new Error(`Name is not given`)
            }
            const structureSlice = this.getStructureSlice(structure, i)
            let sectionClone = Object.assign({}, section)
            sectionClone.isArray = false
            sectionClone.mapping = name
            sectionClone.structure = structureSlice
            this.marshalSection(sectionClone, depth)
        }
    }

    getStructureSlice(structure, index) {
        const slice = []
        for (let item of structure) {
            // Check length alignment.
            if (!item.value && item.structure) {
                // Recursive call.
                const field = this.getStructureSlice(item.structure, index)
                slice.push(field)
                continue
            }
            if (!item.value || index >= item.value.length) {
                throw new Error(`${item.name}: value length too short`)
            }

            const field = Object.assign({}, item)
            field.value = item.value[index]
            slice.push(field)
        }
        return slice
    }

    marshalKeyableStringList(strs, depth) {
        if (!strs) {
            return
        }
        for (let str of strs) {
            const [key, afterKey] = parseKeyableString(str)
            if (key !== '') {
                this.writeLine(key + ':' + quote(afterKey), depth)
                continue
            }
            this.writeLine(quote(str), depth)
        }
    }

    writeLine(str, depth) {
        this.buf += ' '.repeat(this.indent * depth) + str + '\n'
    }
}
