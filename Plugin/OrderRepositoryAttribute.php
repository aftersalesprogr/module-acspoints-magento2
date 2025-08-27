<?php

namespace AfterSalesProGr\AcsPoints\Plugin;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\Data\OrderExtensionFactory;
use Magento\Sales\Api\Data\OrderSearchResultInterface;

class OrderRepositoryAttribute
{
    /**
     * @var OrderExtensionFactory
     */
    private $extensionFactory;

    /**
     * @param OrderExtensionFactory $extensionFactory
     */
    public function __construct(OrderExtensionFactory $extensionFactory)
    {
        $this->extensionFactory = $extensionFactory;
    }

    public function afterGet(OrderRepositoryInterface $subject, OrderInterface $order)
    {
        $extensionAttributes = $order->getExtensionAttributes();
        $extensionAttributes = $extensionAttributes ? $extensionAttributes : $this->extensionFactory->create();
        $extensionAttributes->setData('acs_pp_point_id', $order->getData('acs_pp_point_id'));
        $extensionAttributes->setData('acs_pp_point__slug', $order->getData('acs_pp_point__slug'));
        $order->setExtensionAttributes($extensionAttributes);
        return $order;
    }

    public function afterGetList(OrderRepositoryInterface $subject, OrderSearchResultInterface $searchResult)
    {
        $orders = $searchResult->getItems();

        foreach ($orders as &$order) {
            $customAttributeId = $order->getData('acs_pp_point_id');
            $customAttributeSlug = $order->getData('acs_pp_point_slug');

            $extensionAttributes = $this->extensionFactory->create();
            $extensionAttributes->setData('acs_pp_point_id', $customAttributeId);
            $extensionAttributes->setData('acs_pp_point_slug', $customAttributeSlug);
            $order->setExtensionAttributes($extensionAttributes);
        }

        return $searchResult;
    }
}
