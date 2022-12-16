<?php

namespace AfterSalesProGr\AcsPoints\Model\Config;

use AfterSalesProGr\AcsPoints\Model\Carrier\Custom;

class UpdatePoints extends \Magento\Framework\App\Config\Value
{
    /**
     * @var \AfterSalesProGr\AcsPoints\Helper\Data
     */
    protected $helper;

    public function __construct(
        \Magento\Framework\Model\Context $context,
        \Magento\Framework\Registry $registry,
        \Magento\Framework\App\Config\ScopeConfigInterface $config,
        \Magento\Framework\App\Cache\TypeListInterface $cacheTypeList,
        \AfterSalesProGr\AcsPoints\Helper\Data $helper,
        \Magento\Framework\Model\ResourceModel\AbstractResource $resource = null,
        \Magento\Framework\Data\Collection\AbstractDb $resourceCollection = null,
        array $data = []
    )
    {
        $this->helper = $helper;
        parent::__construct($context, $registry, $config, $cacheTypeList, $resource, $resourceCollection, $data);
    }

    public function afterSave()
    {
        $acsCompanyID = $this->getData('groups/'.Custom::METHOD_CODE.'/fields/acsCompanyID/value');
        $acsCompanyPassword = $this->getData('groups/'.Custom::METHOD_CODE.'/fields/acsCompanyPassword/value');
        $acsUserID = $this->getData('groups/'.Custom::METHOD_CODE.'/fields/acsUserID/value');
        $acsUserPassword = $this->getData('groups/'.Custom::METHOD_CODE.'/fields/acsUserPassword/value');
        if (!empty($acsCompanyID) && !empty($acsCompanyPassword) && !empty($acsUserID) && !empty($acsUserPassword)){
            $this->helper->updatePoints();
        }

        return parent::afterSave();
    }
}
