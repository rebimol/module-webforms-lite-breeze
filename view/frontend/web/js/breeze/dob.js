'use strict';
define([], function() {
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
        root.mmWebformsDob = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function mmWebformsDob(config) {
        function setDate() {
            const dayVal = document.getElementById('day' + config.id).value,
                monthVal = document.getElementById('month' + config.id).value,
                yearVal = document.getElementById('year' + config.id).value;
            if (dayVal === '' && monthVal === '' && yearVal === '') {
                document.getElementById(config.id).value = '';
            } else {
                document.getElementById(config.id).value = config.dateFormat.replace(/d/i, dayVal).replace(/m/i, monthVal).replace(/y/i, yearVal);
            }
        }
        document.getElementById('day' + config.id).onchange = setDate;
        document.getElementById('month' + config.id).onchange = setDate;
        document.getElementById('year' + config.id).onchange = setDate;

        MageMe.WebForms.formValidation.addRule(
            'validate-dobd', function (value, options, field, context) {
                const dayVal = value,
                    monthVal = field.element.parentElement.parentElement.querySelector('.dob-mm').value,
                    yearVal = field.element.parentElement.parentElement.querySelector('.dob-yyyy').value,
                    dobLength = dayVal.length + monthVal.length + yearVal.length;
                if (dobLength === 0) {
                    if (config.isRequired) {
                        return '';
                    }
                    return true;
                }
                const day = parseInt(dayVal, 10) || 0,
                    month = parseInt(monthVal, 10) || 0,
                    year = parseInt(yearVal, 10) || 0;

                const validateDayInMonth = new Date(year, month, 0).getDate();

                if (!day) {
                    return config.messageValidDayInMonth.replace('%1', validateDayInMonth.toString());
                }

                if (day < 1 || day > validateDayInMonth) {
                    return config.messageValidDayInMonth.replace('%1', validateDayInMonth.toString());
                }

                const today = new Date(),
                    dateEntered = new Date();
                dateEntered.setFullYear(year, month - 1, day);
                if (dateEntered > today) {
                    return config.messageDateFromThePast;
                }

                return true;
            }
        );

        MageMe.WebForms.formValidation.addRule(
            'validate-dobm', function (value, options, field, context) {
                const dayVal = field.element.parentElement.parentElement.querySelector('.dob-dd').value,
                    monthVal = value,
                    yearVal = field.element.parentElement.parentElement.querySelector('.dob-yyyy').value,
                    dobLength = dayVal.length + monthVal.length + yearVal.length;
                if (dobLength === 0) {
                    if (config.isRequired) {
                        return '';
                    }
                    return true;
                }
                const month = parseInt(monthVal, 10) || 0;

                if (!month) {
                    return config.messageValidMonth;
                }

                if (month < 1 || month > 12) {
                    return config.messageValidMonth;
                }

                return true;
            }
        );

        MageMe.WebForms.formValidation.addRule(
            'validate-doby', function (value, options, field, context) {
                const dayVal = field.element.parentElement.parentElement.querySelector('.dob-dd').value,
                    monthVal = field.element.parentElement.parentElement.querySelector('.dob-mm').value,
                    yearVal = value,
                    dobLength = dayVal.length + monthVal.length + yearVal.length;
                if (dobLength === 0) {
                    if (config.isRequired) {
                        return '';
                    }
                    return true;
                }
                const day = parseInt(dayVal, 10) || 0,
                    month = parseInt(monthVal, 10) || 0,
                    year = parseInt(yearVal, 10) || 0,
                    curYear = (new Date()).getFullYear();

                if (!year) {
                    return config.messageValidYear.replace('%1', curYear.toString());
                }

                const today = new Date(),
                    dateEntered = new Date();
                dateEntered.setFullYear(year, month - 1, day);
                if (!(dateEntered > today)) {
                    if (year < 1900 || year > curYear) {
                        return config.messageValidYear.replace('%1', curYear.toString());
                    }
                }

                return true;
            }
        );
    }

    return mmWebformsDob;
}));

    let dob = window.mmWebformsDob;

    dob.component = 'MageMe_WebFormsLite/js/dob';

    return dob;
});
