<?php

namespace AfterSalesProGr\AcsPoints\Plugin\Checkout;

class ShippingInformationManagement
{
    /**
     * @var \Magento\Quote\Api\CartRepositoryInterface
     */
    protected $cartRepository;

    public function __construct(
        \Magento\Quote\Api\CartRepositoryInterface $cartRepository
    ) {
        $this->cartRepository = $cartRepository;
    }

    /**
     * If anything goes wrong here checkout is blocked
     * fires on shipping next button
     *
     * @param  \Magento\Checkout\Model\ShippingInformationManagement  $subject
     * @param $cartId
     * @param  \Magento\Checkout\Api\Data\ShippingInformationInterface  $addressInformation
     */
    public function beforeSaveAddressInformation(
        \Magento\Checkout\Model\ShippingInformationManagement $subject,
        $cartId,
        \Magento\Checkout\Api\Data\ShippingInformationInterface $addressInformation
    ) {
        $extensionAttributes = $addressInformation->getExtensionAttributes();
        $quote = $this->cartRepository->getActive($cartId);
        $quote->setAcsPpPointId($extensionAttributes->getAcsPpPointId());
        $quote->setAcsPpPointSlug($extensionAttributes->getAcsPpPointSlug());
        return [$cartId, $addressInformation]; // needed?
    }
}
