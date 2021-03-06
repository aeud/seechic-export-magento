var fs = require('fs')
var csv = require('csv')

exports.exec = (file, callback) => {
    var variantAttributes = fs.readFileSync(__dirname + '/../settings/variant_attributes.json', 'utf-8')
    try { variantAttributes = JSON.parse(variantAttributes) } catch (e) { throw e }

    var magentoColumns = fs.readFileSync(__dirname + '/../settings/magento_columns.json', 'utf-8')
    try { magentoColumns = JSON.parse(magentoColumns) } catch (e) { throw e }

    var magentoDefault = fs.readFileSync(__dirname + '/../settings/magento_default.json', 'utf-8')
    try { magentoDefault = JSON.parse(magentoDefault) } catch (e) { throw e }

    var processProducts = allProducts => {
        var headers = allProducts.shift()
        allProducts = allProducts.map(p => {
            var obj = { attr: {} }
            headers.forEach((h, _i) => { obj.attr[h] = typeof p[_i] == 'string' ? p[_i].trim() : p[_i] })
            obj.type = obj.attr.cl_variant_identifier ? 'Contact Lenses' : 'Sunglasses'
            obj.attr._attribute_set = obj.type
            obj.attr._category = obj.type
            obj.attr._type = obj.attr.configurable == 'TRUE' ? 'configurable' : 'simple'
            obj.attr.has_options = obj.attr.configurable == 'TRUE' ? '1' : '0'
            obj.attr.required_options = obj.attr.configurable == 'TRUE' ? '1' : '0'
            obj.attr.tax_class_id = obj.type == 'Contact Lenses' ? '7' : '6'
            obj.attr.status = obj.attr.status == 'enabled' ? '1' : '2'
            obj.attr.visibility = obj.attr.configurable == 'TRUE' ? (obj.type == 'Contact Lenses' ? '4' : '1') : (obj.type == 'Contact Lenses' ? '1' : '4')
            //console.log(obj.attr.visibility)
            obj.attr.qty = obj.attr.configurable == 'TRUE' ? '1' : '0'
            obj.attr.cl_stock_item = obj.type == 'Contact Lenses' ? 'NO' : null
            obj.attr.is_in_stock = obj.attr.configurable == 'TRUE' ? '1' : '0'
            obj.attr.description = obj.attr.description || ' '
            obj.attr.sku = 'NUMBER_' + obj.attr.sku 
            obj.attr.cl_power = obj.attr.cl_power ? 'NUMBER_' + obj.attr.cl_power : obj.attr.cl_power
            obj.attr._super_attribute_option = obj.attr._super_attribute_option ? 'NUMBER_' + obj.attr._super_attribute_option : obj.attr._super_attribute_option
            return obj
        })
        configurableProducts = allProducts.filter(p => p.attr.configurable == 'TRUE')
        simpleProducts = allProducts.filter(p => p.attr.configurable != 'TRUE')
        configurableProducts = configurableProducts.map(p => {
            var linkedProducts = simpleProducts.filter(s => s.attr.sku_of_parent == p.attr.sku)
            if (p.type == 'Contact Lenses' || linkedProducts.length == 0) {
                obj = { attr: {}, type: p.type}
                for (l in p.attr) obj.attr[l] = p.attr[l]
                variantAttributes[p.type].forEach(a => obj.attr[a] = 'N/A')
                obj.attr.sku = p.attr.sku + '_na'
                obj.attr.configurable = 'simple'
                obj.attr._type = 'simple'
                obj.attr.has_options = '0'
                obj.attr.required_options = '0'
                obj.attr.visibility = (obj.type == 'Contact Lenses' ? '1' : '4')
                obj.attr.qty = '0'
                obj.attr.is_in_stock = '0'
                linkedProducts.push(obj)
            }
            p.simpleProducts = linkedProducts.map(s => variantAttributes[s.type].map(a => {
                return {
                    _super_products_sku: s.attr.sku,
                    _super_attribute_code: a,
                    _super_attribute_option: s.attr[a]
                }
            }))
            p.linkedProducts = linkedProducts
            if (p.simpleProducts[0].length > 1) console.log(p.simpleProducts)
            return p
        })
        magentoProducts = configurableProducts.map(p => {
            var obj = {}
            var simpleProducts = p.simpleProducts
            var mainSimple = simpleProducts.shift()
            var mainAttribute = mainSimple.shift()
            magentoColumns.forEach(c => {
                obj[c] = p.attr[c] || magentoDefault[c] || ''
            })
            for (l in mainAttribute) obj[l] = mainAttribute[l]
//            if (obj.sg_gender) {
//                var s = obj.sg_gender.split(',')
//                if (s.length == 2) {
//                    obj.sg_gender = s[0]
//                    if (simpleProducts.length >= 1) simpleProducts[0].sg_gender = s[1]
//                    else simpleProducts.push({ sg_gender: s[1] })
//                }
//            }
            return [obj].concat(mainSimple).concat(simpleProducts.reduce((a,b) => a.concat(b), [])).concat(p.linkedProducts.map(s => {
                var obj = {}
                magentoColumns.forEach(c => {
                    obj[c] = s.attr[c] || magentoDefault[c] || ''
                })
                var res = [obj]
//                if (obj.sg_gender) {
//                    var s = obj.sg_gender.split(',')
//                    if (s.length == 2) {
//                        res[0].sg_gender = s[0]
//                        res.push({ sg_gender: s[1] })
//                    }
//                }
                return res
            })).reduce((a,b) => a.concat(b), [])
        }).reduce((a,b) => a.concat(b), [])
        csv.stringify(magentoProducts, {
            header: true
        }, callback)
    }

    csv.parse(file, (err, allProducts) => {
        if (err && allProducts) callback(err)
        else processProducts(allProducts)
    })
}