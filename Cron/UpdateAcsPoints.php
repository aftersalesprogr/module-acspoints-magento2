<?php

namespace AfterSalesProGr\AcsPoints\Cron;

use Magento\Framework\App\Filesystem\DirectoryList;

class UpdateAcsPoints
{
    const DATA_FOLDER = DirectoryList::MEDIA.'\acs';

    /**
     * @var \AfterSalesProGr\AcsPoints\Helper\Data
     */
    protected $helper;

    /**
     * UpdateAcsPoints constructor.
     * @param  \AfterSalesProGr\AcsPoints\Helper\Data  $helper
     */
    public function __construct(
        \AfterSalesProGr\AcsPoints\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * Execute the cron
     *
     * @return void
     */
    public function execute()
    {
        $this->helper->updatePoints();
    }
}
