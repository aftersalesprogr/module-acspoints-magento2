<?php

namespace AfterSalesProGr\AcsPoints\Block;

use AfterSalesProGr\AcsPoints\Model\Carrier\Custom;
use Magento\Store\Model\ScopeInterface;

class HeadJs extends \Magento\Framework\View\Element\Template
{
    public function getApiKey()
    {
        return $this->_scopeConfig->getValue('carriers/'.Custom::METHOD_CODE.'/googleApiKey', ScopeInterface::SCOPE_STORE);
    }
}
