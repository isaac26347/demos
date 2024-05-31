import Constants from './constants.es6';
import DynamicTable from './dynamic-table.es6';

const init = () => {
    const elements = document.querySelectorAll(Constants.SELECTORS.container);

    elements.forEach((element) => {
        new DynamicTable(element);
    });
};

window.addEventListener(Constants.EVENTS.INIT_EVENT_NAME, () => init());

init();
