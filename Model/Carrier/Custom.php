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

        $weightTotal = $request->getPackageWeight();
        if ($weightTotal > $this->getConfigData('weightUpperLimit')) {
            return false;
        }

        $items = $request->getAllItems();
        foreach ($items as $item) {
            $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
            $product = $objectManager->create('Magento\Catalog\Model\Product')->load($item->getProductId());
            if ($product->getData('disable_locker') == 1) {
                return false;
            }
        }

        $shipment_price = $request->getPackageValue();

        $result = $this->_rateResultFactory->create();

        $isFreeShipping = $this->getConfigData('freeShippingUpperLimit') > 0 && $shipment_price >= $this->getConfigData('freeShippingUpperLimit');

        $methodPrice = 0;
        if (!$isFreeShipping) {
            $settings = [
                'dispatcherCountry' => $this->getConfigData('senderCountry') ?? 'GR',
                'dispatcherZipcode' => $this->getConfigData('senderZipcode') ?? '',
                'acsClientId' => $this->getConfigData('acsClientId') ?? '',
                'pricing' => [
                    'same_city' => [
                        'baseCost' => $this->getConfigData('basePriceCity'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeightCity'),
                        'costPerKg' => $this->getConfigData('costPerKgCity'),
                    ],
                    'island' => [
                        'baseCost' => $this->getConfigData('basePriceIsland'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeightIsland'),
                        'costPerKg' => $this->getConfigData('costPerKgIsland'),
                    ],
                    'region' => [
                        'baseCost' => $this->getConfigData('basePriceRegion'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeightRegion'),
                        'costPerKg' => $this->getConfigData('costPerKgRegion'),
                    ],
                    'overland' => [
                        'baseCost' => $this->getConfigData('basePrice'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeight'),
                        'costPerKg' => $this->getConfigData('costPerKg'),
                    ],
                    'internal_cyprus' => [
                        'baseCost' => $this->getConfigData('basePriceInCy'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeightInCy'),
                        'costPerKg' => $this->getConfigData('costPerKgInCy'),
                    ],
                    'cyprus' => [
                        'baseCost' => $this->getConfigData('basePriceCy'),
                        'baseCostKgLimit' => $this->getConfigData('baseWeightCy'),
                        'costPerKg' => $this->getConfigData('costPerKgCy'),
                    ],
                ]
            ];

            $sender_country = $settings['dispatcherCountry'];
            $sender_zipcode = $settings['dispatcherZipcode'];
            $sender_billing_code = $settings['acsClientId'];

            $recipient_zipcode = $request->getDestPostcode();
            $recipient_country = $request->getDestCountryId();

            $costGroup = $this->calculate_type($sender_country, $sender_zipcode, $sender_billing_code, $recipient_country, $recipient_zipcode);

            $baseCost = $settings['pricing'][$costGroup]['baseCost'] ?? 0;
            $baseCostKgLimit = $settings['pricing'][$costGroup]['baseCostKgLimit'] ?? 0;
            $costPerKg = $settings['pricing'][$costGroup]['costPerKg'] ?? 0;
            
            $methodPrice = $baseCost;
            if ($weightTotal > $baseCostKgLimit) {
                $methodPrice += $costPerKg * ($weightTotal - $baseCostKgLimit);
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
    function calculate_type(
        $sender_country,
        $sender_zipcode,
        $sender_billing_code,
        $recipient_country,
        $recipient_zipcode
    )
    {
        preg_match('/\d([^\d]{2})\d+/u', $sender_billing_code, $matches);
        $sender_store = $matches[1] ?? null;
        $sender_zipcode_data = $this->getDataFromZipcode($sender_zipcode);
        $recipient_zipcode_data = $this->getDataFromZipcode($recipient_zipcode);

        if (!in_array($recipient_country, ['GR', 'CY']) && !in_array($sender_country, ['GR', 'CY'])) {
            return false;
        }

        if ($sender_country === 'CY' && $recipient_country === 'CY') {
            return 'internal_cyprus';
        }

        if ($sender_country === 'CY' || $recipient_country === 'CY') {
            return 'cyprus';
        }

        if ($sender_store == $recipient_zipcode_data['store']) {
            return 'same_city';
        }

        if ($recipient_zipcode_data['category'] == 'ΝΗΣΙΩΤΙΚΟΣ') {
            return 'island';
        }

        if (
            $recipient_zipcode_data['region'] != ''
            && $sender_zipcode_data['region'] != ''
            && $recipient_zipcode_data['region'] == $sender_zipcode_data['region']
        ) {
            return 'region';
        }

        return 'overland';
    }

    function getDataFromZipcode($recipient_zipcode)
    {
        $json = file_get_contents(__DIR__ . '/mapper.json');
        $data = json_decode($json, true);

        return [
            'store' => $data[$recipient_zipcode]['store'] ?? null,
            'category' => $data[$recipient_zipcode]['category'] ?? null,
            'region' => $data[$recipient_zipcode]['region'] ?? null,
        ];
    }
}
