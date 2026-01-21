<?php

namespace MageMe\WebFormsLiteBreeze\Plugin;

use MageMe\WebFormsLite\Config\CssOrder;
use Swissup\Breeze\Helper\Data;

class Field
{
    /**
     * @var array
     */
    private $scripts = [
        'autocomplete' => [
            'MageMe_WebFormsLite/js/auto-complete'
        ],
        'date' => [
            'MageMe_WebFormsLiteBreeze/js/breeze/datepicker'
        ],
        'phone_number' => [
            'phoneUtils'
        ],
        'file' => [
            'MageMe_WebFormsLite/js/dropzone'
        ],
        'image' => [
            'MageMe_WebFormsLite/js/dropzone'
        ],
    ];

    /**
     * @var array
     */
    private $css = [
        'subscribe' => [
            'MageMe_WebFormsLiteBreeze::css/breeze/field/subscription.css'
        ],
    ];

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
     * @param \MageMe\WebFormsLite\Block\Form\Element\Field $block
     * @param string $html
     * @return string
     */
    public function afterToHtml(\MageMe\WebFormsLite\Block\Form\Element\Field $block, string $html): string
    {
        if (!$this->breezeHelper->isEnabled()) {
            return $html;
        }
        $scriptHtml = '';
        if (key_exists($block->getField()->getType(), $this->scripts)) {
            foreach ($this->scripts[$block->getField()->getType()] as $script) {
                $scriptHtml .= "<div data-mage-init='{\"$script\": {}}'></div>";
            }
        }
        if (key_exists($block->getField()->getType(), $this->css)) {
            foreach ($this->css[$block->getField()->getType()] as $css) {
                $scriptHtml .= $this->getCssScript($block->getViewFileUrl($css), CssOrder::FIELDS + 1);
            }
        }
        return $scriptHtml . $html;
    }

    /**
     * @param string $path
     * @param int $order
     * @return string
     */
    private function getCssScript(string $path, int $order = CssOrder::FIELDS): string
    {
        return sprintf("<script data-breeze>
            (() => {
                if (!window.MageMe || !MageMe.loader) {
                    return;
                }
                MageMe.loader.addCssOrdered(
                    '%s',
                    '%s'
                );
            })();
        </script>
        ", $path, $order);
    }
}
