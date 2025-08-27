define([
    'Magento_Ui/js/model/messageList',
    'Magento_Checkout/js/model/step-navigator',
    'jquery',
    'Magento_Checkout/js/model/quote',
], function (messageList, stepNavigator, $, quote) {
    'use strict';
    return {
        validate: function () {
            if (quote && quote.shippingMethod()) {
                if (quote.shippingMethod().carrier_code === 'AfterSalesProGrAcsPoints') {
                    if (!$('[name="acs_pp_point_id"]').val() || !$('[name="acs_pp_point_slug"]').val()) {
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
