<?php

namespace AfterSalesProGr\AcsPoints\Observer;

class SaveAcsPointFieldObserver implements \Magento\Framework\Event\ObserverInterface
{
    /**
     * @var \Magento\Framework\ObjectManagerInterface
     */
    protected $_objectManager;

    /**
     * @param  \Magento\Framework\ObjectManagerInterface  $objectmanager
     */
    public function __construct(
        \Magento\Framework\ObjectManagerInterface $objectmanager
    ) {
        $this->_objectManager = $objectmanager;
    }

    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $order = $observer->getOrder();
        $quoteRepository = $this->_objectManager->create('Magento\Quote\Model\QuoteRepository');
        /** @var \Magento\Quote\Model\Quote $quote */
        $quote = $quoteRepository->get($order->getQuoteId());
        $order->setAcsPpPointId($quote->getAcsPpPointId());
        $order->setAcsPpPointSlug($quote->getAcsPpPointSlug());
        return $this;
    }
}
