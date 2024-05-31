import Constants from './constants.es6';

/**
 * @class Dynamic table
 */
export default class DynamicTable {
    /**
    * @constructor
    */
    constructor(_cntr) {
        if (!_cntr) return;

        this._cntr = _cntr;
        this._init();
    }

    /**
     * @summary Initializes the script
     * @method _init
     */
    _init() {
        this._bindMethods();
        this._setElements();
        this._bindEvents();
    }

    /**
     * @method _setElements
     * @summary Sets some elements
     */
    _setElements() {
        this._filterForm = this._cntr.querySelector(Constants.SELECTORS.filterForm);
        this._btnCustomize = this._cntr.querySelector(Constants.SELECTORS.btnCustomize);
        this._btnFilterSave = this._cntr.querySelector(Constants.SELECTORS.btnFilterSave);
        this._btnFilterClear = this._cntr.querySelector(Constants.SELECTORS.btnFilterClear);
        this._filterCounterEls = this._cntr.querySelectorAll(`[${Constants.ATTRIBUTES.featureCounter}]`);
        /* istanbul ignore else */
        if (this._filterForm) {
            this._filterCheckboxes = this._filterForm.querySelectorAll(Constants.SELECTORS.filterChk);
        }
    }

    /**
     * @summary Binds context to methods
     * @method _bindMethods
     */
    _bindMethods() {
        this._onPinClick = this._onPinClick.bind(this);
        this._handleCustomizeClick = this._handleCustomizeClick.bind(this);
        this._handleFilterFeaturesClick = this._handleFilterFeaturesClick.bind(this);
        this._handleFilterCheckboxChange = this._handleFilterCheckboxChange.bind(this);
        this._handleFilterClearClick = this._handleFilterClearClick.bind(this);
    }

    /**
     * @method _bindEvents
     * @summary Adds event listeners
     */
    _bindEvents() {
        this._cntr.addEventListener('click', this._onPinClick);

        /* istanbul ignore else */
        if (this._btnCustomize) {
            this._btnCustomize.addEventListener('click', this._handleCustomizeClick);
        }

        /* istanbul ignore else */
        if (this._btnFilterSave) {
            this._btnFilterSave.addEventListener('click', this._handleFilterFeaturesClick);
        }

        /* istanbul ignore else */
        if (this._btnFilterClear) {
            this._btnFilterClear.addEventListener('click', this._handleFilterClearClick);
        }

        this._filterCheckboxes.forEach((el) => {
            el.addEventListener('change', this._handleFilterCheckboxChange);
        });
    }

    /**
     * @method _handleCustomizeClick
     * @summary Handles the customize button click
     */
    _handleCustomizeClick() {
        const slidePanelEl = this._cntr.querySelector(Constants.SELECTORS.slidePanelCont);

        if (slidePanelEl) {
            const eventName = slidePanelEl.getAttribute(Constants.ATTRIBUTES.slideOpenEvent);
            const event = new CustomEvent(eventName);
            window.dispatchEvent(event);
        }
    }

    /**
     * @method _closeFilterSlidePanel
     * @summary Closes the filter slide panel
     */
    _closeFilterSlidePanel() {
        const event = new CustomEvent(Constants.EVENTS.FILTER_CLOSE);
        window.dispatchEvent(event);
    }

    /**
     * @method _handleFilterFeaturesClick
     * @summary Updates the table when form is submitted
     */
    _handleFilterFeaturesClick(e) {
        e.preventDefault();
        this._handleFeatureCellsVisibility();
        this._closeFilterSlidePanel();
        this._addFilterCounterToAttribute();
    }

    /**
     * @method _handleFilterClearClick() {
     * @summary Handles the actions when the uses clicks on the clear button
     */
    _handleFilterClearClick(e) {
        e.preventDefault();
        this._filterCheckboxes.forEach((el) => {
            el.checked = false;
        });
        this._btnFilterSave.setAttribute('disabled', true);
    }

    /**
     * @method _handleFeatureCellsVisibility
     * @summary Shows only the cells that match the selected features, hides the rest
     */
    _handleFeatureCellsVisibility() {
        this._filterCheckboxes.forEach((el) => {
            const { value } = el;
            const cellsMatchingValue = this._cntr.querySelectorAll(`[${Constants.ATTRIBUTES.featureId}="${value}"]`);

            cellsMatchingValue.forEach((cell) => {
                if (el.checked) {
                    cell.classList.remove(Constants.CLASSES.hide);
                } else {
                    cell.classList.add(Constants.CLASSES.hide);
                }
            });
        });
    }

    /**
     * @method _handleFilterCheckboxChange
     * @summary Handles the filter checkbox change
     */
    _handleFilterCheckboxChange() {
        const checkedInputs = this._filterForm.querySelectorAll(Constants.SELECTORS.filterChkChecked);

        if (checkedInputs.length) {
            this._btnFilterSave.removeAttribute('disabled');
        } else {
            this._btnFilterSave.setAttribute('disabled', true);
        }
    }

    /**
     * @method _addFilterCounterToAttribute
     * @summary Adds the number of selected features to the attribute
     */
    _addFilterCounterToAttribute() {
        const checkedInputs = this._filterForm.querySelectorAll(Constants.SELECTORS.filterChkChecked);

        this._filterCounterEls.forEach((el) => {
            el.setAttribute(Constants.ATTRIBUTES.featureCounter, checkedInputs.length);
        });
    }

    /**
     * @method _onPinClick
     * @summary Checks if the element clicked is a pin and swaps the columns
     */
    _onPinClick({ target }) {
        if (target.classList.contains(Constants.CLASSES.pin)) {
            const currentPinCol = this._cntr.querySelector(Constants.SELECTORS.tbColPinned);
            const clickedTbCol = target.closest(Constants.SELECTORS.tbCol);

            if (!currentPinCol && !clickedTbCol) return;

            const tmpCurrentPinCol = this._getTmpCol(currentPinCol);
            const tmpClickedTbCol = this._getTmpCol(clickedTbCol);

            currentPinCol.innerHTML = tmpClickedTbCol.innerHTML;
            clickedTbCol.innerHTML = tmpCurrentPinCol.innerHTML;

            if (window.CAUApiEvent) {
                window.CAUApiEvent.refreshTargets(this._cntr);
            }
        }
    }

    /**
     * @method _getTmpCol
     * @summary Removes the userdb binded attribute from the column copy
     */
    _getTmpCol(col) {
        const tmpCol = col.cloneNode(true);
        tmpCol.querySelectorAll(`[${Constants.ATTRIBUTES.userDBbinded}]`).forEach((userdbEl) => {
            userdbEl.removeAttribute(Constants.ATTRIBUTES.userDBbinded);
        });
        return tmpCol;
    }
}
