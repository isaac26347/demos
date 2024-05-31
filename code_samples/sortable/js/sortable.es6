import TrackPositionUpdater from '../../ca_sg_track_position_updater/js/track_position_updater.es6';
import Constants from './constants.es6';

export default class Sortable {
    static get SORT_DOWN() {
        return 'down';
    }

    static get SORT_UP() {
        return 'up';
    }

    /**
     * @constructor
     */
    constructor(container) {
        if (!container) { return; }

        this._trackPositionUpdater = new TrackPositionUpdater();

        this._init(container);
    }

    /**
     * @method _init
     * Initializes and binds the events
     */
    _init(container) {
        this._container = container;
        this._table = this._container.querySelector(Constants.SORTABLE_SELECTOR);

        if (!this._table) return;

        this._bindElements();
        this._bindMethods();
        this._bindEvents();
    }

    /**
     * @method _bindElements
     * @summary Query all needed elements
     */
    _bindElements() {
        this._ths = [...this._table.querySelectorAll(Constants.SORTABLE_TH_SELECTOR)];
        this._tbody = this._table.tBodies[0]; // eslint-disable-line
        this._menuOptions = this._container.querySelectorAll(Constants.SORTABLE_MENU_OPTION_SELECTOR);
        this._feedbackCntr = this._container.querySelector(Constants.SORTABLE_MENU_FEEDBACK_CNTR_SELECTOR);
        this._feedbackValue = this._container.querySelector(Constants.SORTABLE_MENU_FEEDBACK_SELECTOR);
    }

    /**
     * @method _bindMethods
     * @summary Binds context to methods
     */
    _bindMethods() {
        this._onThClick = this._onThClick.bind(this);
        this._onMenuOptionClick = this._onMenuOptionClick.bind(this);
        this._runSortActions = this._runSortActions.bind(this);
    }

    /**
     * @method _bindEvents
     * @summary Binds event listeners to elements
     */
    _bindEvents() {
        this._ths.forEach((th) => {
            th.addEventListener('click', this._onThClick);
        });

        if (this._menuOptions) {
            this._menuOptions.forEach((option) => {
                option.addEventListener('click', this._onMenuOptionClick);
            });
        }
    }

    /**
     * @method _onThClick
     * @summary On click in the table header elements
     */
    _onThClick(event) {
        const { currentTarget } = event;
        this._runSortActions(currentTarget);
    }

    /**
     * @method _onMenuOptionClick
     * @summary On dropdown option click applies the sorting
     */
    _onMenuOptionClick(e) {
        e.preventDefault();

        const option = e.currentTarget;
        const optionText = option.textContent.trim();
        const value = option.getAttribute(Constants.SORTABLE_MENU_VALUE_ATTR);
        const menu = option.closest(Constants.SORTABLE_MENU_SELECTOR);
        const title = menu.querySelector(Constants.SORTABLE_MENU_TITLE_SELECTOR);
        const matchedTh = this._ths.filter((th) => th.getAttribute(Constants.SORTABLE_SORT_BIND_ATTR) === value)[0];
        const menuOptions = menu.querySelectorAll(Constants.SORTABLE_MENU_OPTION_SELECTOR);

        if (matchedTh) {
            this._runSortActions(option, matchedTh, menuOptions);
        }

        // Update dropdown title if the attribute is present
        if (menu.getAttribute(Constants.SORTABLE_MENU_UPDATE_TITLE_ATTR)) {
            title.textContent = optionText;
        }

        // Close the dropdown when an option is selected
        menu.open = false;

        this._handleMenuFeedbackLabel(optionText);
    }

    /**
     * @method _runSortActions
     * @summary Runs the sorting actions
     */
    _runSortActions(target, targetTh = target, sortItems = this._ths) {
        const dir = this._getSortingDirection(target);
        this._applySort(targetTh, dir);
        this._setActiveSort(sortItems, target);
        if (this._tbody) {
            this._trackPositionUpdater.update([...this._tbody.rows]);
        }
        targetTh.setAttribute(Constants.SORTABLE_SORT_DIR_ATTR, dir);
        const thClickEvt = new CustomEvent(Constants.SORT_EVENT_NAME);
        window.dispatchEvent(thClickEvt);
    }

    /**
     * @method _applySort
     * @summary Contains the sorting main logic
     */
    _applySort(th, dir) {
        if (!this._tbody) { return; }

        // get the array rows in an array, so we can sort them...
        const rows = [...this._tbody.rows];

        if (rows.length === 0) return;

        let columnIndex = this._ths.indexOf(th);

        // get index of the cell we want to sort by when the th index doesn't match the cell index
        const targetCol = th.getAttribute(Constants.SORTABLE_SORT_BIND_ATTR);
        if (targetCol) {
            const cells = [...rows[0].cells];
            const index = cells.findIndex((cell) => cell.getAttribute(Constants.SORTABLE_SORT_COL_NAME) === targetCol);
            if (index !== -1) {
                columnIndex = index;
            }
        }

        const reverse = (dir === Sortable.SORT_UP);

        // sort them using custom built in array sort.
        rows.sort((a, b) => {
            const x = this._getValue((reverse ? a : b).cells[columnIndex]).trim();
            const y = this._getValue((reverse ? b : a).cells[columnIndex]).trim();

            return Number.isNaN(x - y) ? x.localeCompare(y) : x - y;
        });

        // Make a clone without content
        const cloneTbody = this._tbody.cloneNode();

        // Build a sorted table body and replace the old one.
        while (rows.length) {
            cloneTbody.appendChild(rows.splice(0, 1)[0]);
        }

        // And finally insert the end result and update tbody
        this._table.replaceChild(cloneTbody, this._tbody);
        this._tbody = cloneTbody;
    }

    /**
     * @method _setActiveSort
     * @summary Adds the data-sort-active attribute to the active element in th or menu option
     */
    _setActiveSort(elements, clickedSort) {
        elements.forEach((el) => {
            if (el === clickedSort) {
                el.setAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR, true);
            } else {
                el.removeAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR);
            }
        });
    }

    /**
     * @method _getSortingDirection
     * @summary Gets the clicked element specified sorting direcion, default is up
     */
    _getSortingDirection(clickedElement) {
        const isSortUp = (clickedElement.getAttribute(Constants.SORTABLE_SORT_DIR_ATTR) === Sortable.SORT_UP);
        const dir = (isSortUp) ? Sortable.SORT_DOWN : Sortable.SORT_UP;
        return dir;
    }

    /**
     * @method _getValue
     * @summary Gets the sort values from the table cells
     */
    _getValue(element) {
        return element.getAttribute(Constants.SORTABLE_SORT_ATTR) || element.textContent.trim();
    }

    /**
     * @method _handleMenuFeedbackLabel
     * @summary Displays a feedback label if the elements are present
     */
    _handleMenuFeedbackLabel(optionText) {
        if (this._feedbackCntr) {
            this._feedbackCntr.setAttribute(Constants.SORTABLE_MENU_HAS_VALUE_ATTR, true);
        }

        if (this._feedbackValue) {
            this._feedbackValue.textContent = optionText;
        }
    }
}
