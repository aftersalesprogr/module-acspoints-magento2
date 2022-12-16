<?php

namespace AfterSalesProGr\AcsPoints\Block\System\Config;

use Magento\Config\Block\System\Config\Form\Field;
use Magento\Framework\Data\Form\Element\AbstractElement;
use Magento\Store\Model\ScopeInterface;

class UpdatePointsButton extends Field
{
    protected $_template = 'AfterSalesProGr_AcsPoints::system/config/update_points_button.phtml';

    public function render(AbstractElement $element)
    {
        $element->unsScope()->unsCanUseWebsiteValue()->unsCanUseDefaultValue();
        return parent::render($element);
    }
    public function getAjaxUrl()
    {
        return $this->getUrl('acs_points/updatePoints/index');
    }

    public function getButtonHtml()
    {
        return $this->getLayout()->createBlock('Magento\Backend\Block\Widget\Button')->setData([
            'id' => 'update_points', 'label' => __('Update Points'),
        ])->toHtml();
    }

    protected function _getElementHtml(AbstractElement $element)
    {
        return $this->_toHtml();
    }
}
