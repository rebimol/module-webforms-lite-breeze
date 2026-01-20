/* WebForms 3.5.0 */
'use strict';
define([], function () {
    (function (root, factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define([], factory);
        } else if (typeof module === 'object' && module.exports) {
            // Node. Does not work with strict CommonJS, but
            // only CommonJS-like environments that support module.exports,
            // like Node.
            module.exports = factory();
        } else {
            // Browser globals (root is window)
            root.mmForm = factory();
        }
    }(typeof self !== 'undefined' ? self : this, function () {
        function Form(options) {
            const defaults = {
                submitUrl: '',
                reviewUrl: '',
                uid: '',
                formId: '',
                ajax: true,
                success: false,
                displayAfterSubmission: false,
                scrollAfterSubmission: false,
                showReview: false,
                saveDataLocal: false,
                useCaptcha: false,
                captchaResponseName: '',
                captchaPromise: null,
                captchaToken: '',
                messages: {
                    success: 'Success!',
                    redirecting: 'Redirecting',
                    complete: 'Complete',
                    error: 'Error',
                    captchaTxt: 'Please click on the Captcha',
                    errorTxt: 'Error(s) occurred. Please try again.',
                    unknownTxt: 'Unknown error(s) occurred'
                },
                controls: {},
                modal: null,
                saveTimer: null,
                savePeriod: 3000,
                validateFieldInline: true,
                validateRequired: true,
                validateFieldSelector: '[data-validate]',

                // callbacks
                beforeInit: null,
                afterInit: null,
                beforeValidation: null,
                validationCb: null,
                afterValidation: null,
                beforeReview: null,
                afterReview: null,
                beforeSubmit: null,
                afterSubmit: null,
                beforeFieldValidation: null,
                fieldValidationCb: null,
                afterFieldValidation: null,

                // lib ref
                swal: null,
                tingle: null
            }

            // extends config
            Object.assign(this, defaults, options);

            if (!this.swal && window.swal) {
                this.swal = window.swal;
            }
            if (!this.tingle && window.tingle) {
                this.tingle = window.tingle;
            }

            return this.init();
        }

        Form.prototype.init = function () {
            if (typeof this.beforeInit === 'function') {
                this.beforeInit(this);
            }
            const formId = 'webform_' + this.uid;
            this.controls = {
                block: document.getElementById(formId + '_form'),
                form: document.getElementById(formId),
                sendingData: document.getElementById(formId + '_sending_data'),
                progressText: document.getElementById(formId + '_progress_text'),
                successText: document.getElementById(formId + '_success_text'),
                submitButton: document.getElementById(formId + '_submit_button')
            }
            this.pushForm(this);
            this.controls.form.onsubmit = (e) => {
                e.preventDefault();
                if (this.showReview) {
                    this.review();
                } else {
                    this.submit();
                }
            }
            if (this.showReview) {
                document.addEventListener('webforms_review_confirm', (e) => {
                    if (e.detail.uid === this.uid) {
                        this.submit();
                    }
                });
            }
            if (this.saveDataLocal) {
                if (this.success) {
                    this.clearData();
                }
                this.loadData();
                this.saveTimer = setInterval(() => {
                    this.saveData()
                }, this.savePeriod);
            }
            if (this.useCaptcha) {
                this.getCaptchaPromise();
            }
            if (this.validateFieldInline) {
                const formObj = this;
                this.controls.form.querySelectorAll(this.validateFieldSelector).forEach((field => {
                    if (typeof field.initValidation === 'function') {
                        field.initValidation(formObj);
                    } else {
                        field.addEventListener('focusout', () => {
                            if (!field.value && !formObj.validateRequired) {
                                return;
                            }
                            formObj.validateField(field);
                        });
                    }
                }));
                document.addEventListener('webforms_field_created', (event) => {
                    if (event.detail.input) {
                        const input = event.detail.input;

                        input.addEventListener('focusout', () => {
                            if (!input.value && !this.validateRequired) {
                                return;
                            }
                            this.validateField(input);
                        });
                    }
                });
            }
            if (typeof this.afterInit === 'function') {
                this.afterInit(this);
            }
            return this;
        }

        Form.prototype.validate = async function () {
            let valid = true;
            if (typeof this.beforeValidation === 'function') {
                valid = this.beforeValidation(this)
            }
            if (typeof this.validationCb === 'function') {
                valid = await this.validationCb(this, valid)
            }
            if (this.useCaptcha) {
                const cid = this.getCaptchaCid();
                if (this.captchaPromise && cid) {
                    this.captchaToken = await this.captchaPromise(cid, this);
                } else {
                    this.captchaToken = '';
                }
                if (!this.captchaToken) {
                    valid = false;
                    this.showMessage(this.messages.error, this.messages.captchaTxt, 'error');
                }
            }
            if (typeof this.afterValidation === 'function') {
                this.afterValidation(this, valid)
            }
            return valid;
        }

        Form.prototype.review = async function () {
            if (typeof this.beforeReview === 'function') {
                this.beforeReview(this)
            }
            const valid = await this.validate();
            if (valid) {
                this.controls.form.querySelector('input[name=form_key]').value = this.getFormKey();
                if (this.tingle) {
                    const modal = new this.tingle.modal({
                        beforeOpen: () => {
                            const xhr = new XMLHttpRequest();
                            const formData = new FormData(this.controls.form);
                            xhr.open('POST', this.reviewUrl, true);
                            xhr.responseType = 'json';
                            xhr.upload.onloadstart = () => {
                                this.controls.submitButton.disabled = true;
                                this.showElement(this.controls.sendingData);
                            }
                            xhr.upload.onerror = () => {
                                this.controls.submitButton.disabled = false;
                                this.hideElement(this.controls.sendingData);
                                this.showMessage(this.messages.error, this.messages.errorTxt, 'error');
                                modal.close();
                            }
                            xhr.onloadend = () => {
                                this.controls.submitButton.disabled = false;
                                this.hideElement(this.controls.sendingData);
                                let data = xhr.response ?? {};
                                if (!data.success) {
                                    let errorTxt;
                                    if (data.errors && typeof (data.errors) == "string") {
                                        errorTxt = data.errors;
                                    } else {
                                        errorTxt = this.messages.unknownTxt;
                                    }
                                    this.showMessage(this.messages.error, errorTxt, 'error');
                                    return modal.close();
                                }
                                const content = document.createElement('div');
                                content.append(document.createRange().createContextualFragment(data.html));
                                modal.setContent(content);
                            };
                            xhr.send(formData);
                        }
                    });
                    modal.open();
                    this.modal = modal;
                } else {
                    const formData = {};
                    this.controls.form.formData.forEach((value, key) => formData[key] = value);
                    alert(JSON.stringify(formData));
                }
            }
            if (typeof this.afterReview === 'function') {
                this.afterReview(this, valid)
            }
            return this;
        }

        Form.prototype.submit = async function () {
            const beforeSubmitEvent = new CustomEvent('webforms_before_submit', {
                detail: {
                    'form': this
                }
            });
            document.dispatchEvent(beforeSubmitEvent);
            if (typeof this.beforeSubmit === 'function') {
                this.beforeSubmit(this)
            }
            this.closeModal();
            const valid = await this.validate();
            if (valid) {
                this.controls.form.querySelector('input[name=form_key]').value = this.getFormKey();
                if (this.ajax) {
                    await this.submitAjax();
                } else {
                    await this.submitPost();
                }
            }
            if (typeof this.afterSubmit === 'function') {
                this.afterSubmit(this, valid)
            }
            return this;
        }

        Form.prototype.submitAjax = async function () {
            const formData = new FormData(this.controls.form);
            formData.append('submitted_from', JSON.stringify(
                {
                    'url': window.location.href,
                    'title': document.title
                })
            );
            formData.append('referrer_page', document.referrer);
            formData.append('captcha_token', this.captchaToken);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.submitUrl, true);
            xhr.responseType = 'json';
            xhr.upload.onloadstart = () => {
                this.controls.submitButton.disabled = true;
                this.showElement(this.controls.sendingData);
            }
            xhr.upload.onerror = () => {
                console.log(this.messages.errorTxt);
                console.log(xhr.status);
                this.controls.submitButton.disabled = false;
                this.hideElement(this.controls.sendingData);
            }
            xhr.onloadend = () => {
                let data = xhr.response ?? {};
                if (data.success > 0) {
                    const afterSubmitSuccess = new CustomEvent('webforms_after_submit_success', {
                        detail: {
                            uid : this.uid,
                            data: data
                        }
                    });
                    document.dispatchEvent(afterSubmitSuccess);
                    this.clearData();
                    if (data.script) {
                        eval(data.script);
                        return;
                    }
                    if (data.after_submission_script) {
                        eval(data.after_submission_script);
                    }
                    if (data.redirect_url) {
                        this.controls.progressText.innerText = this.messages.redirecting;
                        window.location = data.redirect_url;
                        return;
                    }
                    const successText = data.success_text;
                    if (this.displayAfterSubmission) {
                        this.controls.submitButton.disabled = false;
                        this.hideElement(this.controls.sendingData);
                        this.controls.form.reset();
                        if (typeof DROPZONE !== "undefined") {
                            if (typeof DROPZONE['_' + this.uid] !== "undefined") {
                                for (let i = 0; i < DROPZONE['_' + this.uid].length; i++) {
                                    DROPZONE['_' + this.uid][i].reset();
                                }
                            }
                        }
                        this.showMessage('', successText, 'success');
                        if (this.useCaptcha) {
                            this.reloadCaptcha();
                        }
                    } else {
                        this.controls.progressText.innerText = this.messages.complete;
                        this.fadeOut(this.controls.block);
                        this.controls.successText.append(document.createRange().createContextualFragment(successText));
                        this.fadeIn(this.controls.successText);
                        if (this.scrollAfterSubmission) {
                            window.scrollTo({top: this.controls.successText.offsetTop, behavior: 'smooth'});
                        }
                    }
                } else {
                    this.controls.submitButton.disabled = false;
                    if (this.controls.sendingData) {
                        this.hideElement(this.controls.sendingData);
                    }
                    if (this.controls.submitButton) {
                        this.controls.submitButton.disabled = false;
                    }
                    let errorTxt;
                    if (data.errors && typeof (data.errors) == "string") {
                        errorTxt = data.errors;
                    } else {
                        errorTxt = this.messages.unknownTxt;
                    }
                    this.showMessage(this.messages.error, errorTxt, 'error');

                    if (data.script) {
                        eval(data.script);
                    }
                }
            }
            xhr.send(formData);
        }

        Form.prototype.submitPost = async function () {
            this.controls.form.setAttribute('action', this.submitUrl);

            let input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'submitted_from');
            input.setAttribute('value', JSON.stringify(
                {
                    'url': window.location.href,
                    'title': document.title
                })
            );
            this.controls.form.appendChild(input);

            input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'referrer_page');
            input.setAttribute('value', document.referrer);
            this.controls.form.appendChild(input);

            input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'captcha_token');
            input.setAttribute('value', this.captchaToken);
            this.controls.form.appendChild(input);

            this.controls.form.submit();
            this.clearData();
        }

        Form.prototype.showMessage = function (title, message, type) {
            if (this.swal) {
                this.swal.fire({
                    title: title,
                    html: message,
                    type: type
                });
            } else {
                alert(message);
            }
        }

        Form.prototype.reloadCaptcha = function () {
            const cid = this.getCaptchaCid();
            if (!cid === null) {
                window.dispatchEvent(new CustomEvent('mm-form-captcha-reload', {
                    detail: {
                        'cid': cid
                    }
                }));
            }
        }

        Form.prototype.setCaptchaPromise = function (promise) {
            this.captchaPromise = promise;
        }

        Form.prototype.getCaptchaPromise = function () {
            const cid = this.getCaptchaCid();
            if (cid !== null) {
                window.dispatchEvent(new CustomEvent('mm-form-captcha-promise', {
                    detail: {
                        'cid': cid,
                        'form': this
                    }
                }));
            }
            if (this.captchaPromise == null) {
                setTimeout(this.getCaptchaPromise.bind(this), 500);
            }
        }

        Form.prototype.getCaptchaCid = function () {
            const captchaContainer = document.getElementById('captcha-container-' + this.uid);
            if (captchaContainer) {
                const cidContainer = captchaContainer.querySelector('div[cid]');
                if (cidContainer) {
                    return cidContainer.getAttribute('cid');
                }
            }
            return null;
        }

        Form.prototype.pushForm = function (form) {
            if (!window.mmForms) {
                window.mmForms = {}
            }
            window.mmForms[form.uid] = form;
        }

        Form.prototype.getForm = function (uid) {
            if (window.mmForms && window.mmForms[uid]) {
                return window.mmForms[uid];
            }
            return null;
        }

        Form.prototype.getFormKey = function () {
            const formKey = document.cookie.match('(^|; )form_key=([^;]+)(;|$)');
            if (!formKey) {
                return undefined;
            }
            return formKey[2];
        }

        Form.prototype.closeModal = function () {
            if (this.modal) {
                this.modal.close();
            }
        }

        Form.prototype.loadData = function () {
            const formData = JSON.parse(localStorage.getItem('mm_webform_' + this.formId) ?? null) ?? {};
            Object.entries(formData).forEach(function ([key, val]) {
                const input = this.controls.form.querySelector('[id="' + key.replace(formData.uid, this.uid) + '"]');
                if (!input) {
                    return;
                }
                if (typeof input.loadData === 'function') {
                    input.loadData(val, formData.uid);
                } else if (['checkbox', 'radio'].includes(input.type)) {
                    input.checked = val;
                } else if (input.type === 'select-multiple') {
                    if (Array.isArray(val)) {
                        input.querySelectorAll('option').forEach((opt) => {
                            opt.selected = val.includes(opt.value);
                        });
                    }
                } else {
                    input.value = val;
                }
                if (typeof input.onchange === 'function') {
                    input.onchange();
                } else if (typeof input.onclick === 'function') {
                    input.onclick();
                }

            }, this);
            document.dispatchEvent(new CustomEvent('mm-form-data-loaded', {
                detail: {
                    'formData': formData
                }
            }));
        }

        Form.prototype.saveData = function () {
            const formData = {
                uid: this.uid
            };
            this.controls.form.querySelectorAll('select, input, textarea').forEach((input) => {
                if (typeof input.saveData === 'function') {
                    input.saveData(formData)
                } else if (['checkbox', 'radio'].includes(input.type)) {
                    formData[input.id] = input.checked;
                } else if (input.type === 'select-multiple') {
                    formData[input.id] = Array.from(input.selectedOptions).map(v => v.value);
                } else {
                    formData[input.id] = input.value;
                }
            });
            localStorage.setItem('mm_webform_' + this.formId, JSON.stringify(formData));
        }

        Form.prototype.clearData = function () {
            if (this.saveTimer) {
                clearInterval(this.saveTimer);
            }
            localStorage.removeItem('mm_webform_' + this.formId);
        }

        Form.prototype.fadeOut = function (element, step = 0.1, delay = 50) {
            const fadeEffect = setInterval(() => {
                if (!element.style.opacity) {
                    element.style.opacity = 1.0;
                }
                if (element.style.opacity > 0) {
                    element.style.opacity -= step;
                } else {
                    clearInterval(fadeEffect);
                    this.hideElement(element);
                }
            }, delay);
        }

        Form.prototype.fadeIn = function (element, step = 0.1, delay = 50) {
            const fadeEffect = setInterval(() => {
                if (element.style.display === 'none') {
                    element.style.opacity = 0.0;
                    this.showElement(element);
                }
                if (!element.style.opacity) {
                    element.style.opacity = 0.0;
                }
                if (element.style.opacity < 1) {
                    element.style.opacity = parseFloat(element.style.opacity) + step;
                } else {
                    clearInterval(fadeEffect);
                }
            }, delay);
        }

        Form.prototype.hideElement = function (element) {
            element.style.display = 'none';
        }

        Form.prototype.showElement = function (element) {
            element.style.display = 'block';
        }

        Form.prototype.validateField = async function (field) {
            let valid = true;
            if (typeof this.beforeFieldValidation === 'function') {
                valid = this.beforeValidation(this)
            }
            if (typeof field.validationCb === 'function') {
                valid = await field.validationCb(this, valid)
            } else if (typeof this.fieldValidationCb === 'function') {
                valid = await this.fieldValidationCb(field, this, valid)
            }
            if (typeof this.afterFieldValidation === 'function') {
                this.afterValidation(this, valid)
            }
            return valid;
        }

        return Form;
    }));
    let result = window.mmForm;

    result.component = 'MageMe_WebFormsLite/js/form';

    return result;
});
