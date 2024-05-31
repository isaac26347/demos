import { CUSTOM_EVENTS_EVENT } from '../../uapi_common/js/userdb-custom-events-constants.es6';
import ModalEventWrapper from '../../../blue/common/js/modal-event-wrapper.es6';
import loggerEvents from '../../ca_sg_logger_v2/js/constants.es6';
import { INIT_ALL_INPUTS_EVENT } from '../../ca_sg_forms_light/js/constants.es6';
import CookieUtil from '../../../blue/ca_styleguide_cookie_util/js/cookie_util.es6';
import Constants from './constants.es6';

/**
 * @class Modal PopupTrigger
 */
export default class PopupTrigger {
    /**
    * @function UAPI_ELEMENT_NAME
    * @return {String} default element name
    */
    static get UAPI_ELEMENT_NAME() {
        return 'exit_intent_popup';
    }

    /**
    * @function DATA_SHOW
    * @return {String} Attribute to list the screens in which the popup should be shown
    */
    static get DATA_SHOW() {
        return 'data-show';
    }

    /**
    * @function DATA_SCREENS_CONFIG
    * @return {String} Attribute to set the config per screen
    */
    static get DATA_SCREENS_CONFIG() {
        return 'data-screens-config';
    }

    /**
    * @function DATA_UAPI_TRACKING
    * @return {String} Attribute to set the tracking element name
    */
    static get DATA_UAPI_TRACKING() {
        return 'data-uapi-popup-element';
    }

    /**
    * @function DATA_POPUP_IDENTIFIER
    * @return {String} Attribute to set a unique name for the popup.
    * If attribute is present the modal should show only once until cookie expires.
    */
    static get DATA_POPUP_IDENTIFIER() {
        return 'data-popup-identifier';
    }

    /**
    * @function DATA_POPUP_EXPIRE
    * @return {String} Attribute to set popup cookie expiry period in days.
    * If attribute is present the modal should show only once until cookie expires.
    */
    static get DATA_POPUP_EXPIRE() {
        return 'data-popup-expire';
    }

    /**
    * @method MODAL_DRAWER_TYPE
    * @return {String} Type for the modal drawer
    */
    static get MODAL_DRAWER_TYPE() {
        return 'popup-trigger';
    }

    /**
    * @method MODAL_THEME_ATTRIBUTE
    * @return {String} Attribute for the CA modal theme to pass modifier classes
    */
    static get MODAL_THEME_ATTRIBUTE() {
        return 'data-ca-modal-theme';
    }

    /**
    * @constructor
    * @param {Object} _popup - popup trigger element
    */
    constructor(_popup) {
        window.MediaSizeBroadcaster = true;
        window.ScrollThrottledBroadcaster = true;
        this._popup = _popup;
        this._cookieUtil = new CookieUtil();
    }

    /**
    * @method init
    * @summary Initializes the script
    * @public
    */
    init() {
        if (this._popup) {
            this._bindScope();
            this._bindEvents();
            this._getScreensConfig();
            this._registerDrawer();
        }
    }

    /**
    * @method destroy
    * @summary Removes all the registered event listeners
    * @public
    */
    destroy() {
        window.document.removeEventListener('keydown', this._onKeydown);
        window.document.documentElement.removeEventListener('mouseleave', this._handleExitType);
        window.removeEventListener('com.ca.styleguide.userScroll', this._resetTimeout);
        window.removeEventListener('mousemove', this._resetTimeout);
    }

    /**
    * @summary Responsible to bind all DOM elements needed to execute properly
    * @method _bindElements
    * @returns {void}
    */
    _bindElements() {
        this._popupContent = window.caModal.modal.querySelector(Constants.SELECTORS.popupContent);
    }

    /**
    * @summary Bind needed functions to this context.
    * @method _bindScope
    * @private
    */
    _bindScope() {
        this._onMediaChange = this._onMediaChange.bind(this);
        this._handleExitType = this._handleExitType.bind(this);
        this._onKeydown = this._onKeydown.bind(this);
        this._modalOpenHandler = this._modalOpenHandler.bind(this);
        this._modalCloseHandler = this._modalCloseHandler.bind(this);
        this._resetTimeout = this._resetTimeout.bind(this);
        this._setupInactivityMethods = this._setupInactivityMethods.bind(this);
    }

