<?php
/**
 * Copyright ©  All rights reserved.
 * See COPYING.txt for license details.
 */
declare(strict_types=1);

namespace AfterSalesProGr\AcsPoints\Helper;

use AfterSalesProGr\AcsPoints\Cron\UpdateAcsPoints;
use AfterSalesProGr\AcsPoints\Model\Carrier\Custom;
use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\App\Helper\AbstractHelper;

class Data extends AbstractHelper
{
    /**
     * Core store config
     *
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $_scopeConfig;

    /**
     * @var \Magento\Framework\Filesystem\Io\File
     */
    protected $file;

    /**
     * @var \Magento\Framework\Filesystem
     */
    protected $filesystem;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $storeManager;

    /**
     * @var \Psr\Log\LoggerInterface
     */
    protected $logger;

    /**
     * Data constructor.
     * @param  \Magento\Framework\App\Helper\Context  $context
     * @param  \Magento\Framework\App\Config\ScopeConfigInterface  $scopeConfig
     * @param  \Magento\Framework\Filesystem\Io\File  $file
     * @param  \Magento\Framework\Filesystem  $filesystem
     * @param  \Magento\Store\Model\StoreManagerInterface  $storeManager
     * @param  \Psr\Log\LoggerInterface  $logger
     */
    public function __construct(
        \Magento\Framework\App\Helper\Context $context,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Filesystem\Io\File $file,
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Psr\Log\LoggerInterface $logger
    ) {
        $this->_scopeConfig = $scopeConfig;
        $this->file = $file;
        $this->filesystem = $filesystem;
        $this->storeManager = $storeManager;
        $this->logger = $logger;
        parent::__construct($context);
    }

    public function updatePoints()
    {
        $dataDirectory = $this->filesystem->getDirectoryRead(DirectoryList::PUB)->getAbsolutePath(UpdateAcsPoints::DATA_FOLDER);
        if (!$this->filesystem->getDirectoryWrite(DirectoryList::PUB)->isDirectory($dataDirectory)) {
            $this->file->mkdir($dataDirectory, 0775);
        }
        $points = $this->getPoints();
        if (!empty($points)) {
            $this->file->write("$dataDirectory/acs-points.json", json_encode($points, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        return $points;
    }

    public function getPoints()
    {
        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->request('POST', 'https://webservices.acscourier.net/ACSRestServices/api/ACSAutoRest', [
                'body'    => json_encode([
                    'ACSAlias'           => 'ACS_Get_Stations_For_Plugin',
                    'ACSInputParameters' => [
                        'locale'           => null,
                        'Company_ID'       => $this->getConfigData('acsCompanyID'),
                        'Company_Password' => $this->getConfigData('acsCompanyPassword'),
                        'User_ID'          => $this->getConfigData('acsUserID'),
                        'User_Password'    => $this->getConfigData('acsUserPassword'),
                    ],
                ]),
                'headers' => [
                    'Accept'        => 'application/json',
                    'Cache-Control' => 'no-cache',
                    'Content-Type'  => 'application/json',
                    'ACSApiKey'     => $this->getConfigData('acsApiKey'),
                ],
            ]);

            $body = json_decode((string) $response->getBody()->getContents(), true);

            $points = $body['ACSOutputResponce']['ACSTableOutput']['Table_Data1'] ?? [];

            $points = array_values(array_filter($points, function ($item) {
                return $item['type'] !== 'branch' || $item['Acs_Station_Branch_Destination'] == '1';
            }));

            return [
                'timestamp' => date('Y-m-d H:i'),
                'meta'      => $body['ACSOutputResponce']['ACSTableOutput']['Table_Data'] ?? [],
                'points'    => $points,
            ];
        } catch (\Exception $e) {
            $this->logger->error("ACS Points Update: ".$e->getMessage());
            return [];
        }
    }

    public function getConfigData($field)
    {
        return $this->_scopeConfig->getValue('carriers/'.Custom::METHOD_CODE.'/'.$field, \Magento\Store\Model\ScopeInterface::SCOPE_STORE, $this->storeManager->getStore());
    }
}
