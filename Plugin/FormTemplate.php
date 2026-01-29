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
}
