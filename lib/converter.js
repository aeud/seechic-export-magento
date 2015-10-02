var fs = require('fs')
var csv = require('csv')

exports.exec = (file, callback) => {
    var variantAttributes = fs.readFileSync(__dirname + '/../settings/variant_attributes.json', 'utf-8')
    try { variantAttributes = JSON.parse(variantAttributes) } catch (e) { throw e }

    var magentoColumns = fs.readFileSync(__dirname + '/../settings/magento_columns.json', 'utf-8')
    try { magentoColumns = JSON.parse(magentoColumns) } catch (e) { throw e }

    var magentoDefault = fs.readFileSync(__dirname + '/../settings/magento_default.json', 'utf-8')
    try { magentoDefault = JSON.parse(magentoDefault) } catch (e) { throw e }

    csv.parse(file, (err, allProducts) => {
        var headers = allProducts.shift()
        allProducts = allProducts.map(p => {
            var obj = { attr: {} }
            headers.forEach((h, _i) => { obj.attr[h] = p[_i] })
            obj.type = p.cl_variant_identifier ? 'Contact Lenses' : 'Sunglasses'
            obj.attr._attribute_set = obj.type
            obj.attr._category = obj.type
            obj.attr._type = obj.attr.configurable == 'TRUE' ? 'configurable' : 'simple'
            obj.attr.has_options = obj.attr.configurable == 'TRUE' ? 1 : 0
            obj.attr.required_options = obj.attr.configurable == 'TRUE' ? 1 : 0
            obj.attr.tax_class_id = 4
            obj.attr.status = 1
            obj.attr.visibility = obj.attr.configurable == 'TRUE' ? 4 : 1
            obj.attr.qty = obj.attr.configurable == 'TRUE' ? 1 : 0
            return obj
        })
        configurableProducts = allProducts.filter(p => p.attr.configurable == 'TRUE')
        simpleProducts = allProducts.filter(p => p.attr.configurable != 'TRUE')
        configurableProducts = configurableProducts.map(p => {
            var linkedProducts = simpleProducts.filter(s => s.attr.sku_of_parent == p.attr.sku)
            p.simpleProducts = linkedProducts.map(s => variantAttributes[s.type].map(a => {
                return {
                    _super_products_sku: s.attr.sku,
                    _super_attribute_code: a,
                    _super_attribute_option: s.attr[a]
                }
            }))
            if (p.simpleProducts.length == 0) p.simpleProducts.push(variantAttributes[p.type].map(a => {
                return {
                    _super_products_sku: p.attr.sku,
                    _super_attribute_code: a,
                    _super_attribute_option: p.attr[a]
                }
            }))
            if (p.type == 'Contact Lenses') p.simpleProducts.push(variantAttributes[p.type].map(a => {
                return {
                    _super_products_sku: p.attr.sku + '_na',
                    _super_attribute_code: a,
                    _super_attribute_option: 'N/A'
                }
            }))
            p.linkedProducts = linkedProducts
            return p
        })
        magentoProducts = configurableProducts.map(p => {
            var obj = {}
            var simpleProducts = p.simpleProducts
            var mainSimple = simpleProducts.shift()
            var mainAttribute = mainSimple.shift()
            magentoColumns.forEach(c => {
                obj[c] = variantAttributes[p.type].indexOf(c) == -1 ? (p.attr[c] || magentoDefault[c] || '') : ''
            })
            for (l in mainAttribute) obj[l] = mainAttribute[l]
            return [obj].concat(mainSimple).concat(simpleProducts.reduce((a,b) => a.concat(b), [])).concat(p.linkedProducts.map(s => {
                var obj = {}
                magentoColumns.forEach(c => {
                    obj[c] = s.attr[c] || magentoDefault[c] || ''
                })
                return obj
            }))
        }).reduce((a,b) => a.concat(b), [])
        csv.stringify(magentoProducts, {
            header: true
        }, callback)
    })
}