import DynamicTable from '../../js/dynamic-table.es6';
import Constants from '../../js/constants.es6';

describe('DynamicTable', () => {
    let table;

    beforeEach(() => {
        Fixtour.html('src/rebrand/ca_sg_dynamic_table/tests/unit/fixtures/dynamic-table-fixture.html');
        table = document.querySelector(Constants.SELECTORS.container);
    });

    afterEach(() => {
        table = null;
        Fixtour.clear();
    });

    describe('When the user clicks on a pin element', () => {
        let carshieldPin;

        beforeEach(() => {
            new DynamicTable(table);

            carshieldPin = table.querySelectorAll(Constants.SELECTORS.pin)[2];
        });

        it('should swap the current pinned element with the clicked column', () => {
            carshieldPin.click();

            const pinnedCol = table.querySelector(Constants.SELECTORS.tbColPinned);
            const clickedCol = table.querySelectorAll(Constants.SELECTORS.tbCol)[1];

            expect(pinnedCol.querySelector('.dynmc-tb__cell-brnd-name').innerHTML).toContain('CarShield');
            expect(pinnedCol.querySelector('.dynmc-tb__img').src).toContain('carshield-logo_widget_logo.webp');
            expect(pinnedCol.querySelector('.dynmc-tb__rtng-lnk').innerHTML).toContain('8,192 reviews');

            expect(clickedCol.querySelector('.dynmc-tb__cell-brnd-name').innerHTML).toContain('Endurance');
            expect(clickedCol.querySelector('.dynmc-tb__img').src).toContain('endurance-auto-warranty_logo_24735_widget_logo.webp');
            expect(clickedCol.querySelector('.dynmc-tb__rtng-lnk').innerHTML).toContain('9,435 reviews');
        });

        describe('and the userDB script has loaded (window.CAUApiEvent)', () => {
            it('should call the refreshTargets method', () => {
                window.CAUApiEvent = {
                    refreshTargets: jest.fn(),
                };

                carshieldPin.click();

                expect(window.CAUApiEvent.refreshTargets).toHaveBeenCalledWith(table);
            });
        });
    });

    describe('When there are no tables in the page', () => {
        it(`should not continue the script`, () => {
            expect(() => new DynamicTable()).not.toThrow();
        });
    });

    describe('When there are no pinned classes in the page', () => {
        it(`should not break the script`, () => {
            Array.from(document.querySelectorAll(Constants.SELECTORS.tbCol)).forEach((tbCol) => {
                tbCol.classList.remove(Constants.CLASSES.tbCol);
            });
            Array.from(document.querySelectorAll(Constants.SELECTORS.tbColPinned)).forEach((tbColPinned) => {
                tbColPinned.classList.remove(Constants.CLASSES.tbColPinned);
            });

            new DynamicTable(table);

            table.querySelectorAll(Constants.SELECTORS.pin)[1].click();
            expect(() => new DynamicTable(table)).not.toThrow();
        });
    });

    describe('When the user clicks on the customize button', () => {
        it('should open the filter slide panel', () => {
            const openEventName = 'com.ca.slide.panel.dynamic_table_filter.popup.open'
            const handler = jest.fn();
            window.addEventListener(openEventName, handler);
            const customizeBtn = document.querySelector(Constants.SELECTORS.btnCustomize);
            new DynamicTable(table);
            customizeBtn.click();
            expect(handler.mock.calls[0][0].type).toEqual(openEventName);
        });
    });

    describe('When the user clicks on the filter checkboxes inputs', () => {
        describe('and the total checkboxes selected is greater than 1', () => {
            it('should enable the save button', () => {
                const filterChk = document.querySelector(Constants.SELECTORS.filterChk);
                const filterSaveBtn = document.querySelector(Constants.SELECTORS.btnFilterSave);
                new DynamicTable(table);
                filterChk.click();
                expect(table.querySelectorAll(Constants.SELECTORS.filterChkChecked).length).toEqual(5);
                expect(filterSaveBtn.disabled).toEqual(false);
            });
        });
        describe('and the total checkboxes selected is 0', () => {
            it('should disable the save button', () => {
                const filterChkAll = document.querySelectorAll(Constants.SELECTORS.filterChk);
                const filterSaveBtn = document.querySelector(Constants.SELECTORS.btnFilterSave);
                new DynamicTable(table);
                filterChkAll.forEach((filterChk) => {
                    filterChk.click();
                });
                expect(table.querySelectorAll(Constants.SELECTORS.filterChkChecked).length).toEqual(0);
                expect(filterSaveBtn.disabled).toEqual(true);
            });
        });
    });

    describe('When the user clicks on the clear button', () => {
        it('should uncheck all the checkboxes and disable the save button', () => {
            const filterSaveBtn = document.querySelector(Constants.SELECTORS.btnFilterSave);
            const filterClearBtn = document.querySelector(Constants.SELECTORS.btnFilterClear);
            new DynamicTable(table);
            filterClearBtn.click();
            expect(table.querySelectorAll(Constants.SELECTORS.filterChkChecked).length).toEqual(0);
            expect(filterSaveBtn.disabled).toEqual(true);
        });
    });

    describe('When the user clicks on the save button', () => {
        it('should filter the table features, close the filter slide panel and add the counter attribute', () => {
            const filterChkAll = document.querySelectorAll(Constants.SELECTORS.filterChk);
            const handler = jest.fn();
            window.addEventListener(Constants.EVENTS.FILTER_CLOSE, handler);
            const saveBtn = document.querySelector(Constants.SELECTORS.btnFilterSave);
            new DynamicTable(table);

            filterChkAll[0].click(); // uncheck "Number of plans"
            filterChkAll[2].click(); // uncheck "Waiting period"

            saveBtn.click();

            // filter tables features
            const nonMatchingCells1 = table.querySelectorAll(`[${Constants.ATTRIBUTES.featureId}="2"]`);
            const matchingCells1 = table.querySelectorAll(`[${Constants.ATTRIBUTES.featureId}="1"]`);
            const matchingCells2 = table.querySelectorAll(`[${Constants.ATTRIBUTES.featureId}="3"]`);

            matchingCells1.forEach((cell) => {
                expect(cell.classList.contains(Constants.CLASSES.hide)).toEqual(true);
            });
            matchingCells2.forEach((cell) => {
                expect(cell.classList.contains(Constants.CLASSES.hide)).toEqual(true);
            });

            nonMatchingCells1.forEach((cell) => {
                expect(cell.classList.contains(Constants.CLASSES.hide)).toEqual(false);
            });

            // closes slide panel
            expect(handler.mock.calls[0][0].type).toEqual(Constants.EVENTS.FILTER_CLOSE);

            // adds counter attribute
            const filterChkChecked = document.querySelectorAll(Constants.SELECTORS.filterChkChecked);
            expect(filterChkChecked.length).toBe(4);

            const counterEl = document.querySelector(`[${Constants.ATTRIBUTES.featureCounter}]`)
            expect(counterEl.getAttribute(Constants.ATTRIBUTES.featureCounter)).toEqual('4');
        });
    });
});
