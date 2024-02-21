<?php

namespace AfterSalesProGr\AcsPoints\Model\Carrier;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory;
use Magento\Quote\Model\Quote\Address\RateResult\MethodFactory;
use Magento\Shipping\Model\Carrier\AbstractCarrier;
use Magento\Shipping\Model\Carrier\CarrierInterface;
use Magento\Shipping\Model\Rate\ResultFactory;
use Psr\Log\LoggerInterface;

class Custom extends AbstractCarrier implements CarrierInterface
{
    const METHOD_CODE = 'AfterSalesProGrAcsPoints';
    protected $_code = self::METHOD_CODE;
    protected $_isFixed = true;
    protected $_rateResultFactory;
    protected $_rateMethodFactory;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        ErrorFactory $rateErrorFactory,
        LoggerInterface $logger,
        ResultFactory $rateResultFactory,
        MethodFactory $rateMethodFactory,
        array $data = []
    ) {
        $this->_rateResultFactory = $rateResultFactory;
        $this->_rateMethodFactory = $rateMethodFactory;
        parent::__construct($scopeConfig, $rateErrorFactory, $logger, $data);
    }

    public function getAllowedMethods()
    {
        return [$this->getCarrierCode() => __($this->getConfigData('name'))];
    }

    public function collectRates(RateRequest $request)
    {
        if (!$this->isActive()) {
            return false;
        }

        $shipment_weight = $request->getPackageWeight();
        if ($shipment_weight > $this->getConfigData('weightUpperLimit')) {
            return false;
        }

        $shipment_price = $request->getPackageValue();

        $result = $this->_rateResultFactory->create();

        $isFreeShipping = $this->getConfigData('freeShippingUpperLimit') > 0 && $shipment_price >= $this->getConfigData('freeShippingUpperLimit');

        $methodPrice = 0;
        if (!$isFreeShipping) {
            $methodPrice = $this->getConfigData('basePrice');
            if ($shipment_weight > $this->getConfigData('baseWeight')) {
                $methodPrice += $this->getConfigData('costPerKg') * ($shipment_weight - $this->getConfigData('baseWeight'));
            }
        }

        $result->append($this->_appendMethod([
            'method_code' => 'courier',
            'title'       => 'ACS Points',
            'method'      => '',
            'price'       => $methodPrice,
        ]));

        return $result;
    }

    private function _appendMethod($data)
    {
        $method = $this->_rateMethodFactory->create();

        $method->setCarrier($this->getCarrierCode());
        $method->setCarrierTitle($data['title']);

        $method->setMethod($data['method_code']);
        $method->setMethodTitle($data['method']);

        $method->setPrice($data['price']);
        $method->setCost($data['price']);

        return $method;
    }

    public function isZipCodeRequired($countryId = null)
    {
        return true;
    }

    public function isCityRequired()
    {
        return true;
    }

    public function isStateProvinceRequired()
    {
        return true;
    }
}
