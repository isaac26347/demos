import Sortable from '../../js/sortable.es6';
import Constants from '../../js/constants.es6';

describe('Sortable', () => {
    let container;
    let sortable;

    beforeEach(() => {
        Fixtour.html('src/rebrand/ca_sg_sortable/tests/unit/fixtures/sortable.html');

        container = document.querySelector(Constants.SORTABLE_WRAPPER_SELECTOR);
    });

    afterEach(() => {
        container = null;
        sortable = null;
        Fixtour.clear();
    });

    describe('When initializing without an element as argument', () => {
        it('should not initialize the listeners', () => {
            window.addEventListener = jest.fn();

            expect(window.addEventListener).not.toBeCalled();

            new Sortable();

            expect(window.addEventListener).not.toBeCalled();
        });

        it('should not throw an error if there is no tbody', () => {
            sortable = new Sortable(container);
            sortable._tbody = null;

            sortable._ths[2].click();
            expect(() => sortable._applySort(sortable._ths[2], 'up')).not.toThrow();
        });
    });

    describe('When initializing and no table is found', () => {
        it('should not proceed with script\'s execution', () => {
            sortable = new Sortable(container);

            sortable._table = null;
            sortable._bindElements = jest.fn();
            sortable._bindMethods = jest.fn();
            sortable._bindEvents = jest.fn();

            expect(sortable._bindElements).not.toBeCalled();
            expect(sortable._bindMethods).not.toBeCalled();
            expect(sortable._bindEvents).not.toBeCalled();
        });
    });

    describe(`When clicking on a table header element`, () => {
        it(`should add an active attribute only to the clicked table header`, () => {
            sortable = new Sortable(container);

            sortable._ths[2].click(); // click on Amount th

            expect(sortable._ths[2]).toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR, 'true');

            expect(sortable._ths[0]).not.toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR);
            expect(sortable._ths[1]).not.toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR);
        });

        it('should dispatch the sort event', () => {
            sortable = new Sortable(container);
            const expectedEvent = new CustomEvent(Constants.SORT_EVENT_NAME);
            window.dispatchEvent = jest.fn();

            sortable._ths[2].click(); // click on Amount th

            expect(window.dispatchEvent).toHaveBeenCalledWith(expectedEvent);
        });

        describe(`and the element doesn't have a data-sort-dir attribute defined`, () => {
            it('should sort the table with the default direction (alphabetic)', () => {
                sortable = new Sortable(container);

                sortable._ths[1].click(); // click on Rating th

                const expectedRowValues = [
                    ['Endurance', '1.6', '200'],
                    ['Toco', '2.5', '3000'],
                    ['Carshield', '3.9', '50'],
                    ['Olive', '4.3', '400'],
                ];

                [...sortable._tbody.rows].forEach((row, rowIndex) => {
                    [...row.cells].forEach((cell, cellIndex) => {
                        expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                    });
                });
            });
        });

        describe(`and the element has specified a data-sort-dir attribute`, () => {
            it('should sort the table with the custom direction', () => {
                sortable = new Sortable(container);

                sortable._ths[2].click(); // click on Amount th

                const expectedRowValues = [
                    ['Toco', '2.5', '3000'],
                    ['Olive', '4.3', '400'],
                    ['Endurance', '1.6', '200'],
                    ['Carshield', '3.9', '50'],
                ];

                [...sortable._tbody.rows].forEach((row, rowIndex) => {
                    [...row.cells].forEach((cell, cellIndex) => {
                        expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                    });
                });
            });
        });
    });

    describe('When clicking on a sorting option in the dropdown menu', () => {
        it('should add an active attribute only to the clicked option in the menu', () => {
            sortable = new Sortable(container);

            sortable._menuOptions[2].click(); // Rating - Highest to Lowest

            expect(sortable._menuOptions[2]).toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR, 'true');

            expect(sortable._menuOptions[0]).not.toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR);
            expect(sortable._menuOptions[1]).not.toHaveAttribute(Constants.SORTABLE_SORT_ACTIVE_ATTR);
        });

        it('should keep the dropdown menu title after an option has been clicked', () => {
            const menuTitle = document.querySelector(Constants.SORTABLE_MENU_TITLE_SELECTOR);
            sortable = new Sortable(container);

            expect(menuTitle).toHaveTextContent('Sort by');

            sortable._menuOptions[2].click(); // Rating - Highest to Lowest

            expect(menuTitle).toHaveTextContent('Sort by');
        });

        describe(`and there is an option to make the menu title dynamic`, () => {
            it('should change the dropdown title to the option selected value', () => {
                const sortMenu = document.querySelector(Constants.SORTABLE_MENU_SELECTOR);
                const sortMenuTitle = document.querySelector(Constants.SORTABLE_MENU_TITLE_SELECTOR);

                sortMenu.setAttribute(Constants.SORTABLE_MENU_UPDATE_TITLE_ATTR, true);

                sortable = new Sortable(container);

                expect(sortMenuTitle).toHaveTextContent('Sort by');

                sortable._menuOptions[2].click(); // Rating - Highest to Lowest

                expect(sortMenuTitle).toHaveTextContent('Rating - Highest to Lowest');
            });
        });

        describe(`and the element doesn't have a data-sort-dir attribute defined`, () => {
            it('should sort the table with the default direction (alphabetic)', () => {
                sortable = new Sortable(container);

                sortable._menuOptions[0].removeAttribute(Constants.SORTABLE_SORT_DIR_ATTR);

                sortable._menuOptions[0].click(); // Brand - Highest to Lowest

                const expectedRowValues = [ // Ascendant
                    ['Carshield', '3.9', '50'],
                    ['Endurance', '1.6', '200'],
                    ['Olive', '4.3', '400'],
                    ['Toco', '2.5', '3000'],
                ];

                [...sortable._tbody.rows].forEach((row, rowIndex) => {
                    [...row.cells].forEach((cell, cellIndex) => {
                        expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                    });
                });
            });
        });

        describe(`and the element has a data-sort-dir attribute specified`, () => {
            it('should sort the table with custom direction', () => {
                sortable = new Sortable(container);

                sortable._menuOptions[0].click(); // Brand - Highest to Lowest

                const expectedRowValues = [ // Descendent
                    ['Toco', '2.5', '3000'],
                    ['Olive', '4.3', '400'],
                    ['Endurance', '1.6', '200'],
                    ['Carshield', '3.9', '50'],
                ];

                [...sortable._tbody.rows].forEach((row, rowIndex) => {
                    [...row.cells].forEach((cell, cellIndex) => {
                        expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                    });
                });
            });
        });

        describe(`and there's a feedback container element`, () => {
            it('should display the sorting title in the feedback container', () => {
                sortable = new Sortable(container);
                sortable._menuOptions[3].click(); // Rating - Lowest to Highest

                expect(sortable._feedbackCntr).toHaveTextContent('Sorted by Rating - Lowest to Highest');
                expect(sortable._feedbackValue).toHaveTextContent('Rating - Lowest to Highest');
            });

            it('should add an attribute to the feedback after an option has been clicked', () => {
                sortable = new Sortable(container);
                expect(sortable._feedbackCntr).not.toHaveAttribute(Constants.SORTABLE_MENU_HAS_VALUE_ATTR);

                sortable._menuOptions[3].click(); // Rating - Lowest to Highest

                expect(sortable._feedbackCntr).toHaveAttribute(Constants.SORTABLE_MENU_HAS_VALUE_ATTR, 'true');
            });
        });
    });

    describe(`When the cells have a data-sort attribute`, () => {
        it('should sort by the value specified in that attribute', () => {
            document.querySelector(`[data-sort="Endurance"]`).textContent = 'z';
            document.querySelector(`[data-sort="Olive"]`).textContent = 'b';
            document.querySelector(`[data-sort="Toco"]`).textContent = 'a';
            document.querySelector(`[data-sort="Carshield"]`).textContent = 'm';

            sortable = new Sortable(container);

            sortable._ths[0].click(); // click on Brand th

            const expectedRowValues = [
                ['m', '3.9', '50'], // carshield
                ['z', '1.6', '200'], // endurance
                ['b', '4.3', '400'], // olive
                ['a', '2.5', '3000'], // toco
            ];

            [...sortable._tbody.rows].forEach((row, rowIndex) => {
                [...row.cells].forEach((cell, cellIndex) => {
                    expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                });
            });
        });
    });

    describe(`When the table header items don't match the cells`, () => {
        describe(`When clicking on a table header element`, () => {
            it(`should sort the table properly`, () => {
                const demo2 = document.querySelector('.js-sort-demo-2');
                sortable = new Sortable(demo2);
                sortable._ths[1].click();

                const expectedRowValues = [
                    ['Endurance', 'info', '1.6', '200'],
                    ['Toco', 'info', '2.5', '3000'],
                    ['Carshield', 'info', '3.9', '50'],
                    ['Olive', 'info', '4.3', '400'],
                ];

                [...sortable._tbody.rows].forEach((row, rowIndex) => {
                    [...row.cells].forEach((cell, cellIndex) => {
                        expect(cell.textContent.trim()).toEqual(expectedRowValues[rowIndex][cellIndex]);
                    });
                });
            });

            it('should not throw an error if there are no rows', () => {
                sortable = new Sortable(container);
                sortable._tbody.innerHTML = '';
                expect(() => sortable._ths[1].click()).not.toThrow();
            });
        });
    });
});
