define([], function () {
    'use strict';

    return {
        /**
         * @return {Object}
         */
        getRules: function () {
            return {
                'street': {
                    'required': true
                },
                'city': {
                    'required': true
                },
                'postcode': {
                    'required': true
                }
            };
        }
    };
});
