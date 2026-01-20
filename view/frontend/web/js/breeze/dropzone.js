'use strict';
define(['jquery'], function (breeze) {

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
        root.mmWebformsDropzone = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function Dropzone(config) {

        let options = Object.assign({
            uid: '',
            url: '',
            removeUrl: '',
            fieldId: '',
            fieldName: '',
            dropZone: 1,
            dropZoneText: 'Add file or drop here',
            maxFiles: 1,
            allowedSize: 0,
            previewMaxWidth: '26px',
            previewMaxHeight: '26px',
            allowedExtensions: [],
            restrictedExtensions: [],
            validationCssClass: '',
            required: false,
            errorMsgDropzone: 'This field has incorrect files',
            errorMsgRequired: 'This is a required field.',
            errorMsgMaxFiles: 'Maximum %s files in dropzone. Please remove upload or select some files to delete',
            errorMsgAllowedExtensions: 'Selected file has none of allowed extensions: %s',
            errorMsgRestrictedExtensions: 'Uploading of potentially dangerous files is not allowed.',
            errorMsgAllowedSize: 'Selected file exceeds allowed size: %s kB',
            errorMsgUploading: 'Error uploading file',
            errorMsgNotReady: 'Please wait... the upload is in progress.',
            errorMsgRemoveFile: 'Error removing file',
            ui: false,
            containerId: null,
            container: document,
            getFormKey: function () {
                const formKey = document.cookie.match('(^|; )form_key=([^;]+)(;|$)');
                if (!formKey) {
                    return undefined;
                }
                return formKey[2];
            }
        }, config || {});

        options.getFormKey = function () {
            return breeze.cookies.get('form_key');
        };

        const cancelFile = function (event) {
            const parent = getParentByClass(event.target, 'drop-zone-preview');
            let formData = new FormData();
            if (window.FORM_KEY) {
                formData.append('form_key', window.FORM_KEY);
            } else if (options.getFormKey()) {
                formData.append('form_key', options.getFormKey());
            } else {
                formData.append('form_key', document.querySelector('input[name="form_key"]').value);
            }
            formData.append('hash', parent.dataset.hash);

            function stateChange(event) {
                if (event.target.readyState === 4) {
                    if (event.target.status === 200) {
                        uploadField().setAttribute('style', 'display:block');
                        field.value = '';
                        for (let i = 0; i < dropZoneFiles.length; i++) {
                            if (parent.dataset.hash === dropZoneFiles[i]) {
                                delete rawFiles[dropZoneFiles[i]];
                                dropZoneFiles.splice(i, 1);
                                inputHash.value = dropZoneFiles.join(';');
                            }
                        }
                        inputDropzone.value = '';
                        previewZone.removeChild(parent);

                    } else {
                        alert(options.errorMsgRemoveFile);
                    }
                }
            }

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = stateChange;
            xhr.open('POST', options.removeUrl);
            xhr.send(formData);
        }

        if (!options.fieldId) return;
        if (options.containerId) {
            const container = document.getElementById(options.containerId);
            if (container) {
                options.container = container;
            }
        }
        let field = options.container.querySelector('#' + options.fieldId);
        let previewZone = options.container.querySelector('#' + options.fieldId + '_preview');
        if (!previewZone) {
            previewZone = document.createElement('div');
            previewZone.setAttribute('id', options.fieldId + '_preview');
            field.parentNode.appendChild(previewZone);
        }
        previewZone.querySelectorAll('.drop-zone-preview').forEach((preview) => {
            const close = preview.querySelector('.drop-zone-preview-icon-close');
            if (close) {
                close.addEventListener('click', cancelFile);
            }
        });
        let parentNode = field.parentNode;

        let fileCnt = 0;

        let fieldName = options.fieldName ? options.fieldName : 'hash' + field.name;

        let inputHash = options.container.querySelector('#' + options.fieldId + '_hash');
        if (!inputHash) {
            inputHash = document.createElement('input');
            inputHash.setAttribute('id', options.fieldId + '_hash');
            inputHash.setAttribute('type', 'hidden');
            inputHash.setAttribute('name', fieldName);
            inputHash.setAttribute('class', options.validationCssClass);
        }

        let inputDropzone = options.container.querySelector('#' + options.fieldId + '_dropzone');
        if (!inputDropzone) {
            inputDropzone = document.createElement('input');
            inputDropzone.setAttribute('id', options.fieldId + '_dropzone');
            inputDropzone.setAttribute('name', options.fieldName + '_dropzone');
            inputDropzone.setAttribute('type', 'file');
            inputDropzone.setAttribute('style', 'display:none');
            inputDropzone.setAttribute('multiple', 'multiple');
            inputDropzone.classList.add('validate-hidden');
        }
        let dataValidate = "{";
        dataValidate = dataValidate + "'validate-dropzone':true";
        if (options.required) {
            dataValidate = dataValidate + ", 'validate-dropzone-required':true";
        }
        if (options.maxFiles) {
            dataValidate = dataValidate + ", 'validate-dropzone-max-files':true";
        }
        dataValidate = dataValidate + "}";
        inputDropzone.setAttribute('data-validate', dataValidate);
        inputDropzone.setAttribute('data-msg-validate-dropzone', options.errorMsgDropzone);
        if (options.required) {
            inputDropzone.setAttribute('data-msg-validate-dropzone-required', options.errorMsgRequired);
        }
        if (options.maxFiles) {
            inputDropzone.setAttribute('data-msg-validate-dropzone-max-files', options.errorMsgMaxFiles);
            inputDropzone.setAttribute('data-max-files', options.maxFiles);
        }
        inputDropzone.setAttribute('data-uid', options.uid);

        let dropZone;
        if (options.dropZone) {
            options.removeUrl = options.url.replace('dropzoneUpload', 'dropzoneRemove');

            dropZone = options.container.querySelector('#' + options.fieldId + '_dropzone_ui');
            if (!dropZone) {
                dropZone = document.createElement('div');
                dropZone.setAttribute('id', options.fieldId + '_dropzone_ui');
                dropZone.setAttribute('class', 'drop-zone');

                let dropZoneText = document.createElement('div');
                dropZoneText.setAttribute('class', 'dropzone-text');
                dropZone.appendChild(dropZoneText);

                let dropZoneIconPaperclip = document.createElement('span');
                dropZoneIconPaperclip.setAttribute('class', 'icon-paperclip');
                dropZoneText.appendChild(dropZoneIconPaperclip);

                let dropZoneLabel = document.createElement('div');
                dropZoneLabel.setAttribute('class', 'drop-zone-label');
                dropZoneLabel.innerHTML = options.dropZoneText;
                dropZoneText.appendChild(dropZoneLabel);
            }

            dropZone.addEventListener('click', function () {
                inputDropzone.click();
            });

            let handleFileDrop = function (evt) {
                evt.stopPropagation();
                evt.preventDefault();

                let files = evt.dataTransfer.files;

                fileCnt = dropZoneFiles.length;

                for (let i = 0, f; f = files[i]; i++) {
                    processFile(files[i]);
                }
            };

            const handleDragOver = function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy';
            };

            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleFileDrop, false);

            field.setAttribute('style', 'display:none');
            parentNode.appendChild(dropZone);

            parentNode.appendChild(inputHash);
            parentNode.appendChild(inputDropzone);
        } else {
            options.maxFiles = 1;
        }

        let uploadField = function () {
            if (options.dropZone) return dropZone;
            return field;
        };

        let dropZoneFiles = [];
        let rawFiles = {};

        let processFile = function (file) {
            if (fileCnt >= options.maxFiles) {
                return;
            }

            fileCnt++;

            let preview = document.createElement('div');
            let hash = "";
            previewZone.appendChild(preview);
            preview.setAttribute('class', 'drop-zone-preview');
            preview.setAttribute('style', 'display:none');
            preview.setAttribute('style', 'display:block');
            preview.innerHTML = "";
            let errors = [];
            let fileName = file.name;
            let fileExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
            let fileSize = file.size;
            let fileType = file.type;
            let fileSizeKB = (fileSize / 1024).toFixed(2);

            if (options.allowedExtensions.indexOf(fileExt) < 0 && options.allowedExtensions.length) {
                errors.push(options.errorMsgAllowedExtensions.replace('%s', options.allowedExtensions.join()));
            }
            if (options.restrictedExtensions.indexOf(fileExt) >= 0 && options.restrictedExtensions.length) {
                errors.push(options.errorMsgRestrictedExtensions);
            }
            if (fileSizeKB > options.allowedSize && options.allowedSize > 0) {
                errors.push(options.errorMsgAllowedSize.replace('%s', options.allowedSize.toString()));
            }

            if (errors.length && !options.dropZone) {
                field.value = '';
                preview.setAttribute('style', 'display:none');
                alert(errors.join("\n\n"));
            } else {
                let divAttachementContainer = document.createElement('div');
                divAttachementContainer.setAttribute('class', 'drop-zone-attachement-container');
                preview.appendChild(divAttachementContainer);

                let divAttachement = document.createElement('div');
                divAttachement.setAttribute('class', 'drop-zone-attachment');

                let spanIconFile = document.createElement('span');
                spanIconFile.setAttribute('class', 'drop-zone-preview-icon-file');
                divAttachement.appendChild(spanIconFile);

                let divPreviewFile = document.createElement('div');
                divPreviewFile.setAttribute('class', 'drop-zone-preview-file');
                divAttachement.appendChild(divPreviewFile);

                let divPreviewFilename = document.createElement('div');
                divPreviewFilename.setAttribute('class', 'drop-zone-preview-filename');
                divPreviewFilename.innerHTML = fileName.substr(0, fileName.length - 7);
                divPreviewFile.appendChild(divPreviewFilename);

                let divPreviewFilenameEnd = document.createElement('div');
                divPreviewFilenameEnd.setAttribute('class', 'drop-zone-preview-filename-end');
                divPreviewFilenameEnd.innerHTML = fileName.substr(-7);
                divPreviewFile.appendChild(divPreviewFilenameEnd);

                let divPreviewInfo = document.createElement('div');
                divPreviewInfo.setAttribute('class', 'drop-zone-preview-size');
                divPreviewFile.appendChild(divPreviewInfo);

                let spanIconClose = document.createElement('span');
                spanIconClose.setAttribute('class', 'drop-zone-preview-icon-close');
                spanIconClose.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 10 10">\n' +
                    '<path d="M6.4,5l3.3-3.3c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0L5,3.6L1.7,0.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4L3.6,5L0.3,8.3 c-0.4,0.4-0.4,1,0,1.4C0.5,9.9,0.7,10,1,10s0.5-0.1,0.7-0.3L5,6.4l3.3,3.3C8.5,9.9,8.7,10,9,10s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L6.4,5z"></path>\n' +
                    '</svg>';
                spanIconClose.addEventListener('click', cancelFile);
                divAttachement.appendChild(spanIconClose);

                let divProgress = document.createElement('div');
                divProgress.setAttribute('class', 'drop-zone-progress');
                divProgress.setAttribute('style', 'width:0%');
                preview.appendChild(divProgress);

                divAttachementContainer.appendChild(divAttachement);

                let validImageTypes = ["image/gif", "image/jpeg", "image/png"];
                if (validImageTypes.indexOf(fileType) >= 0) {
                    let img = document.createElement('img');
                    img.setAttribute('style', 'width: 100%; max-width: ' + options.previewMaxWidth + '; max-height: ' + options.previewMaxHeight);

                    spanIconFile.appendChild(img);
                    let reader = new FileReader();

                    reader.onload = function (e) {
                        img.setAttribute('src', e.target.result);
                    };

                    reader.readAsDataURL(file);
                } else {
                    spanIconFile.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 20 26">\n' +
                        '<path fill="currentColor" d="M13.41 0H2a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.58L13.41 0zM15 7a2 2 0 0 1-2-2V1l6 6h-4z"></path>\n' +
                        '</svg>';
                }

                if (options.dropZone) {
                    let divReadyState = document.createElement('div');

                    let inputHiddenReady = document.createElement('input');
                    let inputHiddenReadyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    inputHiddenReady.setAttribute('id', inputHiddenReadyId);
                    inputHiddenReady.setAttribute('type', 'hidden');
                    inputHiddenReady.setAttribute('class', 'required-entry');
                    divReadyState.appendChild(inputHiddenReady);

                    let divReadyError = document.createElement('div');
                    divReadyError.setAttribute('style', 'display:none');
                    divReadyError.setAttribute('class', 'validation-advice');
                    divReadyError.setAttribute('id', 'advice-required-entry-' + inputHiddenReadyId);
                    divReadyError.innerHTML = options.errorMsgNotReady;
                    divReadyState.appendChild(divReadyError);

                    divPreviewFile.appendChild(divReadyState);

                    if (errors.length) {
                        divPreviewInfo.setAttribute('class', 'drop-zone-error');
                        divPreviewInfo.innerHTML = errors.join('<br>');
                        return;
                    }

                    function uploadProgress(event) {
                        const percent = parseInt(event.loaded / event.total * 99);
                        divProgress.setAttribute('style', 'width:' + percent + '%');
                        divPreviewInfo.innerHTML = percent + '%';
                    }

                    let formData = new FormData();
                    if (window.FORM_KEY) {
                        formData.append('form_key', window.FORM_KEY);
                    } else if (options.getFormKey()) {
                        formData.append('form_key', options.getFormKey());
                    } else {
                        formData.append('form_key', document.querySelector('input[name="form_key"]').value);
                    }
                    formData.append('file_id', field.getAttribute('name'));
                    formData.append(field.getAttribute('name'), file);

                    function stateChange(event) {
                        if (event.target.readyState === 4) {
                            if (event.target.status === 200) {
                                inputDropzone.value = '';
                                divProgress.setAttribute('class', 'drop-zone-progress-success');
                                divPreviewInfo.innerHTML = fileSizeKB + 'KB';
                                const result = JSON.parse(event.target.responseText);
                                const error = result.error.join('<br>');
                                hash = result.hash;

                                divPreviewFile.removeChild(divReadyState);

                                if (hash) {
                                    dropZoneFiles.push(hash);
                                    rawFiles[hash] = {
                                        name: file.name,
                                        size: file.size,
                                        type: file.type
                                    };
                                    inputHash.value = dropZoneFiles.join(';');
                                    if (options.ui) options.ui(inputHash.value);
                                    preview.dataset.hash = hash;
                                }
                                if (error) {
                                    divPreviewInfo.setAttribute('class', 'drop-zone-error');
                                    divPreviewInfo.innerHTML = error;
                                }
                            } else {
                                alert(options.errorMsgUploading);
                            }
                        }
                    }

                    let xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', uploadProgress, false);
                    xhr.onreadystatechange = stateChange;
                    xhr.open('POST', options.url);
                    xhr.send(formData);
                } else {
                    divPreviewInfo.innerHTML = fileSizeKB + 'KB';
                }
                if (fileCnt >= options.maxFiles) {
                    uploadField().setAttribute('style', 'display:none');
                }
            }

        };

        let loadFile = function (file, hash) {
            if (fileCnt >= options.maxFiles) {
                return;
            }

            fileCnt++;

            let preview = document.createElement('div');
            previewZone.appendChild(preview);
            preview.setAttribute('class', 'drop-zone-preview');
            preview.setAttribute('style', 'display:none');
            preview.setAttribute('style', 'display:block');
            preview.innerHTML = "";
            let errors = [];
            let fileName = file.name;
            let fileExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
            let fileSize = file.size;
            let fileType = file.type;
            let fileSizeKB = (fileSize / 1024).toFixed(2);

            if (options.allowedExtensions.indexOf(fileExt) < 0 && options.allowedExtensions.length) {
                errors.push(options.errorMsgAllowedExtensions.replace('%s', options.allowedExtensions.join()));
            }
            if (options.restrictedExtensions.indexOf(fileExt) >= 0 && options.restrictedExtensions.length) {
                errors.push(options.errorMsgRestrictedExtensions);
            }
            if (fileSizeKB > options.allowedSize && options.allowedSize > 0) {
                errors.push(options.errorMsgAllowedSize.replace('%s', options.allowedSize.toString()));
            }

            if (errors.length && !options.dropZone) {
                field.value = '';
                preview.setAttribute('style', 'display:none');
                alert(errors.join("\n\n"));
            } else {
                let divAttachementContainer = document.createElement('div');
                divAttachementContainer.setAttribute('class', 'drop-zone-attachement-container');
                preview.appendChild(divAttachementContainer);

                let divAttachement = document.createElement('div');
                divAttachement.setAttribute('class', 'drop-zone-attachment');

                let spanIconFile = document.createElement('span');
                spanIconFile.setAttribute('class', 'drop-zone-preview-icon-file');
                divAttachement.appendChild(spanIconFile);

                let divPreviewFile = document.createElement('div');
                divPreviewFile.setAttribute('class', 'drop-zone-preview-file');
                divAttachement.appendChild(divPreviewFile);

                let divPreviewFilename = document.createElement('div');
                divPreviewFilename.setAttribute('class', 'drop-zone-preview-filename');
                divPreviewFilename.innerHTML = fileName.substr(0, fileName.length - 7);
                divPreviewFile.appendChild(divPreviewFilename);

                let divPreviewFilenameEnd = document.createElement('div');
                divPreviewFilenameEnd.setAttribute('class', 'drop-zone-preview-filename-end');
                divPreviewFilenameEnd.innerHTML = fileName.substr(-7);
                divPreviewFile.appendChild(divPreviewFilenameEnd);

                let divPreviewInfo = document.createElement('div');
                divPreviewInfo.setAttribute('class', 'drop-zone-preview-size');
                divPreviewFile.appendChild(divPreviewInfo);

                let spanIconClose = document.createElement('span');
                spanIconClose.setAttribute('class', 'drop-zone-preview-icon-close');
                spanIconClose.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 10 10">\n' +
                    '<path d="M6.4,5l3.3-3.3c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0L5,3.6L1.7,0.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4L3.6,5L0.3,8.3 c-0.4,0.4-0.4,1,0,1.4C0.5,9.9,0.7,10,1,10s0.5-0.1,0.7-0.3L5,6.4l3.3,3.3C8.5,9.9,8.7,10,9,10s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L6.4,5z"></path>\n' +
                    '</svg>';
                spanIconClose.addEventListener('click', cancelFile);
                divAttachement.appendChild(spanIconClose);

                let divProgress = document.createElement('div');
                divProgress.setAttribute('class', 'drop-zone-progress');
                divProgress.setAttribute('style', 'width:0%');
                preview.appendChild(divProgress);

                divAttachementContainer.appendChild(divAttachement);

                spanIconFile.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 20 26">\n' +
                    '<path fill="currentColor" d="M13.41 0H2a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.58L13.41 0zM15 7a2 2 0 0 1-2-2V1l6 6h-4z"></path>\n' +
                    '</svg>';

                if (options.dropZone) {
                    let divReadyState = document.createElement('div');

                    let inputHiddenReady = document.createElement('input');
                    let inputHiddenReadyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    inputHiddenReady.setAttribute('id', inputHiddenReadyId);
                    inputHiddenReady.setAttribute('type', 'hidden');
                    inputHiddenReady.setAttribute('class', 'required-entry');
                    divReadyState.appendChild(inputHiddenReady);

                    let divReadyError = document.createElement('div');
                    divReadyError.setAttribute('style', 'display:none');
                    divReadyError.setAttribute('class', 'validation-advice');
                    divReadyError.setAttribute('id', 'advice-required-entry-' + inputHiddenReadyId);
                    divReadyError.innerHTML = options.errorMsgNotReady;
                    divReadyState.appendChild(divReadyError);
                    divPreviewFile.appendChild(divReadyState);
                    inputDropzone.value = '';
                    divProgress.setAttribute('class', 'drop-zone-progress-success');
                    divPreviewInfo.innerHTML = fileSizeKB + 'KB';
                    divPreviewFile.removeChild(divReadyState);
                    dropZoneFiles.push(hash);
                    rawFiles[hash] = file;
                    inputHash.value = dropZoneFiles.join(';');
                    if (options.ui) options.ui(inputHash.value);
                    preview.dataset.hash = hash;
                } else {
                    divPreviewInfo.innerHTML = fileSizeKB + 'KB';
                }
                if (fileCnt >= options.maxFiles) {
                    uploadField().setAttribute('style', 'display:none');
                }
            }

        };

        let handleFileSelect = function (evt) {
            let files = evt.target.files;
            fileCnt = dropZoneFiles.length;
            for (let i = 0, f; f = files[i]; i++) {
                processFile(files[i]);
            }
        };

        this.reset = function () {
            if (options.dropZone) {
                inputHash.value = '';
                fileCnt = 0;
                dropZoneFiles = [];
                dropZone.style.display = 'block';
                while (previewZone.firstChild) {
                    previewZone.removeChild(previewZone.firstChild);
                }
            } else {
                fileCnt = 0;
                uploadField().value = "";
                uploadField().setAttribute('style', 'display:block');
                while (previewZone.firstChild) {
                    previewZone.removeChild(previewZone.firstChild);
                }
            }
        };

        this.loadFile = function (file, hash) {
            if (file.name === undefined) {
                return;
            }
            loadFile(file, hash);
        }

        this.getFiles = function () {
            return rawFiles;
        }

        inputDropzone.addEventListener('change', handleFileSelect);
        field.addEventListener('change', handleFileSelect);
    }

    function getParentByClass(el, parentSelector) {
        let p = el.parentNode;
        while (!p.classList.contains(parentSelector)) {
            p = p.parentNode;
            if (p === document) {
                return null;
            }
        }
        return p;
    }

    return Dropzone;
}));

    let result = window.mmWebformsDropzone;

    result.component = 'MageMe_WebFormsLite/js/dropzone';

    return result;
});