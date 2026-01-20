<?php

namespace MageMe\WebFormsLiteBreeze\Plugin;

use Magento\Framework\View\Element\Template;
use Swissup\Breeze\Helper\Data;

class DateTemplate
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
     * @param Template $block
     * @param mixed $template
     * @return mixed
     */
    public function afterGetTemplate(Template $block, $template)
    {
        if (!$this->breezeHelper->isEnabled()) {
            return $template;
        }
        if ($template == 'form/element/field/type/date.phtml') {
            $template = 'MageMe_WebFormsLiteBreeze::form/element/field/type/date.phtml';
            $block->setTemplate($template);
        }
        return $template;
    }
}