    /**
    * @summary Binds event listeners to elements
    * @method _bindEvents
    * @return {void}
    */
    _bindEvents() {
        window.addEventListener('com.ca.styleguide.mediaChange', this._onMediaChange);
    }

    /**
    * @summary Event after changing the window size to a new breakpoint
    * @method _onMediaChange
    * @param {Object} e - Media change event
    */
    _onMediaChange(e) {
        this._setScreenSize(e);
        this._clearTimedPopup();
        this._handleTimedType();
        this._bindKeydown();
        this._bindMouseleave();
        this._setupInactivityMethods();
    }

    /**
    * @summary Clears the timeout if it exists
    * @method _clearTimedPopup
    * @return {void}
    */
    _clearTimedPopup() {
        if (this._popupTimeout) {
            window.clearTimeout(this._popupTimeout);
        }
    }

    /**
    * @summary Adds the keydown event if the popup type is 'timed'
    * @method _bindKeydown
    * @return {void}
    */
    _bindKeydown() {
        const configScreenSize = this._screensConfig[this._screenSize];

        if (configScreenSize && configScreenSize.type.includes('timed')) {
            window.document.addEventListener('keydown', this._onKeydown);
        }
    }

    /**
    * @summary Adds the mouseleave event if the popup type is 'exit'
    * @method _bindMouseleave
    * @return {void}
    */
    _bindMouseleave() {
        const configScreenSize = this._screensConfig[this._screenSize];

        if (configScreenSize && configScreenSize.type.includes('exit')) {
            window.document.documentElement.addEventListener('mouseleave', this._handleExitType);
        }
    }

    /**
    * @summary Event fired when a key is pressed
    * @method _onKeydown
    * @param {Object} e - Keydown event
    */
    _onKeydown(e) {
        this._clearTimedPopup();
        if (!e.metaKey) {
            this._handleTimedType();
        }
    }

    /**
    * @summary Groups and sets the screen size keyword after changing the window size
    * @method _setScreenSize
    * @param {Object} e - Media change event
    */
    _setScreenSize(e) {
        const { media } = e.detail;
        const mobileSize = ['xs', 'sm'];
        const tabletSize = ['md'];
        const desktopSize = ['lg', 'xl'];

        if (mobileSize.some((size) => media === size)) {
            this._screenSize = 'mobile';
        }
        if (tabletSize.some((size) => media === size)) {
            this._screenSize = 'tablet';
        }
        if (desktopSize.some((size) => media === size)) {
            this._screenSize = 'desktop';
        }
    }

    /**
    * @summary Stores the _screensConfig object data
    * @method _getScreensConfig
    * @returns {void}
    */
    _getScreensConfig() {
        try {
            this._screensConfig = JSON.parse(this._popup.getAttribute(PopupTrigger.DATA_SCREENS_CONFIG));
        } catch (error) {
            const errorEvent = new CustomEvent(loggerEvents.CAPTURE_MESSAGE_EVENT, {
                detail: {
                    message: 'Invalid JSON on popup-trigger config',
                    level: 'warning',
                    context: this._popup.getAttribute(PopupTrigger.DATA_SCREENS_CONFIG),
                },
            });

            window.dispatchEvent(errorEvent);
        }
    }

    /**
    * @summary Opens the 'timed' type popup with content depending on the screen size
    * @method _handleTimedType
    * @return {void}
    */
    _handleTimedType() {
        const configScreenSize = this._screensConfig[this._screenSize];

        if (configScreenSize && configScreenSize.type.includes('timed')) {
            this._setTimedPopup(configScreenSize.trigger_after_seconds);
        }
    }

    /**
    * @summary Opens the 'exit' type popup with content depending on the screen size
    * @method _handleExitType
    * @param {Object} e - Mouseleave event
    * @returns {void}
    */
    _handleExitType(e) {
        if (e.clientY < 1) {
            this._type = { type: 'exit' };
            this._checkLoadPopup();
        }
    }

