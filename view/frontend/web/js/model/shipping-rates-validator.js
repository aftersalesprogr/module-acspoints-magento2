define([
    'jquery',
    'mageUtils',
    'AfterSalesProGr_AcsPoints/js/model/shipping-rates-validation-rules',
    'mage/translate'
], function (
    $,
    utils,
    validationRules,
    $t
) {
    'use strict';

    return {
        validationErrors: [],

        /**
         * @param {Object} address
         * @return {Boolean}
         */
        validate: function (address) {
            var self = this;
            $.each(validationRules.getRules(), function (field, rule) {
                var message;

                if (rule.required && utils.isEmpty(address[field])) {
                    message = $t('Field ') + field + $t(' is required.');
                    self.validationErrors.push(message);
                }
            });
            return !Boolean(this.validationErrors.length);
        }
    };
});
