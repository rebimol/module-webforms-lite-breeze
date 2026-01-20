<?php

namespace MageMe\WebFormsLiteBreeze\Plugin;

use MageMe\WebFormsLite\Block\Form;
use MageMe\WebFormsLite\Config\CssOrder;
use Swissup\Breeze\Helper\Data;

class FormTemplate
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
     * @param Form $form
     * @param mixed $template
     * @return mixed
     */
    public function afterGetTemplate(Form $form, $template)
    {
        if (!$this->breezeHelper->isEnabled()) {
            return $template;
        }
        if ($template == Form::ASYNC_TEMPLATE) {
            $template = 'MageMe_WebFormsLiteBreeze::' . Form::ASYNC_TEMPLATE;
            $form->setTemplate($template);
        }
        return $template;
    }

    /**
     * @param Form $block
     * @param string $html
     * @return string
     */
    public function afterToHtml(Form $block, string $html): string
    {
        if (!$this->breezeHelper->isEnabled()) {
            return $html;
        }
        $template = (string)$block->getTemplate();
        $scriptHtml = '';
        if (str_contains($template, 'multistep')) {
            $scriptHtml .= "<div data-mage-init='{\"MageMe_WebFormsLite/js/multistep\": {}}'></div>";
        }
        return $scriptHtml . $html;
    }

    /**
     * @param string $path
     * @param int $order
     * @return string
     */
    private function getCssScript(string $path, int $order = CssOrder::FORMS): string
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
