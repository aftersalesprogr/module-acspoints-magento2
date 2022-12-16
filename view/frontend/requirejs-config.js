var config = {
    'map': {
        '*': {
            'markerclusterer': 'AfterSalesProGr_AcsPoints/js/markerclusterer'
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/model/shipping-save-processor/payload-extender': {
                'AfterSalesProGr_AcsPoints/js/mixin/shipping-save-processor-mixin': true
            },
            'Magento_Checkout/js/view/shipping': {
                'AfterSalesProGr_AcsPoints/js/mixin/shipping-mixin': true
            }
        }
    }
};
