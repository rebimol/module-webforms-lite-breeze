define(['jquery', 'tingle'], function (breeze, tingle) {
    function popup(options, node) {
        const o = {
            url: '',
            containerId: '',
            modalClass: ''
        };
        for (let k in options) {
            if (options.hasOwnProperty(k)) o[k] = options[k];
        }
        let modal;
        node.addEventListener('click', () => {
            if (!modal) {
                modal = new tingle.modal({
                    beforeOpen: () => {
                        window.dispatchEvent(new CustomEvent("mm_button_webform_loading" + options.containerId));
                        const content = document.getElementById(options.containerId);
                        if (content) {
                            modal.setContent(content);
                        } else {
                            const currentUrl = window.location.href;
                            const fetchUrl = options.url + (options.url.includes('?') ? '&' : '?') + 'referer=' + encodeURIComponent(currentUrl);
                            fetch(fetchUrl).then(
                                response => response.text()
                            ).then(html => {
                                const content = document.createElement('div');
                                content.setAttribute('id', options.containerId);
                                content.append(document.createRange().createContextualFragment(html));
                                modal.setContent(content);
                                breeze(content).trigger('contentUpdated');
                                try {
                                    breeze(content).applyBindings();
                                } catch (e) {
                                }
                                window.dispatchEvent(new CustomEvent("mm_button_webform_loaded" + options.containerId));
                                document.dispatchEvent(new CustomEvent("breeze:load"));
                            });
                        }
                        if (modal.modalBoxContent) {
                            const turnstileContainer = modal.modalBoxContent.querySelector('[class="turnstile-container"]');
                            if (turnstileContainer) {
                                const cid = turnstileContainer.getAttribute('cid');
                                if (cid) {
                                    window.dispatchEvent(new CustomEvent('mm-form-captcha-reload', {
                                        detail: {
                                            'cid': cid
                                        }
                                    }));
                                }
                            }
                        }
                    },
                });
            }
            modal.open();
        });
    }

    popup.component = 'MageMe_WebFormsLite/js/popup';

    return popup;
});
