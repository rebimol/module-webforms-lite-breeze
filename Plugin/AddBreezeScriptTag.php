<?php

namespace MageMe\WebFormsLiteBreeze\Plugin;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\View\Element\AbstractBlock;
use Swissup\Breeze\Helper\Data;

class AddBreezeScriptTag
{
    /**
     * @var Data
     */
    private $breezeHelper;

    /**
     * @param Data $breezeHelper
     */
    public function __construct(Data $breezeHelper)
    {
        $this->breezeHelper = $breezeHelper;
    }

    /**
     * @param AbstractBlock $block
     * @param string|null $html
     * @return string
     * @throws LocalizedException
     */
    public function afterToHtml(AbstractBlock $block, ?string $html): string
    {
        if (!$this->breezeHelper->isEnabled() ||
            str_contains((string)$block->getTemplate(), 'WebFormsLiteBreeze') ||
            !str_contains(get_class($block), 'WebFormsLite')
        ) {
            return (string)$html;
        }
        return preg_replace(
            [
                '/<script/',
                '/window.addEventListener\([\',"]load[\',"]/'
            ],
            [
                '<script data-breeze',
                'document.addEventListener("breeze:load"',
            ],
            (string)$html
        );
    }
}
