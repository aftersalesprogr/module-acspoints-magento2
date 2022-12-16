define([
    'uiComponent',
    'Magento_Checkout/js/model/shipping-rates-validator',
    'Magento_Checkout/js/model/shipping-rates-validation-rules',
    'AfterSalesProGr_AcsPoints/js/model/shipping-rates-validator',
    'AfterSalesProGr_AcsPoints/js/model/shipping-rates-validation-rules'
], function (
    Component,
    defaultShippingRatesValidator,
    defaultShippingRatesValidationRules,
    shippingRatesValidator,
    shippingRatesValidationRules
) {
    'use strict';
    defaultShippingRatesValidator.registerValidator('AfterSalesProGrAcsPoints', shippingRatesValidator);
    defaultShippingRatesValidator.registerValidator('AfterSalesProGrAcsPoints', shippingRatesValidationRules);
    return Component;
});