    /**
    * @summary Sets the time after which the 'timed' popup type should open
    * @method _setTimedPopup
    * @param {number} time - trigger_after_seconds config value
    * @returns {void}
    */
    _setTimedPopup(time) {
        this._checkLoadPopup = this._checkLoadPopup.bind(this);

        if (Number(time)) {
            this._type = { type: 'timed', time };
            this._popupTimeout = window.setTimeout(this._checkLoadPopup, time * 1000);
        }
    }

    /**
     * @summary Gets the uapi element name
     * @method _getUapiElementName
     */
    _getUapiElementName() {
        let attributeName;
        if (this._template) {
            attributeName = this._template.getAttribute(PopupTrigger.DATA_UAPI_TRACKING);
        }

        return attributeName || PopupTrigger.UAPI_ELEMENT_NAME;
    }

    /**
     * @summary Responsible to create the structure of custom event according to dataset
     * @method _buildEventDetail
     * @param {String} action - Name of the action
     * @return {Object} detail
     */
    _buildEventDetail(action) {
        const element = this._getUapiElementName();
        const context = {
            [this._screenSize]: this._type,
        };

        return {
            name: 'modal',
            data: { element, action, context },
        };
    }

    /**
     * @summary Dispatch the USER DB event for the profile close event
     * @method _profileCloseEventHandler
     * @param {String} action - Name of the action
     * @return {void}
     */
    _dispatchUapiEvent(action) {
        const detail = this._buildEventDetail(action);
        const event = new CustomEvent(CUSTOM_EVENTS_EVENT, { detail });
        window.dispatchEvent(event);
    }

    /**
    * @summary Responsible to open the popup-trigger modal drawer type
    * @method _loadPopup
    * @returns {void}
    */
    _loadPopup() {
        const params = {
            type: PopupTrigger.MODAL_DRAWER_TYPE,
            theme: this._popup.getAttribute(PopupTrigger.MODAL_THEME_ATTRIBUTE) || '',
        };
        window.caModal.loadModal(params);
        this.destroy();
    }

    /**
    * @method _getTemplate
    * @summary Returns the poput trigger template to fill the modal (depends on screen size)
    * @returns {String}
    */
    _getTemplate() {
        if (!this._template) {
            this._getTemplateCode();
        }

        return this._template ? this._template.innerHTML : '';
    }

    /**
     * @method _getTemplateCode
     * @summary Returns the template from the DOM
     */
    _getTemplateCode() {
        const selector = `${Constants.SELECTORS.popupTrigger}[${PopupTrigger.DATA_SHOW}*="${this._screenSize}"]`;
        const template = document.querySelector(selector);

        if (template) {
            this._template = template.cloneNode(true);
            template.remove();
        }
    }

    /**
    * @method _initModal
    * @summary Adds listeners for open modal event
    * @returns {void}
    */
    _initModal() {
        if (this._getTemplate()) {
            window.addEventListener(ModalEventWrapper.OPEN_MODAL_EVENT, this._modalOpenHandler, { once: true });
        }
    }

    /**
    * @method _modalOpenHandler
    * @summary Handles events in the modal
    * @returns {void}
    * @private
     */
    _modalOpenHandler() {
        window.addEventListener(ModalEventWrapper.CLOSE_MODAL_EVENT, this._modalCloseHandler, { once: true });
        this._dispatchUapiEvent('open');
        this._bindElements();
        this._rebindDynamicEvents();
    }

    /**
    * @method _modalCloseHandler
    * @summary Handles close event in the modal
    * @returns {void}
    * @private
     */
    _modalCloseHandler() {
        this._dispatchUapiEvent('close');
    }

    /**
    * @method _rebindDynamicEvents
    * @summary rebind events on dynamically created elements
    * @returns {void}
    */
    _rebindDynamicEvents() {
        // Initialize forms
        const formsDetail = {
            detail: `${Constants.SELECTORS.popupContent} .js-form-group`,
        };
        const event = new CustomEvent(INIT_ALL_INPUTS_EVENT, formsDetail);
        window.dispatchEvent(event);
        // Initialize email marketing script
        /* istanbul ignore else */
        if (window.CAEmailMarketing) {
            window.CAEmailMarketing.init(this._popupContent);
        }
        // Initialize userDB tracking
        /* istanbul ignore else */
        if (window.CAUApiEvent) {
            window.CAUApiEvent.refreshTargets(this._popupContent);
        }
    }

