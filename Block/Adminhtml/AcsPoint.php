<?php

namespace AfterSalesProGr\AcsPoints\Block\Adminhtml;

use AfterSalesProGr\AcsPoints\Cron\UpdateAcsPoints;
use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Sales\Model\ConfigInterface;

class AcsPoint extends \Magento\Sales\Block\Adminhtml\Order\View
{
    /**
     * @var \Magento\Framework\Filesystem\Io\File
     */
    protected $file;

    /**
     * @var \Magento\Framework\Filesystem
     */
    protected $filesystem;

    protected $point = [];

    public function __construct(
        \Magento\Backend\Block\Widget\Context $context,
        \Magento\Framework\Registry $registry,
        ConfigInterface $salesConfig,
        \Magento\Sales\Helper\Reorder $reorderHelper,
        \Magento\Framework\Filesystem\Io\File $file,
        \Magento\Framework\Filesystem $filesystem,
        array $data = []
    ) {
        $this->file = $file;
        $this->filesystem = $filesystem;
        parent::__construct($context, $registry, $salesConfig, $reorderHelper, $data);
    }

    public function getPointIcon()
    {
        return $this->getPointData('icon');
    }

    public function getPointName()
    {
        return $this->getPointData('name').' ('.$this->getPointData('Acs_Station_Destination').$this->getPointData('Acs_Station_Branch_Destination').')';
    }

    public function getPointStreet()
    {
        return $this->getPointData('street');
    }

    public function getPointMapUrl()
    {
        return "https://maps.google.com/?q={$this->getPointData('lat')},{$this->getPointData('lon')}";
    }

    protected function getPointData($key)
    {
        if ($this->hasPoint() && array_key_exists($key, $this->getAcsPoint())) {
            return $this->getAcsPoint()[$key];
        }
        return null;
    }

    public function hasPoint()
    {
        return !empty($this->getAcsPointId()) && !empty($this->getAcsPoint());
    }

    public function getAcsPointId()
    {
        return $this->getOrder()->getAcsPpPointId();
    }

    protected function getAcsPoint()
    {
        if (!empty($this->point)) {
            return $this->point;
        }
        $dataDirectory = $this->filesystem->getDirectoryRead(DirectoryList::PUB)->getAbsolutePath(UpdateAcsPoints::DATA_FOLDER);
        $data = $this->file->read("$dataDirectory/acs-points.json");
        $acs_data = json_decode($data, true);
        if (!empty($acs_data) && !empty($acs_data['points'])) {
            $index = array_column($acs_data['points'], 'id');
            $map = array_flip($index);
            $point = $acs_data['points'][$map[$this->getAcsPointId()] ?? null] ?? false;
            if ($point) {
                $this->point = $point;
            }
        }
        return $this->point;
    }
}
