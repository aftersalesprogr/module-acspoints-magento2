define([
    'jquery',
    'underscore',
    'mage/utils/wrapper',
    'Magento_Checkout/js/model/quote'
], function ($, _, wrapper, quote) {
    'use strict';
    return function (payload) {
        return wrapper.wrap(payload, function (originalPayloadExtender, payload) {
            originalPayloadExtender(payload);
            console.log('shipping-save-processor-mixin: save shipping', payload)
            if (quote && quote.shippingMethod()) {
                if (quote.shippingMethod().carrier_code === 'AfterSalesProGrAcsPoints') {
                    console.log('shipping-save-processor-mixin: save id', $('[name="acs_pp_point_id"]').val())
                    _.extend(payload.addressInformation.extension_attributes,
                        {
                            'acs_pp_point_id': $('[name="acs_pp_point_id"]').val()
                        }
                    );
                }
            }
        });
    };
});
