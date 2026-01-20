<?php

namespace MageMe\WebFormsLiteBreeze\Plugin\Captcha;

use Swissup\Breeze\Helper\Data;

class Recaptcha
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
     * @param \MageMe\WebFormsLite\Block\Form\Element\Captcha\Type\Recaptcha $captcha
     * @param mixed $template
     * @return mixed
     */
    public function afterGetTemplate(\MageMe\WebFormsLite\Block\Form\Element\Captcha\Type\Recaptcha $captcha, $template)
    {
        if (!$this->breezeHelper->isEnabled()) {
            return $template;
        }
        if (!$captcha->getForm() || !$captcha->getForm()->getCaptcha()) {
            return $template;
        }
        return 'MageMe_WebFormsLiteBreeze::form/element/captcha/type/reCaptcha.phtml';
    }
}