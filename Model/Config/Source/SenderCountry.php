<?php
namespace AfterSalesProGr\AcsPoints\Model\Config\Source;

class SenderCountry implements \Magento\Framework\Option\ArrayInterface
{
    public function toOptionArray(): array
    {
        return [
            ['value' => 'GR', 'label' => __('Greece (GR)')],
            ['value' => 'CY', 'label' => __('Cyprus (CY)')],
        ];
    }

    public function toArray(): array
    {
        return [
            'GR' => __('Greece (GR)'),
            'CY' => __('Cyprus (CY)'),
        ];
    }
}
