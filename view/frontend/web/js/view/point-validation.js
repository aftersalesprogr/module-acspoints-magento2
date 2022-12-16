define([
    'uiComponent',
    'Magento_Checkout/js/model/payment/additional-validators',
    'AfterSalesProGr_AcsPoints/js/model/point-validator'
], function (Component, additionalValidators, pointValidator) {
    'use strict';

    additionalValidators.registerValidator(pointValidator);

    return Component.extend({});
});
