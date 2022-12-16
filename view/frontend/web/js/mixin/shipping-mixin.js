define([
    'Magento_Ui/js/model/messageList',
    'jquery',
    'mage/translate',
], function (messageList, $, $t) {
    'use strict';

    return function (target) {
        return target.extend({
            initialize: function () {
                this._super();
            },
            validateShippingInformation: function () {
                const isValid = this._super();
                console.log('shipping-mixin: validate shipping')
                if (isValid && this.isSelected() && this.isSelected() === 'AfterSalesProGrAcsPoints_courier') {
                    const val = $('#acs_pp_point_id').val();
                    console.log('shipping-mixin: validate point')
                    if (!val || val === '') {
                        this.errorValidationMessage(
                            $t('The shipping method is missing. Select the shipping method and try again.')
                        );

                        return false;
                    }
                }
                return isValid;
            }
        });
    };
});
