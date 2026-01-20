define([
        'jquery',
        'swal',
        'MageMe_WebFormsLite/js/form',
        'tingle'],
    function (breeze, swal,  mmForm, tingle) {
        function createForm(options) {
            options.afterInit = (form) => {
                document.body.addEventListener('touchstart', MageMe.WebForms.loadValidation, {once: true});
                document.body.addEventListener('mouseover', MageMe.WebForms.loadValidation, {once: true});
                form.controls.form.setAttribute('data-validator-ready', 'data-validator-ready');
            }
            options.validationCb = (form, valid) => new Promise(async (resolve, reject) => {
                if (!valid) {
                    resolve(false);
                }
                MageMe.WebForms.loadValidation().then(() => {
                    return MageMe.WebForms.formValidation(form.controls.form, {
                        fieldWrapperClassName: 'control',
                        messagesWrapperClassName: 'mm-error',
                        invalidClassName:'mm-field-error'
                    });
                }).then(validator => {
                    return validator.validate();
                }).then(() => {
                    resolve(true);
                }).catch((er) => {
                    resolve(false);
                });
            });
            options.fieldValidationCb = (field, form, valid) => new Promise(async (resolve, reject) => {
                if (!valid) {
                    resolve(false);
                }
                MageMe.WebForms.loadValidation().then(() => {
                    return MageMe.WebForms.formValidation(form.controls.form, {
                        fieldWrapperClassName: 'control',
                        messagesWrapperClassName: 'mm-error',
                        invalidClassName:'mm-field-error'
                    });
                }).then(validator => {
                    validator.setupField(field);
                    const fieldObj = validator.fields[field.name];
                    return validator.validateField(fieldObj);
                }).then((isValid) => {
                    resolve(isValid);
                }).catch((er) => {
                    resolve(false);
                });
            });
            options.getFormKey = () => {
                return breeze.cookies.get('form_key');
            };
            options.swal = swal;
            options.tingle = tingle;
            new mmForm(options);
        }

        createForm.component = 'MageMe_WebFormsLite/js/submit';

        return createForm;
    });