    /**
    * @summary Registers the modal drawer of type popup-trigger on caModal
    * @method _registerDrawer
    * @private
    */
    _registerDrawer() {
        if (!window.caModal) {
            return false;
        }

        window.caModal.registerDrawer(
            PopupTrigger.MODAL_DRAWER_TYPE,
            this._getTemplate.bind(this),
            this._initModal.bind(this),
            { hideHeader: 'true' },
        );

        return true;
    }

    /**
    * @method _getPopupIdentifier
    * @summary Return the popup identifier
    * @private
    */
    _getPopupIdentifier() {
        const dataAttr = this._popup.getAttribute(PopupTrigger.DATA_POPUP_IDENTIFIER);
        return dataAttr;
    }

    /**
    * @method _setCookieExpiryDate
    * @summary Return the popup cookie expiry date
    * @private
    */
    _setCookieExpiryDate() {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Number(this._popup.getAttribute(PopupTrigger.DATA_POPUP_EXPIRE)));
        return expiryDate.toUTCString();
    }

    /**
    * @method _createCookie
    * @summary Creates cookie string
    * @private
    */
    _createCookie() {
        let expires = '';
        const popupType = this._screensConfig[this._screenSize].type;
        const nameAndValue = `${this._getPopupIdentifier()}=${popupType}`;
        const path = 'path=/';

        if (this._popup.hasAttribute(PopupTrigger.DATA_POPUP_EXPIRE)) {
            expires = `expires=${this._setCookieExpiryDate()};`;
        }

        return `${nameAndValue}; ${path}; ${expires}`;
    }

    /**
    * @method _setPopupCookie
    * @summary Sets the cookie
    * @private
    */
    _setPopupCookie() {
        document.cookie = this._createCookie();
    }

    /**
    * @method _handlePopupCookie
    * @summary Sets the cookie and shows the popup if there's a popup identifier and the cookie doesn't exist
    * @private
    */
    _handlePopupCookie() {
        const popupId = this._getPopupIdentifier();
        if (popupId && !this._cookieUtil.checkExistenceOf(popupId)) {
            this._setPopupCookie();
            this._loadPopup();
        }
    }

    /**
     * @method _isDisabled
     * @summary Check if the popup has the data-popup-disabled dataset property
     * @returns {boolean}
     * @private
     */
    _isDisabled() {
        return this._popup.hasAttribute(Constants.DATA_POPUP_DISABLED);
    }

    /**
    * @method _checkLoadPopup
    * @summary Loads the popup depending whether the popup identifier is set, in that case it will load once
    * @private
    */
    _checkLoadPopup() {
        if (!this._isDisabled() && !window.caModal.isOpen) {
            this._handlePopupCookie();
            if (!this._getPopupIdentifier()) {
                this._loadPopup();
            }
        }
    }

    /**
    * @summary Sets the inactivity methods. They can be either mouse or scroll
    * @method _setupInactivityMethods
    * @return {void}
    */
    _setupInactivityMethods() {
        const configScreenSize = this._screensConfig[this._screenSize];

        const listenersMap = {
            scroll: 'com.ca.styleguide.userScroll',
            mouse: 'mousemove',
        };

        if (configScreenSize && configScreenSize.type.includes('timed')) {
            const inactivityMethods = configScreenSize.inactivity_methods || [];
            inactivityMethods.forEach((method) => {
                /* istanbul ignore else */
                if (listenersMap[method]) {
                    window.addEventListener(listenersMap[method], this._resetTimeout);
                }
            });
        }
    }

    /**
     * @summary Clear the timeout and starts it again based on the time set on config
     * @method _resetTimeout
     * @return {void}
     */
    _resetTimeout() {
        this._clearTimedPopup();
        this._handleTimedType();
    }
}
