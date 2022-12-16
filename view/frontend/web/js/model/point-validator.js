define([
    'Magento_Ui/js/model/messageList',
    'Magento_Checkout/js/model/step-navigator',
    'jquery',
    'Magento_Checkout/js/model/quote',
], function (messageList, stepNavigator, $, quote) {
    'use strict';
    return {
        validate: function () {
            console.log('point-validator: validate order')
            if (quote && quote.shippingMethod()) {
                console.log('point-validator: validate shipping')
                if (quote.shippingMethod().carrier_code === 'AfterSalesProGrAcsPoints') {
                    console.log('point-validator: validate point', $('[name="acs_pp_point_id"]').val())
                    if (!$('[name="acs_pp_point_id"]').val()) {
                        stepNavigator.navigateTo('shipping', 'opc-shipping_method');
                        alert('You need to select an ACS Shipping Point in order to proceed.');
                        return false;
                    }
                }
            }
            return true;
        }
    };
});
