/**
 * Constants used by the dynamic table class
 * @constant
 * @return {object}
 */
export default {
    EVENTS: {
        FILTER_CLOSE: 'com.ca.slide.panel.dynamic_table_filter.popup.close',
        INIT_EVENT_NAME: 'com.ca.styleguide.ca_sg_dynamic_table.init',
    },
    SELECTORS: {
        btnCustomize: '.js-dynmc-tb-btn-cstmz',
        btnFilterClear: '.js-dynmc-tb-btn-clear',
        btnFilterSave: '.js-dynmc-tb-btn-save',
        container: '.js-dynmc-tb',
        filterForm: '.js-dynmc-tb-fltr-frm',
        filterChk: 'input[type="checkbox"]',
        filterChkChecked: 'input[type="checkbox"]:checked',
        pin: '.js-dynmc-tb-pin',
        slidePanelCont: '.js-slide-panel-container',
        tbCol: '.js-dynmc-tb-col',
        tbColPinned: '.js-dynmc-tb-col-pinned',
    },
    CLASSES: {
        hide: 'ca-hide',
        pin: 'js-dynmc-tb-pin',
        tbCol: 'js-dynmc-tb-col',
        tbColPinned: 'js-dynmc-tb-col-pinned',
    },
    ATTRIBUTES: {
        featureId: 'data-dynamic-table-feature-id',
        featureCounter: 'data-dynamic-table-feature-counter',
        pinned: 'data-dynamic-table-primary',
        userDBbinded: 'data-uapi-event-binded',
        slideOpenEvent: 'data-open-event-name',
    },
};
